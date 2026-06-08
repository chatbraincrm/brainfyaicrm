# SUPABASE_AUDIT.md — Brainfy CRM

> Gerado em: 2026-06-08  
> Status: **APENAS LEITURA — nenhuma alteração foi feita**

---

## 1. Identificação do Projeto Atual

| Item | Valor |
|------|-------|
| **Project ID** | `ipktjvfhykxwwczuvokx` |
| **URL ativa** | `https://ipktjvfhykxwwczuvokx.supabase.co` |
| **Hospedagem atual** | Supabase Cloud (supabase.com) |
| **Hospedagem alvo** | Self-hosted em `https://api.brainfyai.com.br` |
| **Status da migração** | ❌ NÃO migrado — ainda apontando para Supabase Cloud |

**Conclusão:** O projeto **ainda está usando o Supabase Cloud** criado originalmente via Lovable. O servidor self-hosted em `api.brainfyai.com.br` existe, mas o frontend e as Edge Functions ainda apontam para o projeto cloud.

---

## 2. Variáveis de Ambiente

### Arquivo atual: `.env`

```env
VITE_SUPABASE_PROJECT_ID="ipktjvfhykxwwczuvokx"
VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_ZMumbCtrx9vW90iwIJ9ZGg_W9wV8kJX"
VITE_SUPABASE_URL="https://ipktjvfhykxwwczuvokx.supabase.co"
```

### Como são carregadas

`src/integrations/supabase/client.ts`:

```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { storage: localStorage, persistSession: true, autoRefreshToken: true }
});
```

### O que mudar para apontar ao self-hosted

```env
# Substituir em .env (e no ambiente de produção):
VITE_SUPABASE_URL="https://api.brainfyai.com.br"
VITE_SUPABASE_PUBLISHABLE_KEY="<anon key do self-hosted>"
VITE_SUPABASE_PROJECT_ID="default"
```

---

## 3. Dependência com o Supabase do Lovable

### Origem do projeto

O projeto foi criado via Lovable.app. O Supabase Cloud (`ipktjvfhykxwwczuvokx.supabase.co`) foi provisionado pela plataforma Lovable — ele pertence tecnicamente à conta Supabase associada ao Lovable, não à conta própria da Brainfy.

### Referências residuais de domínio Lovable

Dois arquivos de Edge Functions ainda referenciam `.lovable.app`:

| Arquivo | Linha | Referência |
|---------|-------|------------|
| `supabase/functions/create-organization-admin/index.ts` | — | Substitui `.supabase.co` por `.lovable.app` para detecção de origem |
| `supabase/functions/webhook-receiver/index.ts` | — | Mesmo padrão de substituição de domínio |

Um arquivo de componente frontend também constrói URL hardcoded:

```typescript
// src/components/admin/integrations/HotmartConfigManager.tsx
`https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/hotmart-webhook`
```

**Risco:** Após migração, estas URLs deixarão de funcionar. Precisam ser atualizadas para `https://api.brainfyai.com.br/functions/v1/...`

---

## 4. Inventário Completo do Banco de Dados

### 4.1 Tabelas — 169 no total

<details>
<summary>Ver todas as 169 tabelas</summary>

