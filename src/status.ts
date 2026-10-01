import type { Norma } from './types';

export const DIAS_PARA_VENCER = 365;
export const DIAS_AVISO = 30;

export type Status = 'ok' | 'vencendo' | 'pendente' | 'sem_carimbo' | 'rasurada';

export const STATUS_LABEL: Record<Status, string> = {
  ok: 'Em conformidade',
  vencendo: 'Vence em breve',
  pendente: 'Revisão pendente',
  sem_carimbo: 'Sem carimbo',
  rasurada: 'Rasurada/danificada',
};

export const STATUS_COLOR: Record<Status, string> = {
  ok: '#2F6B3F',
  vencendo: '#B8860B',
  pendente: '#e46c26',
  sem_carimbo: '#A4302A',
  rasurada: '#A4302A',
};

export function hojeISO(): string {
  return new Date().toLocaleDateString('sv-SE'); // AAAA-MM-DD no fuso local
}

export function statusDe(n: Norma): Status {
  if (n.estado_fisico === 'rasurada') return 'rasurada';
  if (!n.carimbo_copia_controlada) return 'sem_carimbo';
  if (!n.ultima_verificacao) return 'pendente';
  const dias = (Date.now() - new Date(n.ultima_verificacao + 'T00:00:00').getTime()) / 86400000;
  if (dias > DIAS_PARA_VENCER) return 'pendente';
  if (dias > DIAS_PARA_VENCER - DIAS_AVISO) return 'vencendo';
  return 'ok';
}
