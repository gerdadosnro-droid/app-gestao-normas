import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const configurado = Boolean(url && key && !url.includes('SEU-PROJETO'));

// URL fictícia evita que o app quebre ao abrir sem .env; a tela avisa o que falta.
export const supabase = createClient(configurado ? url! : 'http://localhost', configurado ? key! : 'x');