| Domínio | Tabelas |
|---------|---------|
| **Auth / Usuários** | profiles, user_roles, user_permissions, user_badges, user_status, user_notification_settings, user_availability |
| **Organizações** | organizations, org_ai_credentials, org_ai_routing, organization_orchestrator_config |
| **Equipes** | sales_squads, squad_members, sector_members, sectors, team_invitations |
| **Leads / CRM** | leads, lead_notes, lead_tags, lead_tag_assignments, lead_stage_history, lead_transfer_history, lead_semantic_memory, lead_queue, sales_leads |
| **Pipeline** | pipeline_stages, stage_values, deals |
| **Inbox / Conversas** | inbox_count_conversations *(view)*, inbox_list_conversations *(view)*, conversation_notes, conversation_processing_locks, conversation_transfers, processed_messages, sent_responses, message_reactions |
| **Agenda / Bookings** | booking_event_types, booking_requests, booking_logs, booking_reminders, booking_scheduled_jobs, booking_notification_settings, booking_status_history, calendar_events, google_calendar_connections, availability_overrides, business_hours, business_holidays |
| **Tarefas** | tasks |
| **Produtos** | products, product_agents, product_catalog_items, product_ctas, product_knowledge_sources, product_offers, product_onboarding_state, product_suites, product_training_videos, user_product_assignments |
| **Campanhas** | campaigns, campaign_contexts, campaign_targets, mass_email_campaigns, mass_email_recipients |
| **Cadências** | cadences, cadence_steps, cadence_step_runs, cadence_enrollments, cadence_templates, cadence_api_keys |
| **IA / Agentes** | agent_action_logs, agent_activation_logs, agent_handoff_history, agent_post_sale_scenarios, agent_routing_rules, agent_safety_limits, agent_specialists, agent_tool_executions, agent_training_materials, ai_audits, ai_insights, ai_knowledge_base, ai_outreach_queue, ai_prompt_experiments, ai_prompt_variants, ai_quality_evaluations, ai_response_feedback, ai_router_failures, ai_usage_logs |
| **Automações** | webhooks, webhook_logs, webhook_sample_requests, tag_automations, apply_tag_automations, auto_notification_settings |
| **Integrações** | evolution_instances, instagram_connections, instagram_webhook_logs, whatsapp_meta_connections, whatsapp_meta_templates, whatsapp_meta_webhook_logs, facebook_lead_integrations, facebook_lead_logs, google_calendar_connections, integration_settings |
| **Pagamentos** | cakto_credentials, cakto_orders, cakto_recovery_config, cakto_recovery_dispatches, hotmart_credentials, hotmart_orders, hotmart_product_mapping, billing_history, subscriptions, payment_links, commissions, commission_rules, sales_goals |
| **Email** | email_send_log, email_send_state, email_templates, email_unsubscribe_tokens, suppressed_emails |
| **Formulários / Funnels** | forms, form_blocks, form_submissions, form_templates, funnel_analytics, funnel_webhook_logs |
| **Quiz / Widget** | quiz_templates, webchat_agent_configs, webchat_assignment_events, webchat_conversations, webchat_messages, webchat_widgets |
| **Notificações** | notifications, notification_logs, admin_notifications, admin_agent_messages, seller_notification_settings |
| **Oportunidades** | opportunity_scan_items, opportunity_scan_schedules, opportunity_scans |
| **Post-sale** | post_sale_event_actions, post_sale_event_logs, post_sale_scheduled_runs |
| **Sankhya (ERP)** | sankhya_mappings, sankhya_sync_logs |
| **Plataforma SaaS** | platform_ai_keys, platform_audit_logs, platform_branding_public, platform_email_settings, platform_email_templates, platform_plans, platform_release_reads, platform_releases, platform_settings |
| **Suporte** | support_messages, support_tickets, help_article_feedback, help_articles, help_categories |
| **Outros** | custom_fields, quick_replies, materials, objections, interactions, catalog_sync_logs, orchestration_logs, scheduled_messages, public_booking_profiles, distribution_config |

</details>

### 4.2 Views

| View | Descrição |
|------|-----------|
| `inbox_count_conversations` | Contagem de conversas para badges |
| `inbox_list_conversations` | Lista de conversas com dados agregados |

### 4.3 Funções RPC (Stored Procedures) — 50+

Amostra das principais:

| Função | Propósito |
|--------|-----------|
| `get_user_organization` | Retorna org_id do usuário logado |
| `has_role` | Verifica se usuário tem determinada role |
| `is_super_admin` | Verifica status de super admin |
| `delete_lead_cascade` | Remove lead e todos os registros relacionados |
| `get_booking_by_token` | Busca agendamento por token público |
| `distribute_lead` | Lógica de distribuição de leads entre equipes |
| `evaluate_routing_rules` | Avalia regras de roteamento de conversas |
| `initialize_user_permissions` | Inicializa permissões ao criar usuário |
| `get_org_ai_tokens_status` | Status de créditos de IA da organização |
| `accept_invitation` | Aceita convite de equipe |

---

## 5. Edge Functions — 122 no total

### Por categoria

