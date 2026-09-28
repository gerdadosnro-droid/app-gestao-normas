const DIAS_PARA_VENCER = 365;

export function statusDe(norma) {
  if (norma.estado_fisico === 'rasurada') return 'rasurada';
  if (!norma.carimbo_copia_controlada) return 'sem_carimbo';
  if (!norma.ultima_verificacao) return 'pendente';
  const dias =
    (Date.now() - new Date(norma.ultima_verificacao).getTime()) / 86400000;
  if (dias > DIAS_PARA_VENCER) return 'pendente';
  return 'ok';
}

export const STATUS_LABEL = {
  ok: 'Em conformidade',
  pendente: 'Revisão pendente',
  sem_carimbo: 'Sem carimbo',
  rasurada: 'Rasurada/danificada',
};

export const STATUS_COLOR = {
  ok: '#2F6B3F',
  pendente: '#e46c26',
  sem_carimbo: '#A4302A',
  rasurada: '#A4302A',
};
