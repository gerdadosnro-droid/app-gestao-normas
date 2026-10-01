export type EstadoFisico = 'boa' | 'rasurada';

export interface Norma {
  id: string;
  codigo: string;
  titulo: string | null;
  revisao: string | null;
  local_arquivo: string | null;
  data_aquisicao: string | null;
  ultima_verificacao: string | null;
  carimbo_copia_controlada: boolean;
  estado_fisico: EstadoFisico;
  verificado_por: string | null;
  observacoes: string | null;
  baixada_em: string | null;
  motivo_baixa: string | null;
}

/** Valores do formulário: tudo texto, '' vira null ao gravar. */
export interface NormaForm {
  codigo: string;
  titulo: string;
  revisao: string;
  local_arquivo: string;
  data_aquisicao: string;
  ultima_verificacao: string;
  carimbo_copia_controlada: boolean;
  estado_fisico: EstadoFisico;
  verificado_por: string;
  observacoes: string;
}
