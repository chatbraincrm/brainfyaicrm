# SUPABASE_MIGRATION_PLAN.md — Brainfy CRM

> Criado em: 2026-06-08  
> Status: **PLANO TÉCNICO — nenhuma alteração executada ainda**  
> Origem: `ipktjvfhykxwwczuvokx.supabase.co` (Supabase Cloud / Lovable)  
> Destino: `https://api.brainfyai.com.br` (Self-hosted Supabase)

---

## Visão Geral da Migração

```
┌─────────────────────────────────────────────────────────────────┐
│  ANTES                          DEPOIS                          │
│                                                                 │
│  Frontend ──► supabase.co       Frontend ──► api.brainfyai.com.br │
│  Edge Fns  ──► supabase.co      Edge Fns  ──► api.brainfyai.com.br │
│  .env VITE_SUPABASE_URL=        .env VITE_SUPABASE_URL=         │
│    ipktjvfhykxwwczuvokx           api.brainfyai.com.br          │
│    .supabase.co                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Escopo total:**
- 169 tabelas + 2 views
- 226 migrations + 7 arquivos base (migrations_shared)
- 120 Edge Functions + 1 diretório `_shared`
- 523 políticas RLS
- 100 triggers
- 7 storage buckets
- 9 extensões PostgreSQL obrigatórias
- 11 variáveis de ambiente a configurar
- 6 arquivos de código com referências hardcoded a corrigir

---

## ALERTA CRÍTICO — Dependências Lovable Ocultas

Antes de qualquer ação, é fundamental conhecer as dependências que vão além de variáveis de ambiente:

### 1. `auth-email-hook` — Dependência de serviço externo Lovable

```
supabase/functions/auth-email-hook/index.ts
```

Este Edge Function usa dois pacotes npm proprietários da Lovable:

```typescript
import { parseEmailWebhookPayload } from 'npm:@lovable.dev/email-js'
import { WebhookError, verifyWebhookRequest } from 'npm:@lovable.dev/webhooks-js'
```

**O que fazem:** Enviam os e-mails transacionais de autenticação do Supabase Auth
(confirmação de cadastro, magic link, recuperação de senha, convites).

**Impacto se não resolvido:** Após a migração, cadastro, login por magic link e
recuperação de senha podem parar de funcionar ou continuar dependendo da
infraestrutura Lovable (risco de descontinuação).

**Solução recomendada:** Reescrever o `auth-email-hook` usando `RESEND_API_KEY`
diretamente (o Resend já está configurado no sistema via `RESEND_API_KEY`).
Os templates de e-mail já existem em `supabase/functions/_shared/email-templates/`.
Esta reescrita é parte obrigatória da migração.

### 2. `LOVABLE_API_KEY` — Chave de autenticação interna

A variável `LOVABLE_API_KEY` é usada em **15+ Edge Functions** de duas formas:

**Forma A — Autenticação de chamadas internas:** O próprio sistema usa essa chave
para verificar que quem chama a função é autorizado (ex: `preview-transactional-email`
verifica `Authorization: Bearer <LOVABLE_API_KEY>`).

**Forma B — Chamadas para API Lovable:** Algumas funções usam a chave para
chamar endpoints de IA da Lovable (ex: `analyze-conversation`, `generate-agent-ai`).

**Solução:** Para Forma A, manter a variável com qualquer valor secreto arbitrário
(trocar o nome ou manter o mesmo). Para Forma B, as funções já suportam OpenAI/outros
providers — verificar se o roteamento de IA via `org_ai_routing` já está configurado.

### 3. `LOVABLE_SEND_URL` — URL do serviço de envio de e-mail

Usado em `process-email-queue` como endpoint para envio de e-mails transacionais.
Quando não definido, usa `https://api.lovable.dev` como padrão hardcoded na biblioteca.

**Solução:** Após reescrever `auth-email-hook` e `process-email-queue` para usar
Resend diretamente, essa variável se torna irrelevante.

---

## PARTE 1 — PRÉ-MIGRAÇÃO: VERIFICAÇÃO E COMPARAÇÃO

### 1.1 Verificar se o Supabase próprio já possui as tabelas

Conectar ao banco self-hosted e listar tabelas existentes:

```sql
-- Executar no Studio em: https://studio.brainfyai.com.br/project/default/editor
-- Ou via psql:
-- psql "postgresql://postgres:<senha>@<host-db>:5432/postgres"

-- Listar todas as tabelas no schema public
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Contar total
SELECT COUNT(*)
FROM information_schema.tables
WHERE table_schema = 'public';
```

**Resultado esperado se banco está vazio:** 0 tabelas  
**Resultado esperado se migrations já foram aplicadas:** 169+ tabelas  
**Se encontrar tabelas:** comparar com lista da auditoria antes de continuar

### 1.2 Verificar extensões PostgreSQL disponíveis no self-hosted

```sql
-- Verificar quais extensões estão disponíveis
SELECT name, default_version, installed_version, comment
FROM pg_available_extensions
WHERE name IN (
  'pg_cron', 'pg_net', 'pg_stat_statements', 'pg_trgm',
  'pgcrypto', 'pgmq', 'supabase_vault', 'uuid-ossp', 'vector'
)
ORDER BY name;
```

**Todas as 9 extensões são obrigatórias.** Se alguma estiver ausente, ela precisa
ser instalada no servidor PostgreSQL ANTES de rodar as migrations.

| Extensão | Schema | Finalidade | Crítica? |
|----------|--------|-----------|---------|
| `pg_cron` | pg_catalog | Jobs agendados (crons de campanha, cadência) | ✅ Sim |
| `pg_net` | extensions | HTTP calls do banco para Edge Functions | ✅ Sim |
| `pg_stat_statements` | extensions | Monitoramento de queries | ⚠️ Moderada |
| `pg_trgm` | public | Busca por similaridade de texto | ✅ Sim |
| `pgcrypto` | extensions | Criptografia (tokens, hashes) | ✅ Sim |
| `pgmq` | pgmq | Message queue (fila de e-mails) | ✅ Sim |
| `supabase_vault` | vault | Armazenamento de secrets no banco | ⚠️ Moderada |
| `uuid-ossp` | extensions | Geração de UUIDs | ✅ Sim |
| `vector` | public | Embeddings de IA (memória semântica de leads) | ✅ Sim |

