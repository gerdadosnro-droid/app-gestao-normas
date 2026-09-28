# Controle de Normas

App web (React Native + React Native Web, empacotado com Vite) para controlar as
cópias controladas impressas das normas técnicas do laboratório.

## Rodando localmente

```bash
npm install
cp .env.example .env   # preencha com a URL e a chave anon do seu projeto Supabase
npm run dev
```

## Tabela no Supabase

Rode isso no SQL editor do seu projeto Supabase:

```sql
create table normas (
  id uuid primary key default gen_random_uuid(),
  codigo text not null,
  titulo text,
  revisao text,
  local_arquivo text,
  data_aquisicao date,
  ultima_verificacao date,
  carimbo_copia_controlada boolean default true,
  estado_fisico text default 'boa',
  verificado_por text,
  observacoes text,
  criado_em timestamptz,
  atualizado_em timestamptz
);

alter table normas enable row level security;

-- Política simples liberando leitura/escrita para quem tiver a anon key.
-- Como é um app interno atrás da rede corporativa, isso já resolve por ora;
-- se quiser restringir por usuário/login depois, é só trocar essa policy.
create policy "acesso interno" on normas for all using (true) with check (true);
```

## Como funciona o status de cada norma

- **Rasurada/danificada** — estado físico marcado como "rasurada"
- **Sem carimbo** — falta o carimbo de cópia controlada
- **Revisão pendente** — mais de 12 meses sem verificação (ou nunca verificada)
- **Em conformidade** — carimbada, em boa condição e verificada nos últimos 12 meses

O prazo de 12 meses está em `src/utils/status.js` (constante `DIAS_PARA_VENCER`), caso
queira mudar.

## Build para produção

```bash
npm run build
```

Gera uma pasta `dist/` estática (HTML/CSS/JS) que pode ser hospedada em qualquer
servidor web — não precisa de Node rodando em produção.