| Categoria | Quantidade | Exemplos |
|-----------|-----------|---------|
| **IA / Agentes** | ~18 | generate-agent-ai, analyze-conversation, evaluate-conversation, sales-copilot, generate-insights, memory-embedder, memory-search, quiz-ai-result, campaign-ai-insights, daily-report-ai |
| **Webhooks inbound** | ~11 | webhook-receiver, whatsapp-webhook, meta-whatsapp-webhook, instagram-webhook, facebook-leads-webhook, cakto-webhook, doppus-webhook, evolution-webhook, hotmart-webhook |
| **Mensageria** | ~10 | send-transactional-email, send-mass-email, send-notification-email, send-booking-confirmation, process-email-queue, start-whatsapp-conversation, send-catalog-item |
| **WhatsApp / Meta** | ~9 | meta-whatsapp-connect, meta-whatsapp-draft, meta-whatsapp-send, meta-whatsapp-test, meta-whatsapp-templates-sync, meta-whatsapp-template-submit |
| **Instagram** | ~5 | instagram-connect, instagram-draft, instagram-send, instagram-test |
| **Campanhas / Cadências** | ~10 | campaign-dispatcher, campaign-start, campaign-preview, cadence-tick, cadence-api, cadence-enroll, cadence-on-response, cadence-stop |
| **Agendamentos** | ~7 | booking-dispatcher, booking-submit, booking-reply-ai, booking-availability, google-calendar-auth, google-calendar-callback, google-calendar-sync |
| **Funnels / Formulários** | ~7 | funnel-api, funnel-chatbot-start, funnel-execute-webhook, funnel-generate-ai, funnel-submit, form-submit, form-generate-ai |
| **Sankhya (ERP)** | ~4 | sankhya-auth, sankhya-sync-clients, sankhya-sync-products |
| **Admin / Super Admin** | ~8 | admin-agent-handle-inbound, admin-agent-alerts, super-admin-manage-user, create-organization-admin, delete-organization |
| **Catálogo** | ~4 | catalog-import-csv, catalog-search, catalog-sync-website, process-knowledge-source |
| **Outros** | ~29 | transcribe-audio, firecrawl-*, opportunity-scan-*, save-ai-credential, test-integration, etc. |

### Funções com JWT desabilitado (acesso público)

As 11 funções abaixo aceitam chamadas **sem autenticação** — necessário para webhooks externos:

```
cakto-webhook, doppus-webhook, evolution-webhook, facebook-leads-webhook,
funnel-execute-webhook, hotmart-webhook, instagram-webhook,
meta-whatsapp-webhook, webhook-receiver, whatsapp-webhook
```

> **Atenção pós-migração:** No self-hosted Supabase, estas configurações precisam ser replicadas em `supabase/config.toml` ou via variável de ambiente.

---

## 6. Migrations

| Item | Valor |
|------|-------|
| **Total de migrations** | 226 arquivos |
| **Primeira migration** | 20260109155040 (09 Jan 2026) |
| **Última migration** | 20260607085214 (07 Jun 2026) |
| **Nomenclatura** | `{timestamp}_{uuid}.sql` (geradas pelo Supabase CLI via Lovable) |
| **Idempotência** | Sim — inserts usam `ON CONFLICT DO NOTHING` |
| **Migrations temáticas** | email_infra (3x), fix_inbox_last_message_preview, etc. |

---

## 7. Storage Buckets — 6 no total

| Bucket | Acesso | Limite | Uso |
|--------|--------|--------|-----|
| `product-documents` | Privado | 10 MB | Documentos de produtos |
| `materials` | Público | — | Materiais de treinamento |
| `cadence-media` | Público | — | Mídia de cadências |
| `help-media` | Público | — | Mídia da central de ajuda |
| `chat-media` | Público | 52 MB | Arquivos do inbox/chat |
| `catalog-media` | Público | — | Catálogo de produtos |
| `funnel-assets` | Público | — | Assets de landing pages |

> **Nota:** O `chat-media` tem limite expandido para 52 MB (migration específica). Os demais seguem o padrão.

---

## 8. RLS Policies

| Métrica | Valor |
|---------|-------|
| **Total de políticas** | 523 `CREATE POLICY` |
| **Arquivos com policies** | 112 migration files |
| **Padrão principal** | Acesso por `org_id` via `get_user_organization()` |
| **Roles suportadas** | super_admin, admin, manager, seller, viewer |
| **Service role** | Acesso irrestrito para operações de sistema |

Padrão recorrente:
```sql
-- Vendedores veem apenas dados da própria organização
USING (org_id = get_user_organization())

-- Admins e managers podem gerenciar
WITH CHECK (has_role('admin') OR has_role('manager'))

-- Service role sem restrição (Edge Functions)
USING (auth.role() = 'service_role')
```

---

## 9. Database Triggers