### 1.3 Comparar migrations do projeto com o banco real

```sql
-- No banco self-hosted, verificar quais migrations já foram aplicadas
-- (Supabase rastreia via tabela supabase_migrations.schema_migrations)
SELECT version, name, statements
FROM supabase_migrations.schema_migrations
ORDER BY version;

-- Contar total
SELECT COUNT(*) FROM supabase_migrations.schema_migrations;
```

**No projeto local**, listar migrations pendentes:

```bash
# Na máquina local, no diretório do projeto:
ls supabase/migrations/ | wc -l
# Esperado: 226

ls supabase/migrations_shared/ | wc -l
# Esperado: 7
```

**Comparação:** Se `supabase_migrations.schema_migrations` estiver vazia no
self-hosted, todas as 226 migrations estão pendentes. Se houver alguma aplicada,
identificar qual foi a última e aplicar somente as posteriores.

### 1.4 Verificar conectividade com o self-hosted

```bash
# Testar se a API responde
curl -I https://api.brainfyai.com.br/rest/v1/ \
  -H "apikey: <ANON_KEY_DO_SELF_HOSTED>"

# Resposta esperada: HTTP/2 200 ou 401 (confirma que a API está no ar)

# Testar se o Studio está acessível
curl -I https://studio.brainfyai.com.br/project/default
# Resposta esperada: HTTP/2 200
```

---

## PARTE 2 — OBTER CREDENCIAIS DO SELF-HOSTED

### 2.1 Coletar as chaves do Supabase próprio

No Studio em `https://studio.brainfyai.com.br/project/default`:

Navegar em: **Settings → API**

Anotar:
- **Project URL:** `https://api.brainfyai.com.br`
- **anon (public) key:** `eyJ...` (JWT, começa com `eyJ`)
- **service_role key:** `eyJ...` (JWT, começa com `eyJ`, NUNCA expor no frontend)
- **JWT Secret:** string aleatória usada para assinar todos os tokens

> ⚠️ **IMPORTANTE:** O `anon_key` do self-hosted é um JWT padrão.
> O projeto atual usa `sb_publishable_ZMumbCtrx9vW90iwIJ9ZGg_W9wV8kJX` que é
> um formato proprietário da Lovable — ele NÃO funcionará no self-hosted.
> O `anon_key` do self-hosted terá formato `eyJ...`.

### 2.2 Obter connection string do banco de dados

No Studio: **Settings → Database**

Copiar a **Connection String** no formato:
```
postgresql://postgres:<password>@<db-host>:5432/postgres
```

Esta string será usada pelo Supabase CLI para aplicar migrations.

---

## PARTE 3 — APLICAR MIGRATIONS COM SEGURANÇA

### 3.1 Configurar o Supabase CLI para o self-hosted

```bash
# Na máquina local, no diretório raiz do projeto:

# Instalar Supabase CLI (se não instalado)
npm install -g supabase

# Verificar versão
supabase --version

# Fazer login (não é obrigatório para self-hosted com DB direto)
# supabase login  ← só necessário para Supabase Cloud

# Verificar arquivo de configuração atual
cat supabase/config.toml
# Atualmente tem: project_id = "ipktjvfhykxwwczuvokx"
# Será necessário atualizar para: project_id = "default"
# (MAS apenas antes de fazer o deploy das funções — não alterar agora)
```

### 3.2 Estratégia de aplicação das migrations

O projeto tem **dois conjuntos de migrations** que devem ser aplicados em ordem:

```
Ordem de execução:
1. supabase/migrations_shared/00000000000001_extensions_and_types.sql
2. supabase/migrations_shared/00000000000002_tables.sql
3. supabase/migrations_shared/00000000000003_constraints_and_indexes.sql
4. supabase/migrations_shared/00000000000004_functions.sql
5. supabase/migrations_shared/00000000000005_triggers_and_views.sql
6. supabase/migrations_shared/00000000000006_rls_policies.sql
7. supabase/migrations_shared/00000000000007_seeds.sql
   ↓
8. supabase/migrations/20260109155040_*.sql  (primeira migration incremental)
   ...
233. supabase/migrations/20260607085214_*.sql (última migration incremental)
```

### 3.3 Método A — Via Supabase CLI (recomendado)

```bash
# Opção 1: Usando db push com connection string direta
supabase db push \
  --db-url "postgresql://postgres:<senha>@<db-host>:5432/postgres"

# O CLI vai:
# 1. Conectar ao banco
# 2. Verificar quais migrations já foram aplicadas (via supabase_migrations.schema_migrations)
# 3. Aplicar apenas as pendentes, em ordem cronológica
# 4. Registrar cada migration aplicada na tabela de controle
```

> **Atenção:** O CLI aplica arquivos de `supabase/migrations/` mas NÃO aplica
> automaticamente `supabase/migrations_shared/`. Os arquivos `_shared` precisam
> ser aplicados manualmente ANTES do `db push`.

### 3.4 Método B — Aplicação manual dos migrations_shared

```bash
# Aplicar os 7 arquivos base na ordem correta via psql:
PGPASSWORD="<senha>" psql \
  "postgresql://postgres@<db-host>:5432/postgres" \
  -f supabase/migrations_shared/00000000000001_extensions_and_types.sql

PGPASSWORD="<senha>" psql \
  "postgresql://postgres@<db-host>:5432/postgres" \
  -f supabase/migrations_shared/00000000000002_tables.sql

PGPASSWORD="<senha>" psql \
  "postgresql://postgres@<db-host>:5432/postgres" \
  -f supabase/migrations_shared/00000000000003_constraints_and_indexes.sql

PGPASSWORD="<senha>" psql \
  "postgresql://postgres@<db-host>:5432/postgres" \
  -f supabase/migrations_shared/00000000000004_functions.sql

PGPASSWORD="<senha>" psql \
  "postgresql://postgres@<db-host>:5432/postgres" \
  -f supabase/migrations_shared/00000000000005_triggers_and_views.sql

PGPASSWORD="<senha>" psql \
  "postgresql://postgres@<db-host>:5432/postgres" \
  -f supabase/migrations_shared/00000000000006_rls_policies.sql

PGPASSWORD="<senha>" psql \
  "postgresql://postgres@<db-host>:5432/postgres" \
  -f supabase/migrations_shared/00000000000007_seeds.sql

# Depois aplicar as 226 migrations incrementais via CLI:
supabase db push \
  --db-url "postgresql://postgres:<senha>@<db-host>:5432/postgres"
```

