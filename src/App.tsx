import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, FlatList, ActivityIndicator } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { configurado, supabase } from './supabase';
import { hojeISO, statusDe, STATUS_COLOR, STATUS_LABEL } from './status';
import type { Status } from './status';
import type { Norma, NormaForm } from './types';
import { aviso, confirmar, pedirTexto } from './dialogs';
import { Login } from './components/Login';
import { NormaModal } from './components/NormaModal';
import { s } from './styles';

type Filtro = Status | 'todos';
const FILTROS: [Filtro, string][] = [
  ['todos', 'Todas'], ['pendente', 'Pendentes'], ['vencendo', 'Vencendo'],
  ['sem_carimbo', 'Sem carimbo'], ['rasurada', 'Rasuradas'], ['ok', 'Em conformidade'],
];

const nulo = (v: string) => (v.trim() === '' ? null : v.trim());

export default function App() {
  const [sessao, setSessao] = useState<Session | null>(null);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSessao(data.session); setPronto(true); });
    const { data } = supabase.auth.onAuthStateChange((_e, sess) => setSessao(sess));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!configurado) {
    return (
      <View style={s.centro}>
        <Text style={s.h2}>Configuração pendente</Text>
        <Text style={s.sub}>Copie .env.example para .env e preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY. Depois reinicie o npm run dev.</Text>
      </View>
    );
  }
  if (!pronto) return <View style={s.centro}><ActivityIndicator size="large" color="#2F4B3F" /></View>;
  if (!sessao) return <Login />;
  return <Normas operador={sessao.user.email ?? ''} />;
}

function Normas({ operador }: { operador: string }) {
  const [normas, setNormas] = useState<Norma[]>([]);
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<Norma | null>(null);

  const carregar = useCallback(async () => {
    const { data, error } = await supabase.from('normas').select('*').is('baixada_em', null).order('codigo');
    if (error) aviso('Erro ao carregar', error.message);
    else setNormas((data ?? []) as Norma[]);
    setCarregando(false);
  }, []);

  useEffect(() => {
    carregar();
    const canal = supabase.channel('normas-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'normas' }, carregar)
      .subscribe();
    return () => { supabase.removeChannel(canal); };
  }, [carregar]);

  const contagens = useMemo(() => {
    const c: Record<string, number> = { todos: normas.length };
    normas.forEach((n) => { const st = statusDe(n); c[st] = (c[st] ?? 0) + 1; });
    return c;
  }, [normas]);

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return normas.filter((n) =>
      (filtro === 'todos' || statusDe(n) === filtro) &&
      (!q || `${n.codigo} ${n.titulo ?? ''}`.toLowerCase().includes(q)));
  }, [normas, filtro, busca]);

  function abrir(n: Norma | null) { setEditando(n); setAberto(true); }

  async function salvar(f: NormaForm) {
    const dados = {
      codigo: f.codigo.trim(), titulo: nulo(f.titulo), revisao: nulo(f.revisao), local_arquivo: nulo(f.local_arquivo),
      data_aquisicao: nulo(f.data_aquisicao), ultima_verificacao: nulo(f.ultima_verificacao),
      carimbo_copia_controlada: f.carimbo_copia_controlada, estado_fisico: f.estado_fisico,
      verificado_por: nulo(f.verificado_por), observacoes: nulo(f.observacoes),
    };
    const { error } = editando
      ? await supabase.from('normas').update(dados).eq('id', editando.id)
      : await supabase.from('normas').insert(dados);
    if (error) {
      aviso('Erro ao salvar', error.code === '23505' ? 'Já existe uma norma ativa com esse código e revisão.' : error.message);
      return;
    }
    setAberto(false);
    carregar();
  }

  async function verificar(n: Norma) {
    const { error } = await supabase.from('normas')
      .update({ ultima_verificacao: hojeISO(), verificado_por: operador }).eq('id', n.id);
    if (error) aviso('Erro ao registrar verificação', error.message);
    else carregar();
  }

  async function baixar(n: Norma) {
    if (!(await confirmar(`Dar baixa em ${n.codigo}? Ela sai da lista, mas o histórico é mantido.`))) return;
    const { error } = await supabase.from('normas')
      .update({ baixada_em: new Date().toISOString(), motivo_baixa: pedirTexto('Motivo da baixa (opcional):') }).eq('id', n.id);
    if (error) aviso('Erro ao dar baixa', error.message);
    else { setAberto(false); carregar(); }
  }

  return (
    <View style={s.page}>
      <View style={s.header}>
        <View>
          <Text style={s.h1}>Controle de Normas</Text>
          <Text style={s.sub}>Cópias controladas impressas do laboratório</Text>
        </View>
        <Pressable onPress={() => supabase.auth.signOut()}>
          <Text style={s.btnLink}>Sair ({operador})</Text>
        </Pressable>
      </View>

      <View style={s.toolbar}>
        <TextInput style={s.busca} value={busca} onChangeText={setBusca} placeholder="Buscar por código ou título" />
        <Pressable style={s.btn} onPress={() => abrir(null)}><Text style={s.btnTxt}>+ Nova norma</Text></Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filtros}>
        {FILTROS.map(([k, label]) => (
          <Pressable key={k} onPress={() => setFiltro(k)} style={[s.filtroBtn, filtro === k && s.filtroBtnAtivo]}>
            <Text style={[s.filtroTxt, filtro === k && s.filtroTxtAtivo]}>{label} ({contagens[k] ?? 0})</Text>
          </Pressable>
        ))}
      </ScrollView>

      {carregando ? (
        <ActivityIndicator size="large" color="#2F4B3F" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={lista}
          keyExtractor={(n) => n.id}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={<Text style={s.vazio}>Nenhuma norma nesse filtro.</Text>}
          renderItem={({ item }) => {
            const st = statusDe(item);
            return (
              <Pressable style={s.card} onPress={() => abrir(item)}>
                <View style={s.cardLinha}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.cardTitulo}>{item.codigo}{item.titulo ? ` — ${item.titulo}` : ''}</Text>
                    <Text style={s.cardSub}>
                      Revisão {item.revisao || '—'} · {item.local_arquivo || 'local não informado'} · Verificada em {item.ultima_verificacao ?? 'nunca'}
                    </Text>
                  </View>
                  <View style={[s.badge, { backgroundColor: STATUS_COLOR[st] + '22' }]}>
                    <Text style={[s.badgeTxt, { color: STATUS_COLOR[st] }]}>{STATUS_LABEL[st]}</Text>
                  </View>
                </View>
                <Pressable onPress={() => verificar(item)} style={{ marginTop: 8 }}>
                  <Text style={s.btnLink}>✓ Registrar verificação hoje</Text>
                </Pressable>
              </Pressable>
            );
          }}
        />
      )}

      {aberto && (
        <NormaModal
          key={editando?.id ?? 'nova'}
          norma={editando}
          operador={operador}
          onFechar={() => setAberto(false)}
          onSalvar={salvar}
          onBaixar={editando ? () => baixar(editando) : undefined}
        />
      )}
    </View>
  );
}