| Métrica | Valor |
|---------|-------|
| **Total de triggers** | ~100 `CREATE TRIGGER` |
| **Arquivos com triggers** | 61 migration files |
| **Tipo predominante** | `updated_at` automático (60+ triggers) |

Triggers críticos:
- `trg_booking_status_history` — Audit trail de status de agendamentos
- `trg_prevent_super_admin_lock_reset` — Segurança: impede lockout de super admin
- `trg_fill_default_sector` — Setor padrão para novos membros

---

## 10. Frontend — Acoplamento com Supabase

| Métrica | Valor |
|---------|-------|
| **Arquivos que importam `supabase`** | 151 arquivos |
| **Chamadas `.auth.*`** | 34 arquivos |
| **Chamadas `.storage.*`** | 14 arquivos |
| **Chamadas `.functions.invoke()`** | 91 ocorrências |
| **Chamadas `.from(` (queries)** | Alto volume |
| **Chamadas `.rpc(`** | Poucas (concentradas em hooks) |

O frontend acessa Supabase diretamente em toda a aplicação — **não há camada de API intermediária** para a maioria das operações. As principais exceções são as Edge Functions chamadas via `supabase.functions.invoke()`.

---

## 11. O que é Necessário para Migrar ao Self-Hosted

A migração do Supabase Cloud (`ipktjvfhykxwwczuvokx.supabase.co`) para o self-hosted em `api.brainfyai.com.br` envolve **3 fases**:

---

### Fase 1 — Banco de Dados (PostgreSQL)

**Objetivo:** Recriar schema e dados no PostgreSQL self-hosted.

| Passo | Comando / Ação |
|-------|---------------|
| 1. Executar todas as migrations | `supabase db push --db-url postgresql://postgres:<senha>@api.brainfyai.com.br:5432/postgres` |
| 2. Executar seeds | Aplicar arquivos em `supabase/migrations_shared/` manualmente |
| 3. Verificar extensões | `pgcrypto`, `uuid-ossp`, `pg_net`, `vector` (para embeddings) devem estar instaladas |
| 4. Migrar dados existentes | `pg_dump` do cloud + `pg_restore` no self-hosted (se houver dados em produção) |

---

### Fase 2 — Edge Functions

**Objetivo:** Deployar todas as 122 Edge Functions no self-hosted.

| Passo | Ação |
|-------|------|
| 1. Configurar Supabase CLI | Apontar para `api.brainfyai.com.br` |
| 2. Deploy das funções | `supabase functions deploy --project-ref default` |
| 3. Corrigir referências hardcoded | Ver lista abaixo |
| 4. Configurar secrets | Recriar todas as variáveis de ambiente das funções no dashboard de `studio.brainfyai.com.br` |

**Referências hardcoded que precisam ser corrigidas:**

```typescript
// supabase/functions/create-organization-admin/index.ts
// supabase/functions/webhook-receiver/index.ts
// Padrão atual (ERRADO para self-hosted):
.replace(".supabase.co", ".lovable.app")

// src/components/admin/integrations/HotmartConfigManager.tsx
// Padrão atual (ERRADO):
`https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/hotmart-webhook`
// Corrigir para:
`https://api.brainfyai.com.br/functions/v1/hotmart-webhook`
```

---

### Fase 3 — Frontend (variáveis de ambiente)

**Objetivo:** Apontar o frontend para o self-hosted.

Alterar `.env` (e variável de ambiente de produção no servidor/CI):

```env
# ANTES (Supabase Cloud / Lovable):
VITE_SUPABASE_URL="https://ipktjvfhykxwwczuvokx.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_ZMumbCtrx9vW90iwIJ9ZGg_W9wV8kJX"
VITE_SUPABASE_PROJECT_ID="ipktjvfhykxwwczuvokx"

# DEPOIS (Self-hosted Brainfy):
VITE_SUPABASE_URL="https://api.brainfyai.com.br"
VITE_SUPABASE_PUBLISHABLE_KEY="<anon key do self-hosted — pegar no Studio>"
VITE_SUPABASE_PROJECT_ID="default"
```

> A `VITE_SUPABASE_PUBLISHABLE_KEY` não é uma `anon_key` padrão do Supabase — é um formato proprietário do Lovable (`sb_publishable_...`). No self-hosted, usar a `anon key` JWT gerada pelo próprio Supabase.

---

### Fase 4 — Storage

Recriar os 7 buckets no self-hosted via SQL:

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES
  ('product-documents', 'product-documents', false, 10485760),
  ('materials', 'materials', true, null),
  ('cadence-media', 'cadence-media', true, null),
  ('help-media', 'help-media', true, null),
  ('chat-media', 'chat-media', true, 54525952),
  ('catalog-media', 'catalog-media', true, null),
  ('funnel-assets', 'funnel-assets', true, null)
ON CONFLICT DO NOTHING;
```