### 3.5 Verificar erros durante a aplicação

```bash
# Capturar output completo em arquivo de log
supabase db push \
  --db-url "postgresql://postgres:<senha>@<db-host>:5432/postgres" \
  2>&1 | tee migration_log_$(date +%Y%m%d_%H%M%S).txt

# Se houver erro, identificar qual migration falhou:
grep -i "error\|failed\|ERROR" migration_log_*.txt
```

---

## PARTE 4 — VALIDAÇÃO DO BANCO APÓS MIGRATION

### 4.1 Validar as 169 tabelas

```sql
-- Executar no SQL Editor do Studio self-hosted

-- Contar tabelas no schema public
SELECT COUNT(*) as total_tables
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- Esperado: 169

-- Listar todas e comparar com o inventário
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Verificar views
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;
-- Esperado: inbox_count_conversations, inbox_list_conversations
```

Script de validação completo para as tabelas críticas:

```sql
-- Verificar tabelas do core do negócio
SELECT
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN '✅' ELSE '❌' END AS organizations,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN '✅' ELSE '❌' END AS profiles,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leads') THEN '✅' ELSE '❌' END AS leads,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pipeline_stages') THEN '✅' ELSE '❌' END AS pipeline_stages,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN '✅' ELSE '❌' END AS products,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaigns') THEN '✅' ELSE '❌' END AS campaigns,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'webhooks') THEN '✅' ELSE '❌' END AS webhooks,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'evolution_instances') THEN '✅' ELSE '❌' END AS evolution_instances,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') THEN '✅' ELSE '❌' END AS subscriptions,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'platform_settings') THEN '✅' ELSE '❌' END AS platform_settings;
```

### 4.2 Validar as 523 políticas RLS

```sql
-- Contar total de policies
SELECT COUNT(*) as total_policies
FROM pg_policies
WHERE schemaname = 'public';
-- Esperado: próximo de 523

-- Verificar RLS habilitado nas tabelas críticas
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('leads', 'organizations', 'profiles', 'webhooks',
                    'campaigns', 'products', 'pipeline_stages')
ORDER BY tablename;
-- Todas devem ter rowsecurity = true

-- Listar policies por tabela (amostra)
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname
LIMIT 50;
```

### 4.3 Validar os 100 triggers

```sql
-- Contar total de triggers
SELECT COUNT(*) as total_triggers
FROM information_schema.triggers
WHERE trigger_schema = 'public';
-- Esperado: próximo de 100

-- Listar triggers críticos
SELECT trigger_name, event_object_table, event_manipulation, action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN (
    'trg_booking_status_history',
    'trg_prevent_super_admin_lock_reset',
    'trg_fill_default_sector'
  )
ORDER BY trigger_name;
-- Todos devem aparecer

-- Verificar triggers de updated_at (devem ser ~60+)
SELECT COUNT(*) as updated_at_triggers
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE 'update_%_updated_at';
```

### 4.4 Validar extensões instaladas

```sql
SELECT name, installed_version
FROM pg_available_extensions
WHERE name IN (
  'pg_cron', 'pg_net', 'pg_stat_statements', 'pg_trgm',
  'pgcrypto', 'pgmq', 'supabase_vault', 'uuid-ossp', 'vector'
)
AND installed_version IS NOT NULL
ORDER BY name;
-- Esperado: 9 linhas com installed_version preenchido
```

---

## PARTE 5 — EDGE FUNCTIONS

### 5.1 Configurar o CLI para o self-hosted

Antes de deployar as funções, atualizar `supabase/config.toml`:

```toml
# Alterar de:
project_id = "ipktjvfhykxwwczuvokx"

# Para:
project_id = "default"
```

E adicionar o remote do self-hosted no CLI:

```bash
# Vincular o projeto local ao self-hosted
supabase link \
  --project-ref default \
  --supabase-url https://api.brainfyai.com.br \
  --supabase-key <SERVICE_ROLE_KEY>
```

### 5.2 Fazer deploy de todas as 120 Edge Functions

```bash
# Deploy de todas as funções de uma vez
supabase functions deploy \
  --project-ref default \
  --no-verify-jwt

# OU, se o CLI não suportar --supabase-url diretamente:
SUPABASE_URL=https://api.brainfyai.com.br \
SUPABASE_ANON_KEY=<ANON_KEY> \
supabase functions deploy \
  --project-ref default
```

> **Nota:** O flag `--no-verify-jwt` no CLI só afeta o comportamento padrão.
> As 11 funções com `verify_jwt = false` no `config.toml` precisam ter essa
> configuração respeitada no self-hosted. Verificar se o Supabase self-hosted
> lê o `config.toml` no deploy ou se é necessário configurar via dashboard.

### 5.3 Verificar deploy das funções críticas

```bash
# Testar função pública (sem JWT)
curl -X POST https://api.brainfyai.com.br/functions/v1/webhook-receiver \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
# Esperado: resposta 200 ou erro de validação (não 401/404)

# Testar função autenticada
curl -X POST https://api.brainfyai.com.br/functions/v1/generate-insights \
  -H "Authorization: Bearer <TOKEN_JWT_VALIDO>" \
  -H "Content-Type: application/json" \
  -d '{}'
# Esperado: resposta 200 ou erro de negócio (não 401/404)
```

### 5.4 Funções com `verify_jwt = false` — configuração no self-hosted

Estas 11 funções precisam ser acessíveis sem autenticação:

```
cakto-webhook, doppus-webhook, evolution-webhook, facebook-leads-webhook,
funnel-execute-webhook, hotmart-webhook, instagram-webhook,
meta-whatsapp-webhook, webhook-receiver, whatsapp-webhook
```

