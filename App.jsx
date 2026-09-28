import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Switch,
  Modal,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import { supabase } from './supabaseClient';
import { statusDe, STATUS_LABEL, STATUS_COLOR } from './utils/status';

const FILTROS = [
  ['todos', 'Todas'],
  ['pendente', 'Pendentes'],
  ['sem_carimbo', 'Sem carimbo'],
  ['rasurada', 'Rasuradas'],
  ['ok', 'Em conformidade'],
];

const VAZIA = {
  codigo: '',
  titulo: '',
  revisao: '',
  data_aquisicao: '',
  carimbo_copia_controlada: true,
  estado_fisico: 'boa',
  local_arquivo: '',
  ultima_verificacao: '',
  verificado_por: '',
  observacoes: '',
};

export default function App() {
  const [normas, setNormas] = useState([]);
  const [filtro, setFiltro] = useState('todos');
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(VAZIA);

  const carregar = useCallback(async () => {
    const { data, error } = await supabase.from('normas').select('*').order('codigo');
    if (!error) setNormas(data || []);
  }, []);

  useEffect(() => {
    carregar();
    const canal = supabase
      .channel('normas-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'normas' }, carregar)
      .subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
  }, [carregar]);

  const contagens = normas.reduce((acc, n) => {
    const s = statusDe(n);
    acc[s] = (acc[s] || 0) + 1;
    acc.todos = (acc.todos || 0) + 1;
    return acc;
  }, {});

  const listaFiltrada = normas.filter((n) => filtro === 'todos' || statusDe(n) === filtro);

  function abrirNova() {
    setEditando(null);
    setForm(VAZIA);
    setModalAberto(true);
  }
  function abrirEdicao(n) {
    setEditando(n.id);
    setForm({ ...VAZIA, ...n });
    setModalAberto(true);
  }

  async function salvar() {
    if (!form.codigo.trim()) {
      Alert.alert('Informe o código da norma');
      return;
    }
    const payload = { ...form, atualizado_em: new Date().toISOString() };
    if (editando) {
      await supabase.from('normas').update(payload).eq('id', editando);
    } else {
      await supabase.from('normas').insert({ ...payload, criado_em: new Date().toISOString() });
    }
    setModalAberto(false);
    carregar();
  }

  async function excluir() {
    if (!editando) return;
    await supabase.from('normas').delete().eq('id', editando);
    setModalAberto(false);
    carregar();
  }

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.h1}>Controle de Normas</Text>
        <Text style={styles.sub}>Cópias controladas impressas do laboratório</Text>
      </View>

      <View style={styles.toolbar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtros}>
          {FILTROS.map(([key, label]) => (
            <Pressable
              key={key}
              onPress={() => setFiltro(key)}
              style={[styles.filtroBtn, filtro === key && styles.filtroBtnAtivo]}
            >
              <Text style={[styles.filtroTxt, filtro === key && styles.filtroTxtAtivo]}>
                {label} ({contagens[key] || 0})
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <Pressable style={styles.btnPrimario} onPress={abrirNova}>
          <Text style={styles.btnPrimarioTxt}>+ Nova norma</Text>
        </Pressable>
      </View>

      <FlatList
        data={listaFiltrada}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={<Text style={styles.vazio}>Nenhuma norma nesse filtro.</Text>}
        renderItem={({ item }) => {
          const s = statusDe(item);
          return (
            <Pressable style={styles.card} onPress={() => abrirEdicao(item)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitulo}>
                  {item.codigo} — {item.titulo}
                </Text>
                <Text style={styles.cardSub}>
                  Revisão {item.revisao || '—'} · {item.local_arquivo || 'local não informado'}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: STATUS_COLOR[s] + '22' }]}>
                <Text style={[styles.badgeTxt, { color: STATUS_COLOR[s] }]}>
                  {STATUS_LABEL[s]}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />

      <Modal
        visible={modalAberto}
        transparent
        animationType="fade"
        onRequestClose={() => setModalAberto(false)}
      >
        <View style={styles.overlay}>
          <ScrollView style={styles.modal} contentContainerStyle={{ padding: 22 }}>
            <Text style={styles.h2}>{editando ? 'Editar norma' : 'Nova norma'}</Text>

            <Campo
              label="Código da norma"
              value={form.codigo}
              onChangeText={(v) => setForm({ ...form, codigo: v })}
              placeholder="Ex: NBR 6118"
            />
            <Campo
              label="Título"
              value={form.titulo}
              onChangeText={(v) => setForm({ ...form, titulo: v })}
            />
            <View style={styles.linha}>
              <Campo
                style={{ flex: 1 }}
                label="Revisão/edição"
                value={form.revisao}
                onChangeText={(v) => setForm({ ...form, revisao: v })}
              />
              <Campo
                style={{ flex: 1 }}
                label="Local onde fica arquivada"
                value={form.local_arquivo}
                onChangeText={(v) => setForm({ ...form, local_arquivo: v })}
              />
            </View>
            <View style={styles.linha}>
              <Campo
                style={{ flex: 1 }}
                label="Data de aquisição"
                value={form.data_aquisicao}
                onChangeText={(v) => setForm({ ...form, data_aquisicao: v })}
                placeholder="AAAA-MM-DD"
              />
              <Campo
                style={{ flex: 1 }}
                label="Última verificação"
                value={form.ultima_verificacao}
                onChangeText={(v) => setForm({ ...form, ultima_verificacao: v })}
                placeholder="AAAA-MM-DD"
              />
            </View>

            <View style={styles.linhaSwitch}>
              <Text style={styles.label}>Tem carimbo de cópia controlada</Text>
              <Switch
                value={form.carimbo_copia_controlada}
                onValueChange={(v) => setForm({ ...form, carimbo_copia_controlada: v })}
              />
            </View>

            <Text style={styles.label}>Estado físico</Text>
            <View style={styles.linha}>
              {['boa', 'rasurada'].map((op) => (
                <Pressable
                  key={op}
                  onPress={() => setForm({ ...form, estado_fisico: op })}
                  style={[styles.opcaoBtn, form.estado_fisico === op && styles.opcaoBtnAtiva]}
                >
                  <Text
                    style={[styles.opcaoTxt, form.estado_fisico === op && styles.opcaoTxtAtiva]}
                  >
                    {op === 'boa' ? 'Boa condição' : 'Rasurada/danificada'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Campo
              label="Verificado por"
              value={form.verificado_por}
              onChangeText={(v) => setForm({ ...form, verificado_por: v })}
            />
            <Campo
              label="Observações"
              value={form.observacoes}
              onChangeText={(v) => setForm({ ...form, observacoes: v })}
              multiline
            />

            <View style={styles.acoes}>
              {editando && (
                <Pressable onPress={excluir}>
                  <Text style={styles.btnExcluir}>Excluir</Text>
                </Pressable>
              )}
              <View style={{ flexDirection: 'row', gap: 10, marginLeft: 'auto' }}>
                <Pressable onPress={() => setModalAberto(false)}>
                  <Text style={styles.btnCancelar}>Cancelar</Text>
                </Pressable>
                <Pressable style={styles.btnPrimario} onPress={salvar}>
                  <Text style={styles.btnPrimarioTxt}>Salvar</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function Campo({ label, style, multiline, ...props }) {
  return (
    <View style={[styles.campo, style]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        multiline={multiline}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F3F4F1', minHeight: '100vh' },
  header: { padding: 24 },
  h1: { fontSize: 22, fontWeight: '700', color: '#1C2321' },
  sub: { fontSize: 14, color: '#5B655F', marginTop: 2 },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 14,
    gap: 10,
  },
  filtros: { flexDirection: 'row' },
  filtroBtn: {
    borderWidth: 1,
    borderColor: '#D8DBD5',
    backgroundColor: '#fff',
    borderRadius: 7,
    paddingVertical: 7,
    paddingHorizontal: 12,
    marginRight: 6,
  },
  filtroBtnAtivo: { backgroundColor: '#2F4B3F', borderColor: '#2F4B3F' },
  filtroTxt: { fontSize: 13, color: '#5B655F' },
  filtroTxtAtivo: { color: '#fff', fontWeight: '600' },
  btnPrimario: { backgroundColor: '#2F4B3F', borderRadius: 7, paddingVertical: 9, paddingHorizontal: 16 },
  btnPrimarioTxt: { color: '#fff', fontWeight: '600', fontSize: 14 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D8DBD5',
    borderRadius: 10,
    padding: 14,
    marginHorizontal: 24,
    marginBottom: 8,
  },
  cardTitulo: { fontSize: 15, fontWeight: '600', color: '#1C2321' },
  cardSub: { fontSize: 12.5, color: '#5B655F', marginTop: 2 },
  badge: { borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10 },
  badgeTxt: { fontSize: 12, fontWeight: '600' },
  vazio: { textAlign: 'center', color: '#5B655F', marginTop: 60 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(20,24,22,0.45)',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: '5vh',
  },
  modal: { backgroundColor: '#fff', borderRadius: 12, width: '92%', maxWidth: 480, maxHeight: '90vh' },
  h2: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  campo: { marginBottom: 13 },
  label: { fontSize: 12.5, fontWeight: '600', color: '#5B655F', marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderColor: '#D8DBD5',
    borderRadius: 7,
    paddingVertical: 9,
    paddingHorizontal: 10,
    fontSize: 14,
    backgroundColor: '#F3F4F1',
  },
  inputMultiline: { minHeight: 60, textAlignVertical: 'top' },
  linha: { flexDirection: 'row', gap: 10 },
  linhaSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  opcaoBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D8DBD5',
    borderRadius: 7,
    paddingVertical: 9,
    alignItems: 'center',
    marginBottom: 14,
  },
  opcaoBtnAtiva: { backgroundColor: '#2F4B3F', borderColor: '#2F4B3F' },
  opcaoTxt: { fontSize: 13, color: '#5B655F' },
  opcaoTxtAtiva: { color: '#fff', fontWeight: '600' },
  acoes: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  btnExcluir: { color: '#A4302A', fontSize: 14 },
  btnCancelar: { color: '#5B655F', fontSize: 14, paddingVertical: 9 },
});
