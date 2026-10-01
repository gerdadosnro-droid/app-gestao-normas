import { useState } from 'react';
import { View, Text, Pressable, ScrollView, Switch, Modal, ActivityIndicator } from 'react-native';
import type { Norma, NormaForm } from '../types';
import { Campo, CampoData } from './Campos';
import { aviso } from '../dialogs';
import { s } from '../styles';

const VAZIA: NormaForm = {
  codigo: '', titulo: '', revisao: '', local_arquivo: '', data_aquisicao: '', ultima_verificacao: '',
  carimbo_copia_controlada: true, estado_fisico: 'boa', verificado_por: '', observacoes: '',
};

function doForm(n: Norma | null, operador: string): NormaForm {
  if (!n) return { ...VAZIA, verificado_por: operador };
  return {
    codigo: n.codigo, titulo: n.titulo ?? '', revisao: n.revisao ?? '', local_arquivo: n.local_arquivo ?? '',
    data_aquisicao: n.data_aquisicao ?? '', ultima_verificacao: n.ultima_verificacao ?? '',
    carimbo_copia_controlada: n.carimbo_copia_controlada, estado_fisico: n.estado_fisico,
    verificado_por: n.verificado_por ?? '', observacoes: n.observacoes ?? '',
  };
}

interface Props {
  norma: Norma | null;            // null = nova
  operador: string;
  onFechar: () => void;
  onSalvar: (v: NormaForm) => Promise<void>;
  onBaixar?: () => void;
}

export function NormaModal({ norma, operador, onFechar, onSalvar, onBaixar }: Props) {
  const [f, setF] = useState<NormaForm>(() => doForm(norma, operador));
  const [salvando, setSalvando] = useState(false);
  const set = <K extends keyof NormaForm>(k: K, v: NormaForm[K]) => setF((x) => ({ ...x, [k]: v }));

  async function salvar() {
    if (!f.codigo.trim()) return aviso('Atenção', 'Informe o código da norma.');
    setSalvando(true);
    try { await onSalvar(f); } finally { setSalvando(false); }
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onFechar}>
      <View style={s.overlay}>
        <ScrollView style={s.modal} contentContainerStyle={{ padding: 22 }}>
          <Text style={s.h2}>{norma ? 'Editar norma' : 'Nova norma'}</Text>
          <Campo label="Código da norma" value={f.codigo} onChangeText={(v) => set('codigo', v)} placeholder="Ex: NBR 6118" />
          <Campo label="Título" value={f.titulo} onChangeText={(v) => set('titulo', v)} />
          <View style={s.linha}>
            <Campo estilo={{ flex: 1 }} label="Revisão/edição" value={f.revisao} onChangeText={(v) => set('revisao', v)} />
            <Campo estilo={{ flex: 1 }} label="Local arquivada" value={f.local_arquivo} onChangeText={(v) => set('local_arquivo', v)} />
          </View>
          <View style={s.linha}>
            <CampoData estilo={{ flex: 1 }} label="Data de aquisição" value={f.data_aquisicao} onChange={(v) => set('data_aquisicao', v)} />
            <CampoData estilo={{ flex: 1 }} label="Última verificação" value={f.ultima_verificacao} onChange={(v) => set('ultima_verificacao', v)} />
          </View>
          <View style={s.linhaSwitch}>
            <Text style={s.label}>Tem carimbo de cópia controlada</Text>
            <Switch value={f.carimbo_copia_controlada} onValueChange={(v) => set('carimbo_copia_controlada', v)} />
          </View>
          <Text style={s.label}>Estado físico</Text>
          <View style={s.linha}>
            {(['boa', 'rasurada'] as const).map((op) => (
              <Pressable key={op} onPress={() => set('estado_fisico', op)} style={[s.opcaoBtn, f.estado_fisico === op && s.opcaoBtnAtiva]}>
                <Text style={[s.opcaoTxt, f.estado_fisico === op && s.opcaoTxtAtiva]}>
                  {op === 'boa' ? 'Boa condição' : 'Rasurada/danificada'}
                </Text>
              </Pressable>
            ))}
          </View>
          <Campo label="Verificado por" value={f.verificado_por} onChangeText={(v) => set('verificado_por', v)} />
          <Campo label="Observações" value={f.observacoes} onChangeText={(v) => set('observacoes', v)} multiline />
          <View style={s.acoes}>
            {onBaixar && <Pressable onPress={onBaixar} disabled={salvando}><Text style={s.btnPerigo}>Dar baixa</Text></Pressable>}
            <View style={{ flex: 1 }} />
            <Pressable onPress={onFechar} disabled={salvando}><Text style={s.btnCancelar}>Cancelar</Text></Pressable>
            <Pressable style={s.btn} onPress={salvar} disabled={salvando}>
              {salvando ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.btnTxt}>Salvar</Text>}
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