No Studio self-hosted, para cada uma: **Edge Functions → [nome] → Settings → Verify JWT → desabilitar**

---

## PARTE 6 — STORAGE BUCKETS

### 6.1 Criar os 7 buckets no self-hosted

Executar no SQL Editor do Studio self-hosted:

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('product-documents', 'product-documents', false, 10485760, null),
  ('materials',         'materials',         true,  null,      null),
  ('cadence-media',     'cadence-media',     true,  null,      null),
  ('help-media',        'help-media',        true,  null,      null),
  ('chat-media',        'chat-media',        true,  54525952,  null),
  ('catalog-media',     'catalog-media',     true,  null,      null),
  ('funnel-assets',     'funnel-assets',     true,  null,      null)
ON CONFLICT (id) DO NOTHING;
```

### 6.2 Verificar buckets criados

```sql
SELECT id, name, public, file_size_limit
FROM storage.buckets
ORDER BY id;
-- Esperado: 7 linhas
```

### 6.3 Políticas de storage

As políticas de storage estão nas migrations incrementais. Após o `db push`,
verificar:

```sql
SELECT bucket_id, name, definition
FROM storage.policies
ORDER BY bucket_id, name;
```

Se não houver policies (as migrations de storage policies podem ter falhado
silenciosamente), aplicar manualmente baseado nos padrões encontrados:

```sql
-- Exemplo: chat-media public read
CREATE POLICY "chat-media public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-media');

-- chat-media authenticated upload
CREATE POLICY "chat-media authenticated upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'chat-media' AND auth.role() = 'authenticated');
```

---

## PARTE 7 — SECRETS E VARIÁVEIS DE AMBIENTE

### 7.1 Secrets obrigatórias das Edge Functions

Configurar no Studio self-hosted em: **Settings → Edge Functions → Secrets**  
Ou via CLI:

```bash
supabase secrets set \
  --project-ref default \
  NOME_DA_SECRET=valor
```

#### Secrets automáticas (injetadas pelo Supabase — não precisam ser configuradas manualmente)

| Secret | Valor injetado automaticamente |
|--------|-------------------------------|
| `SUPABASE_URL` | `https://api.brainfyai.com.br` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key do projeto |
| `SUPABASE_ANON_KEY` | Anon key do projeto |

#### Secrets que DEVEM ser configuradas manualmente

| Secret | Tipo | Onde obter | Prioridade |
|--------|------|-----------|-----------|
| `OPENAI_API_KEY` | API Key | platform.openai.com | 🔴 Crítica — IA para geração, análise, embeddings |
| `RESEND_API_KEY` | API Key | resend.com/api-keys | 🔴 Crítica — envio de e-mails transacionais |
| `SITE_URL` | URL | Própria — ex: `https://app.brainfyai.com.br` | 🔴 Crítica — links em e-mails, bookings |
| `LOVABLE_API_KEY` | Secret arbitrário | Criar qualquer string segura (ex: `openssl rand -hex 32`) | 🟡 Alta — autenticação interna entre funções |
| `FIRECRAWL_API_KEY` | API Key | firecrawl.dev | 🟡 Alta — scraping para IA |
| `BOTCONVERSA_API_KEY` | API Key | Conta BotConversa | 🟡 Alta — integração WhatsApp alternativa |
| `ISICHAT_TOKEN` | Token | Conta Isichat | 🟡 Alta — integração chat |
| `ELEVENLABS_API_KEY` | API Key | elevenlabs.io | 🟢 Média — TTS/voz para IA |
| `LOVABLE_SEND_URL` | URL | Deixar vazio ou apontar para serviço próprio | 🟢 Média — só relevante enquanto `auth-email-hook` usar Lovable libs |

#### Sobre `LOVABLE_API_KEY` após a migração

Esta secret cumpre dois papéis no código atual:

1. **Autenticação interna** (ex: `preview-transactional-email` verifica o header):
   Pode ser qualquer string segreta. Gerar com: `openssl rand -hex 32`

2. **Chamadas para IA via Lovable** (ex: `analyze-conversation`, `generate-agent-ai`):
   Estas funções usam a key como Bearer token para chamadas de IA. Se a Lovable
   descontinuar o serviço, essas funções param de funcionar independente da migração.
   Verificar se essas funções já têm fallback para OpenAI (algumas têm via `org_ai_routing`).

---

## PARTE 8 — CÓDIGO: URLs HARDCODED A CORRIGIR

### 8.1 Mapa completo de referências a corrigir

| Arquivo | Linha / Contexto | Valor atual | Valor correto |
|---------|-----------------|-------------|---------------|
| `src/components/admin/integrations/HotmartConfigManager.tsx:71` | URL de webhook gerada para o usuário | `` `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/hotmart-webhook` `` | `` `https://api.brainfyai.com.br/functions/v1/hotmart-webhook` `` |
| `supabase/functions/create-organization-admin/index.ts:102` | Origin header fallback | `SUPABASE_URL.replace(".supabase.co", ".lovable.app")` | `Deno.env.get('SITE_URL') \|\| SUPABASE_URL` |
| `supabase/functions/webhook-receiver/index.ts:921` | URL de lead gerada em notificação | `` `${SUPABASE_URL?.replace('.supabase.co', '.lovable.app')}/leads/${id}` `` | `` `${Deno.env.get('SITE_URL')}/leads/${id}` `` |
| `supabase/functions/auth-email-hook/index.ts:49` | URL de exemplo para preview de e-mail | `https://vendus.lovable.app` | `https://app.brainfyai.com.br` (ou valor de `SITE_URL`) |
| `supabase/functions/booking-submit/index.ts:291` | URL padrão de booking | `https://salesflow1.lovable.app` | `Deno.env.get('SITE_URL') \|\| 'https://app.brainfyai.com.br'` |
| `src/components/superadmin/FirstAccessSuperAdminModal.tsx:453` | Link de config de e-mail | `https://lovable.dev/projects/f6728bcf...` | Link para o Studio self-hosted ou docs Brainfy |
| `src/components/superadmin/SuperAdminSetupChecklist.tsx:66,68` | Link de config de e-mail | `https://lovable.dev/projects/f6728bcf...` | Link para o Studio self-hosted ou docs Brainfy |