---

### Checklist de Migração

```
[ ] 1. Extrair anon_key e service_role_key do self-hosted (Studio → Settings → API)
[ ] 2. Executar 226 migrations no self-hosted
[ ] 3. Executar seeds (migrations_shared/)
[ ] 4. Verificar extensões PostgreSQL (vector, pg_net, pgcrypto)
[ ] 5. Criar 7 storage buckets
[ ] 6. Deploy de 122 Edge Functions
[ ] 7. Configurar secrets de cada Edge Function (OpenAI, Evolution, Cakto, Hotmart, etc.)
[ ] 8. Corrigir hardcoded URLs em 3 arquivos (create-organization-admin, webhook-receiver, HotmartConfigManager)
[ ] 9. Atualizar .env com nova URL e anon_key
[ ] 10. Rebuild e deploy do frontend
[ ] 11. Migrar dados do Supabase Cloud (pg_dump → pg_restore) se houver produção ativa
[ ] 12. Atualizar URLs de webhook em integrações externas (Hotmart, Cakto, Evolution, Meta, etc.)
[ ] 13. Testar autenticação, upload de arquivos, Edge Functions críticas
[ ] 14. Revogar acesso ao projeto Supabase Cloud antigo
```

---

## 12. Pontos de Atenção / Riscos

| Risco | Severidade | Descrição |
|-------|-----------|-----------|
| **Dados em produção** | 🔴 Alto | Se o Cloud Supabase já tem usuários/dados reais, a migração exige janela de manutenção e `pg_dump` cuidadoso |
| **JWT secret diferente** | 🔴 Alto | O self-hosted gera um JWT secret próprio — tokens de sessão do Cloud ficam inválidos. Todos os usuários precisam fazer novo login |
| **`vector` extension** | 🟡 Médio | A tabela `lead_semantic_memory` e funções de memória de IA usam `pgvector`. Deve estar instalada no self-hosted |
| **`pg_net` extension** | 🟡 Médio | Edge Functions que fazem chamadas HTTP a partir do banco dependem do `pg_net`. Verificar se está habilitada |
| **Secrets das Edge Functions** | 🟡 Médio | Cada função tem suas próprias variáveis de ambiente (OpenAI key, Evolution URL, etc.). Precisam ser recriadas manualmente no Studio self-hosted |
| **11 webhooks sem JWT** | 🟡 Médio | A config `verify_jwt = false` do `config.toml` precisa ser aplicada no self-hosted. Confirmar suporte no Kong/Supabase self-hosted |
| **`SUPABASE_PROJECT_ID` hardcoded** | 🟢 Baixo | HotmartConfigManager usa a variável de env para construir URL — corrigir antes do deploy |
| **Domínio `.lovable.app` residual** | 🟢 Baixo | Duas Edge Functions fazem replace de domínio. Após migração, esse código é inócuo mas deve ser limpo |

---

## Resumo Executivo

O banco de dados da Brainfy é **grande e maduro**: 169 tabelas, 226 migrations, 122 Edge Functions, 523 políticas RLS e 100 triggers. Tudo foi construído no Supabase Cloud provisionado pelo Lovable.

A migração para o self-hosted em `api.brainfyai.com.br` é **totalmente viável** — o schema está 100% versionado em migrations SQL. Os principais trabalhos são:

1. **Executar as migrations** no novo banco (automatizável via Supabase CLI)
2. **Deployar as 122 Edge Functions** (um único comando)
3. **Reconfigurar secrets** de cada integração no Studio
4. **Trocar 2 variáveis de ambiente** no frontend
5. **Corrigir 3 arquivos** com URLs hardcoded
6. **Migrar dados** se já houver usuários ativos no Cloud (exige pg_dump)

O maior risco operacional é a **invalidação de sessões JWT** — ao trocar para o self-hosted, todos os usuários precisarão fazer login novamente, pois o secret de assinatura dos tokens muda.