### 8.2 Referências que NÃO precisam ser alteradas (são funcionais, não dependentes do Lovable como infraestrutura)

| Arquivo | Referência | Motivo |
|---------|-----------|--------|
| `src/components/admin/integrations/AIRoutingPanel.tsx` | `'lovable'` como provider de IA | É um identificador de produto no banco de dados, não uma URL |
| `src/components/superadmin/PlatformAIKeysManager.tsx` | `Exclude<PoolProvider, 'lovable'>` | Tipo TypeScript do schema do banco |
| `supabase/functions/auth-email-hook/index.ts` | `npm:@lovable.dev/email-js` | Este arquivo será **reescrito** para usar Resend diretamente |

---

## PARTE 9 — VARIÁVEIS DE AMBIENTE DO FRONTEND

### 9.1 Alterações no arquivo `.env`

```bash
# ESTADO ATUAL (NÃO ALTERAR AINDA):
VITE_SUPABASE_PROJECT_ID="ipktjvfhykxwwczuvokx"
VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_ZMumbCtrx9vW90iwIJ9ZGg_W9wV8kJX"
VITE_SUPABASE_URL="https://ipktjvfhykxwwczuvokx.supabase.co"

# ESTADO ALVO (alterar apenas após banco e funções estarem validados):
VITE_SUPABASE_URL="https://api.brainfyai.com.br"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJ..."  # anon key do self-hosted (formato JWT)
VITE_SUPABASE_PROJECT_ID="default"
```

### 9.2 Onde o cliente Supabase é instanciado

`src/integrations/supabase/client.ts` — lê diretamente das variáveis acima.
Nenhuma alteração de código necessária neste arquivo — apenas as variáveis mudam.

### 9.3 Onde `VITE_SUPABASE_PROJECT_ID` é usado no frontend

```bash
# Verificar todos os usos
grep -rn "VITE_SUPABASE_PROJECT_ID\|SUPABASE_PROJECT_ID" src/ --include="*.ts" --include="*.tsx"
```

Principal uso: `HotmartConfigManager.tsx:71` — constroe URL de webhook para o usuário.
Esta linha também precisa da correção listada na Parte 8.

---

## PARTE 10 — VALIDAÇÃO DE AUTENTICAÇÃO E FUNCIONALIDADES

### 10.1 Autenticação

Após trocar as variáveis de ambiente e fazer rebuild:

| Teste | Ação | Resultado esperado |
|-------|------|-------------------|
| **Cadastro** | Criar novo usuário | E-mail de confirmação chega (depende de `auth-email-hook` ou SMTP configurado) |
| **Login email/senha** | Login com conta existente | Sessão criada, token JWT válido |
| **Login OAuth** | Login com Google/outro provider | Redirect OAuth funciona, sessão criada |
| **Logout** | Clicar em logout | Sessão removida do localStorage |
| **Refresh token** | Aguardar 1h ou forçar expiração | Token renovado automaticamente |
| **Acesso protegido** | Acessar `/admin` sem login | Redirect para login |

> ⚠️ **IMPORTANTE:** Todos os usuários do Supabase Cloud precisarão fazer novo
> login após a migração. As sessões JWT do Cloud são assinadas com o JWT Secret
> do Cloud — o self-hosted usa um secret diferente. Os tokens antigos são inválidos.

### 10.2 Verificação de permissões e RLS

```sql
-- Testar como um usuário específico (substituir pelo UUID de um usuário real)
SET LOCAL role = authenticated;
SET LOCAL request.jwt.claims = '{"sub": "<user-uuid>", "role": "authenticated"}';

-- Tentar SELECT sem org_id — deve retornar vazio (RLS funcionando)
SELECT COUNT(*) FROM leads;

-- Com usuário admin da org, deve retornar dados
-- (precisa de contexto real de autenticação)
```

### 10.3 Validar módulos críticos

| Módulo | Como validar |
|--------|-------------|
| **Organizações** | Criar organização, verificar que isolamento por `org_id` funciona |
| **Usuários / Permissões** | Criar usuário, atribuir role, verificar acesso por role |
| **Leads / CRM** | Criar lead, mover no pipeline, verificar histórico |
| **IA** | Disparar análise de conversa, verificar `ai_usage_logs` |
| **Webhooks** | Enviar POST para `webhook-receiver`, verificar `webhook_logs` |
| **Storage** | Upload de arquivo em `chat-media`, verificar URL pública |
| **Painel Admin** | Acessar `/admin` com conta admin, verificar todas as seções carregam |
| **Edge Functions** | Chamar `generate-insights`, verificar resposta |
| **E-mail** | Cadastro novo usuário, verificar e-mail de confirmação |

---

## PARTE 11 — MIGRAÇÃO DE DADOS EXISTENTES

### 11.1 Dados que não podem ser perdidos

Dependendo do estágio atual do projeto no Supabase Cloud:

| Tabela | Criticidade | Motivo |
|--------|------------|--------|
| `auth.users` | 🔴 Crítica | Contas de usuário — perda = todos precisam criar nova conta |
| `organizations` | 🔴 Crítica | Configurações de tenant, dados de empresa |
| `profiles` | 🔴 Crítica | Dados de perfil vinculados aos usuários |
| `leads` | 🔴 Crítica | Base de contatos do CRM |
| `pipeline_stages` | 🟡 Alta | Configuração do funil de vendas |
| `products` | 🟡 Alta | Produtos configurados |
| `webhooks` | 🟡 Alta | Integrações configuradas |
| `evolution_instances` | 🟡 Alta | Conexões WhatsApp ativas |
| `platform_settings` | 🟡 Alta | Configurações da plataforma SaaS |
| `subscriptions` | 🟡 Alta | Dados de assinatura e billing |
| `campaigns` + `cadences` | 🟡 Alta | Automações ativas |
| Demais tabelas | 🟢 Média | Podem ser reconstruídos operacionalmente |

### 11.2 Como exportar dados do Supabase Cloud

```bash
# Opção A: via Supabase CLI (requer acesso ao Cloud)
supabase db dump \
  --project-ref ipktjvfhykxwwczuvokx \
  --data-only \
  -f dump_data_$(date +%Y%m%d).sql

# Opção B: via pg_dump direto
# A connection string do Cloud está em:
# https://supabase.com/dashboard/project/ipktjvfhykxwwczuvokx/settings/database
pg_dump \
  "postgresql://postgres:<senha>@db.ipktjvfhykxwwczuvokx.supabase.co:5432/postgres" \
  --data-only \
  --format=custom \
  -f dump_data_$(date +%Y%m%d).dump

# Opção C: Tabela por tabela (mais seguro para tabelas críticas)
pg_dump \
  "postgresql://..." \
  --data-only \
  --table=auth.users \
  --table=public.organizations \
  --table=public.profiles \
  --table=public.leads \
  -f dump_critico_$(date +%Y%m%d).sql
```

### 11.3 Como importar dados no self-hosted

```bash
# Após schemas estarem aplicados no self-hosted:
pg_restore \
  --data-only \
  --dbname="postgresql://postgres:<senha>@<db-host>:5432/postgres" \
  dump_data_YYYYMMDD.dump

# OU para dump em SQL:
PGPASSWORD="<senha>" psql \
  "postgresql://postgres@<db-host>:5432/postgres" \
  -f dump_data_YYYYMMDD.sql
```

> **Atenção:** O dump de `auth.users` do Supabase Cloud inclui hashes de senha
> — eles são portáveis entre instâncias PostgreSQL. Os usuários não precisarão
> redefinir senhas, MAS as sessões JWT ativas expiram porque o JWT Secret muda.

---

## PARTE 12 — ROLLBACK

### 12.1 Estratégia de rollback por fase

| Fase | Ação de rollback |
|------|----------------|
| **Antes de trocar .env** | Nenhuma — o sistema ainda usa o Cloud |
| **Após trocar .env, antes de rebuild** | Reverter .env para valores antigos |
| **Após rebuild e deploy** | Reverter .env + redeploy para Cloud |
| **Após migração de dados** | Restaurar backup do Cloud (se fez dump antes) |

### 12.2 Pontos de não-retorno

- **Após deletar o projeto Supabase Cloud:** Não há rollback possível
- **Após revogar tokens do Cloud:** Usuários do Cloud perdem acesso

**Regra:** Só deletar/revogar o projeto Cloud DEPOIS de confirmar que:
1. Self-hosted está 100% funcional
2. Todos os usuários foram notificados e fizeram login no novo sistema
3. Todos os webhooks externos foram atualizados

### 12.3 Manter o Cloud funcionando em paralelo durante a transição

Durante a migração, manter o projeto Cloud ativo. O custo é baixo (ou free tier).
Só desativar quando o self-hosted estiver validado por pelo menos 7 dias em produção.

---

## PARTE 13 — REMOVER DEPENDÊNCIAS DO SUPABASE CLOUD

### 13.1 Após migração confirmada, alterações de código necessárias

**Prioridade 1 — Edge Functions (impacto funcional):**

```
supabase/functions/auth-email-hook/index.ts
  → Reescrever para usar Resend diretamente (remover @lovable.dev/email-js e @lovable.dev/webhooks-js)

supabase/functions/create-organization-admin/index.ts:102
  → Substituir: SUPABASE_URL.replace(".supabase.co", ".lovable.app")
  → Por: Deno.env.get('SITE_URL') || SUPABASE_URL

supabase/functions/webhook-receiver/index.ts:921
  → Substituir: SUPABASE_URL?.replace('.supabase.co', '.lovable.app')
  → Por: Deno.env.get('SITE_URL')

supabase/functions/auth-email-hook/index.ts:49
  → Substituir: "https://vendus.lovable.app"
  → Por: Deno.env.get('SITE_URL') || 'https://app.brainfyai.com.br'

supabase/functions/booking-submit/index.ts:291
  → Substituir: 'https://salesflow1.lovable.app'
  → Por: Deno.env.get('SITE_URL') || 'https://app.brainfyai.com.br'
```

**Prioridade 2 — Frontend (impacto visual/UX):**

```
src/components/admin/integrations/HotmartConfigManager.tsx:71
  → Substituir URL hardcoded *.supabase.co por api.brainfyai.com.br

src/components/superadmin/FirstAccessSuperAdminModal.tsx:453
  → Substituir link lovable.dev por link para docs/studio da Brainfy

src/components/superadmin/SuperAdminSetupChecklist.tsx:66,68
  → Substituir link lovable.dev por link para docs/studio da Brainfy
```

**Prioridade 3 — Config:**

```
supabase/config.toml
  → project_id = "default"
```

### 13.2 Verificação final de dependências

```bash
# Buscar qualquer referência restante ao Supabase Cloud
grep -rn "supabase.co\|ipktjvfhykxwwczuvokx" \
  src/ supabase/functions/ \
  --include="*.ts" --include="*.tsx" --include="*.toml" --include="*.json"

# Buscar referências ao domínio lovable.app
grep -rn "lovable\.app\|lovable\.dev" \
  src/ supabase/functions/ \
  --include="*.ts" --include="*.tsx"

# Resultado esperado após limpeza completa: nenhuma ocorrência
```

---

## PARTE 14 — COMANDOS POR AMBIENTE

### 14.1 Comandos executados LOCALMENTE (na máquina de desenvolvimento)

```bash
# 1. Verificar versão do Supabase CLI
supabase --version

# 2. Verificar conectividade com o self-hosted
curl -I https://api.brainfyai.com.br/rest/v1/ \
  -H "apikey: <ANON_KEY>"

# 3. Linkar projeto ao self-hosted
supabase link \
  --project-ref default \
  --supabase-url https://api.brainfyai.com.br

# 4. Aplicar migrations_shared (via psql ou supabase db execute)
supabase db execute \
  --db-url "postgresql://postgres:<senha>@<db-host>:5432/postgres" \
  -f supabase/migrations_shared/00000000000001_extensions_and_types.sql
# ... repetir para os 7 arquivos

# 5. Aplicar 226 migrations incrementais
supabase db push \
  --db-url "postgresql://postgres:<senha>@<db-host>:5432/postgres"

# 6. Deploy das Edge Functions
supabase functions deploy \
  --project-ref default

# 7. Configurar secrets
supabase secrets set \
  --project-ref default \
  OPENAI_API_KEY=sk-... \
  RESEND_API_KEY=re_... \
  SITE_URL=https://app.brainfyai.com.br \
  LOVABLE_API_KEY=<string-aleatoria-segura> \
  FIRECRAWL_API_KEY=... \
  ELEVENLABS_API_KEY=...

# 8. Build do frontend com novas variáveis
# (Apenas após atualizar .env)
npm run build

# 9. Verificação de lint e tipos
npm run lint
npx tsc --noEmit
```

### 14.2 Comandos executados NO SERVIDOR (self-hosted)

```bash
# No servidor onde o Supabase self-hosted está rodando:

# 1. Verificar status dos serviços Supabase
docker ps | grep supabase  # Se usando Docker
# ou
systemctl status supabase  # Se usando systemd

# 2. Verificar logs das Edge Functions após deploy
docker logs supabase-edge-runtime -f

# 3. Verificar conectividade do banco
psql "postgresql://postgres:<senha>@localhost:5432/postgres" \
  -c "SELECT version();"

# 4. Verificar que extensões estão disponíveis
psql "postgresql://postgres:<senha>@localhost:5432/postgres" \
  -c "SELECT name, installed_version FROM pg_available_extensions WHERE name IN ('pg_cron','pg_net','vector','pgmq') ORDER BY name;"

# 5. Após migrations, verificar tabelas
psql "postgresql://postgres:<senha>@localhost:5432/postgres" \
  -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
```

---

## PARTE 15 — DEPENDÊNCIAS DE JWT SECRET, ANON KEY E SERVICE ROLE KEY

### 15.1 Onde cada chave é usada

| Chave | Usado por | Impacto se trocar |
|-------|----------|-----------------|
| **JWT Secret** | Supabase Auth para assinar todos os tokens de sessão | Todas as sessões ativas ficam inválidas — todos os usuários precisam fazer novo login |
| **anon_key (VITE_SUPABASE_PUBLISHABLE_KEY)** | Frontend (client.ts), funções públicas | Frontend perde acesso ao banco até ser atualizado com a nova key |
| **service_role_key** | Edge Functions (SUPABASE_SERVICE_ROLE_KEY), operações admin | Edge Functions param de funcionar até receber a nova key via secrets |

### 15.2 Partes do sistema que dependem do JWT Secret

- `auth.users` — senha hasheada é separada do JWT Secret (não afetada)
- Sessões de usuário no localStorage (`sb-ipktjvfhykxwwczuvokx-auth-token`) — **invalidadas**
- Tokens de API criados via Supabase — **invalidados**
- Magic links e links de confirmação pendentes — **invalidados**

### 15.3 Procedimento para mínimo impacto

1. Avisar todos os usuários com antecedência: "Você precisará fazer login novamente em [data]"
2. Escolher horário de menor uso (madrugada)
3. Trocar variáveis de ambiente e rebuildar frontend
4. Após rebuild, todos os logins passam para o self-hosted
5. Sessões do Cloud simplesmente expiram — nenhum dado é perdido

---

## PARTE 16 — GARANTIA DE USO EXCLUSIVO DO SELF-HOSTED

### 16.1 Checklist final pós-migração

```bash
# Verificar que nenhum arquivo de código aponta para o Cloud
grep -rn "ipktjvfhykxwwczuvokx\|supabase\.co" \
  src/ supabase/ .env \
  --include="*.ts" --include="*.tsx" --include="*.toml" --include="*.env"
# Resultado esperado: 0 ocorrências

# Verificar que .env aponta para o self-hosted
cat .env | grep VITE_SUPABASE_URL
# Esperado: VITE_SUPABASE_URL="https://api.brainfyai.com.br"

# Verificar que o config.toml usa o project_id correto
cat supabase/config.toml | grep project_id
# Esperado: project_id = "default"

# Verificar que as Edge Functions estão deployadas no self-hosted
curl https://api.brainfyai.com.br/functions/v1/webhook-receiver \
  -X POST -H "Content-Type: application/json" -d '{}'
# Não deve retornar 404
```

### 16.2 Monitoramento pós-migração

No Studio self-hosted (`https://studio.brainfyai.com.br/project/default`):

- **Logs → Auth:** verificar logins e cadastros chegando
- **Logs → Edge Functions:** verificar chamadas às funções
- **Table Editor → webhook_logs:** verificar webhooks chegando
- **Table Editor → ai_usage_logs:** verificar uso de IA

Se qualquer chamada ainda chegar no projeto Cloud (`ipktjvfhykxwwczuvokx`), é
um webhook externo (Hotmart, Evolution, etc.) que ainda usa a URL antiga — atualizar
a URL nos painéis de cada integração.

---

## SEQUÊNCIA SEGURA DE EXECUÇÃO

Esta é a ordem exata recomendada para executar a migração com segurança:

```
╔══════════════════════════════════════════════════════════════════╗
║  FASE 0 — PRÉ-MIGRAÇÃO (sem alterar nada em produção)          ║
╚══════════════════════════════════════════════════════════════════╝

[ ] 0.1  Verificar que o self-hosted está no ar:
         curl -I https://api.brainfyai.com.br/rest/v1/

[ ] 0.2  Coletar anon_key e service_role_key do Studio self-hosted:
         https://studio.brainfyai.com.br/project/default/settings/api

[ ] 0.3  Obter connection string do banco self-hosted:
         https://studio.brainfyai.com.br/project/default/settings/database

[ ] 0.4  Verificar extensões PostgreSQL disponíveis no self-hosted
         (query da Parte 1.2)

[ ] 0.5  Verificar se o banco self-hosted está vazio:
         SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';

[ ] 0.6  FAZER BACKUP completo do Supabase Cloud (pg_dump --data-only)
         ⚠️  NÃO pular este passo — é o único safety net

╔══════════════════════════════════════════════════════════════════╗
║  FASE 1 — SCHEMA: aplicar migrations no self-hosted            ║
╚══════════════════════════════════════════════════════════════════╝

[ ] 1.1  Aplicar os 7 arquivos de migrations_shared (em ordem)
[ ] 1.2  Aplicar as 226 migrations incrementais via: supabase db push
[ ] 1.3  Validar 169 tabelas (query da Parte 4.1)
[ ] 1.4  Validar RLS habilitada nas tabelas críticas (query da Parte 4.2)
[ ] 1.5  Validar triggers (query da Parte 4.3)
[ ] 1.6  Criar os 7 storage buckets (SQL da Parte 6.1)

╔══════════════════════════════════════════════════════════════════╗
║  FASE 2 — DADOS: migrar registros existentes do Cloud           ║
╚══════════════════════════════════════════════════════════════════╝

[ ] 2.1  Exportar dados do Supabase Cloud (pg_dump --data-only)
[ ] 2.2  Importar dados no self-hosted (pg_restore)
[ ] 2.3  Verificar contagem de registros nas tabelas críticas

╔══════════════════════════════════════════════════════════════════╗
║  FASE 3 — EDGE FUNCTIONS: deploy no self-hosted                ║
╚══════════════════════════════════════════════════════════════════╝

[ ] 3.1  Atualizar supabase/config.toml: project_id = "default"
[ ] 3.2  Linkar CLI ao self-hosted: supabase link
[ ] 3.3  Deploy das 120 funções: supabase functions deploy
[ ] 3.4  Desabilitar JWT nas 11 funções de webhook (via Studio ou CLI)
[ ] 3.5  Configurar todas as secrets (Parte 7.1)
[ ] 3.6  Testar webhook-receiver e uma função autenticada

╔══════════════════════════════════════════════════════════════════╗
║  FASE 4 — CÓDIGO: corrigir URLs hardcoded                       ║
╚══════════════════════════════════════════════════════════════════╝

[ ] 4.1  Corrigir HotmartConfigManager.tsx (URL de webhook)
[ ] 4.2  Corrigir create-organization-admin/index.ts (replace .lovable.app)
[ ] 4.3  Corrigir webhook-receiver/index.ts (replace .lovable.app)
[ ] 4.4  Corrigir auth-email-hook/index.ts (URL de preview + reescrita p/ Resend)
[ ] 4.5  Corrigir booking-submit/index.ts (URL padrão)
[ ] 4.6  Corrigir SuperAdminSetupChecklist.tsx e FirstAccessSuperAdminModal.tsx
[ ] 4.7  Redeploy das funções corrigidas: supabase functions deploy

╔══════════════════════════════════════════════════════════════════╗
║  FASE 5 — FRONTEND: apontar para o self-hosted                  ║
╚══════════════════════════════════════════════════════════════════╝

[ ] 5.1  Atualizar .env:
           VITE_SUPABASE_URL="https://api.brainfyai.com.br"
           VITE_SUPABASE_PUBLISHABLE_KEY="eyJ..." (anon_key self-hosted)
           VITE_SUPABASE_PROJECT_ID="default"
[ ] 5.2  npm run build (verificar 0 erros)
[ ] 5.3  npm run lint  (verificar 0 errors)
[ ] 5.4  Deploy do frontend no servidor

╔══════════════════════════════════════════════════════════════════╗
║  FASE 6 — VALIDAÇÃO FUNCIONAL                                   ║
╚══════════════════════════════════════════════════════════════════╝

[ ] 6.1  Testar cadastro de novo usuário (recebe e-mail?)
[ ] 6.2  Testar login, logout, sessão persistente
[ ] 6.3  Testar acesso ao painel admin
[ ] 6.4  Criar lead e mover no pipeline
[ ] 6.5  Testar upload de arquivo (storage)
[ ] 6.6  Testar recebimento de webhook externo
[ ] 6.7  Testar geração de IA (generate-insights ou analyze-conversation)
[ ] 6.8  Verificar logs no Studio self-hosted

╔══════════════════════════════════════════════════════════════════╗
║  FASE 7 — LIMPEZA: atualizar integrações externas               ║
╚══════════════════════════════════════════════════════════════════╝

[ ] 7.1  Atualizar URL do webhook Hotmart:
           https://ipktjvfhykxwwczuvokx.supabase.co/functions/v1/hotmart-webhook
           → https://api.brainfyai.com.br/functions/v1/hotmart-webhook

[ ] 7.2  Atualizar URL do webhook Evolution/WhatsApp

[ ] 7.3  Atualizar URL do webhook Meta/Instagram

[ ] 7.4  Atualizar URL do webhook Cakto

[ ] 7.5  Atualizar quaisquer outros webhooks configurados
         (verificar tabela `webhooks` no banco para ver todos os ativos)

[ ] 7.6  Aguardar 7 dias em produção sem incidentes

╔══════════════════════════════════════════════════════════════════╗
║  FASE 8 — DESCOMISSIONAMENTO do Supabase Cloud                  ║
╚══════════════════════════════════════════════════════════════════╝

[ ] 8.1  Confirmar que 100% do tráfego está no self-hosted
         (monitorar logs do Cloud por 7 dias — não deve ter requests)
[ ] 8.2  Fazer dump final do Cloud como arquivo permanente
[ ] 8.3  Remover/pausar o projeto no Supabase Cloud
[ ] 8.4  Verificação final: grep por ipktjvfhykxwwczuvokx no codebase → 0 resultados
```

---

## ESTIMATIVA DE TEMPO

| Fase | Estimativa | Dependência |
|------|-----------|------------|
| Fase 0 — Pré-migração | 1-2h | Acesso ao servidor e Studio |
| Fase 1 — Schema | 30-60min | Banco self-hosted vazio |
| Fase 2 — Dados | 1-4h | Volume de dados existente |
| Fase 3 — Edge Functions | 30-60min | CLI configurado |
| Fase 4 — Código | 2-4h | Reescrita do auth-email-hook inclusa |
| Fase 5 — Frontend | 15-30min | .env atualizado |
| Fase 6 — Validação | 2-4h | Todas as fases anteriores |
| Fase 7 — Limpeza | 1-2h | Acesso aos painéis de integração |
| Fase 8 — Descomissionamento | 10min + 7 dias de observação | Fase 7 concluída |

**Total estimado:** 1-2 dias de trabalho técnico + 7 dias de observação em produção.
