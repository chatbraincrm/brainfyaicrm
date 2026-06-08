# Brainfy — Relatório Técnico de Auditoria

> Gerado em: 2026-06-08  
> Versão do projeto auditado: pré-rename (vite_react_shadcn_ts → brainfy)

---

## 1. Visão Geral

**Brainfy** é uma plataforma de CRM, atendimento omnichannel, automação e IA para empresas. O projeto é um monorepo com:

- **Frontend:** React 18 + TypeScript + Vite + TailwindCSS + shadcn/ui
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Stack de dados:** TanStack Query (React Query v5) para server state
- **AI:** Integração com modelos de linguagem via Supabase Edge Functions
- **Channels:** WhatsApp (Meta Cloud API + Evolution), Instagram, Facebook, Email, Web Chat, Booking

**Saúde geral: 8/10** — Projeto bem estruturado para a escala, com pontos de melhoria claros.

---

## 2. Módulos Existentes

### 2.1 Páginas (23)

| Rota | Arquivo | Descrição |
|------|---------|-----------|
| `/` | `Index.tsx` | Dashboard principal (inbox, pipeline, BI) |
| `/login` | `Login.tsx` | Autenticação (email + Google OAuth) |
| `/admin` | `Admin.tsx` | Painel de configuração da organização |
| `/super-admin` | `SuperAdmin.tsx` | Painel multi-empresa para administrador de plataforma |
| `/setup` | `Setup.tsx` | Wizard de configuração inicial |
| `/reset-password` | `ResetPassword.tsx` | Redefinição de senha |
| `/aceitar-convite` | `AcceptInvite.tsx` | Aceitar convite de time |
| `/c/:slug` | `PublicChat.tsx` | Chat público com agente IA |
| `/f/:slug` | `PublicForm.tsx` | Formulário/landing page dinâmico |
| `/q/:slug` | `PublicQuiz.tsx` | Quiz/funnel interativo |
| `/agendar/:slug` | `PublicBooking.tsx` | Calendário de agendamento público |
| `/confirmar/:token` | `BookingConfirmation.tsx` | Confirmação/cancelamento de agendamento |
| `/vendas` | `SalesPage.tsx` | Landing page de vendas white-label |
| `/ajuda` | `HelpCenter.tsx` | Central de ajuda |
| `/novidades` | `Updates.tsx` | Notas de versão |
| `/docs` | `Docs.tsx` | Documentação pública |
| `/perfil` | `Profile.tsx` | Perfil do usuário |
| `/configuracoes` | `Settings.tsx` | Configurações da conta |
| `/install` | `Install.tsx` | Guia de instalação PWA |
| `/unsubscribe` | `Unsubscribe.tsx` | Descadastro de email |

### 2.2 Domínios Funcionais

#### CRM / Leads
- Pipeline Kanban com deals e stages
- Leads com tags, notas, histórico, score
- Atribuição a squads e vendedores
- Importação e exportação de leads

#### Atendimento Omnichannel (Inbox)
- Conversas unificadas: WhatsApp, Instagram, Web Chat
- Roteamento automático por agentes IA
- Presença em tempo real (online/offline)
- Reações e emojis em mensagens
- Transferência de atendimento
- Fila de espera

#### Agentes de IA
- Tipos: SDR, Closer, Suporte, Financeiro, Orquestrador, Custom
- Configuração de personalidade, tom, estilo
- Base de conhecimento (RAG)
- Supervisão e handoff para humanos
- Treinamento via materiais e documentos
- Analytics de qualidade

#### Automações / Campanhas
- Cadências multi-step (email, WhatsApp, Instagram)
- Campanhas broadcast para listas
- Funnels com blocos visuais (formulários, chat, quiz, vídeo)
- Webhooks de entrada e saída configuráveis

#### Booking / Agendamentos
- Tipos de eventos com disponibilidade configurável
- Integração com Google Calendar
- Confirmação, reagendamento e cancelamento
- Notificações automáticas (email + WhatsApp)
- IA para responder dúvidas sobre agendamento

#### Produtos / Ofertas
- Catálogo de produtos com preços
- Onboarding pós-venda automatizado
- Materiais e links de pós-venda
- Comissões por vendedor

#### Relatórios / BI
- Painel executivo com KPIs
- Radar de oportunidades
- Insights gerados por IA
- Análise de qualidade de conversas

#### Integrações
- WhatsApp: Meta Cloud API (BYO) + Evolution API
- Instagram Direct (BYO Meta)
- Facebook Leads
- Hotmart (webhooks de compra)
- Sankhya (ERP — auth, pedidos, clientes)
- Cakto (pagamentos)
- Google Calendar
- Doppus

#### Plataforma (White-label / SaaS)
- Branding: logo, cores, fontes, domínio
- Planos e limites de uso
- Chaves de IA configuráveis por plataforma
- Onboarding guiado
- Super Admin para gerenciar múltiplas organizações

---

## 3. Dependências Críticas

### 3.1 Runtime (produção)

| Pacote | Versão | Criticidade | Propósito |
|--------|--------|-------------|-----------|
| `@supabase/supabase-js` | ^2.90.1 | CRÍTICA | Database, Auth, Storage, Functions |
| `@tanstack/react-query` | ^5.83.0 | ALTA | Server state management |
| `react` / `react-dom` | ^18.3.1 | CRÍTICA | UI framework |
| `react-router-dom` | ^6.30.1 | ALTA | Client-side routing |
| `react-hook-form` + `zod` | latest | ALTA | Forms e validação |
| `@radix-ui/*` | ^1.x | ALTA | Primitivos de UI acessíveis |
| `tailwindcss-animate` + `framer-motion` | latest | MÉDIA | Animações |
| `@tiptap/*` | ^3.22.4 | MÉDIA | Editor rich text |
| `recharts` | ^2.15.4 | MÉDIA | Gráficos |
| `sonner` | ^1.7.4 | MÉDIA | Notificações toast |
| `dompurify` | ^3.4.1 | ALTA | Sanitização de HTML (segurança) |
| `date-fns` | ^3.6.0 | MÉDIA | Manipulação de datas |
| `lucide-react` | ^0.462.0 | BAIXA | Ícones |
| `next-themes` | ^0.3.0 | BAIXA | Dark mode |
| `qrcode.react` | ^4.2.0 | BAIXA | QR codes |

### 3.2 Dependências Removidas

| Pacote | Motivo |
|--------|--------|
| `@lovable.dev/cloud-auth-js` | Substituído por Supabase OAuth nativo |
| `lovable-tagger` (devDep) | Plugin de tagging do Lovable, não necessário |

### 3.3 Backend (Supabase Edge Functions — 120 funções)

Agrupadas por domínio:
- **Auth/Setup:** 5 funções
- **Agentes IA:** 8 funções  
- **Webhooks/Integrações:** 35+ funções
- **IA/NLP:** 15 funções
- **Mensagens/Chat:** 20+ funções
- **Booking:** 15 funções
- **Campanhas/Cadências:** 15 funções
- **Processamento de dados:** 20+ funções

---

## 4. Arquitetura Atual

```
Browser
  └── React SPA (Vite)
        ├── TanStack Query (server state)
        ├── 153 Custom Hooks (data access)
        │     └── supabase client (diretamente)
        └── 33 pastas de componentes (UI)

Supabase
  ├── PostgreSQL (RLS habilitado)
  ├── Auth (email + OAuth)
  ├── Storage (uploads)
  ├── Realtime (subscriptions)
  └── Edge Functions (120)
        ├── _shared/ (ai-call, ai-router, platform-email-send)
        └── por domínio...
```

### Pontos de Acoplamento

Todo acesso a dados hoje é feito diretamente nos hooks via `supabase.from('tabela')`. Não há camada de serviço intermediária (sendo criada agora em `src/services/`).

---

## 5. Mapa de Variáveis de Ambiente

```env
# Supabase (frontend — públicas)
VITE_SUPABASE_URL=           # URL do projeto Supabase
VITE_SUPABASE_PUBLISHABLE_KEY= # Anon key pública
VITE_SUPABASE_PROJECT_ID=    # ID do projeto (para Edge Functions)
```

Variáveis de Edge Functions (secrets no Supabase Dashboard):
- `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / etc.
- `EVOLUTION_API_URL` / `EVOLUTION_API_KEY`
- `META_APP_SECRET`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `HOTMART_TOKEN`
- `SANKHYA_*`
- `CAKTO_*`
- `SMTP_*`

---

## 6. Bugs e Riscos Encontrados

### Críticos
_Nenhum crítico encontrado._

### Médios

| # | Arquivo | Descrição | Impacto |
|---|---------|-----------|---------|
| 1 | `tsconfig.json` | `strict: false`, `strictNullChecks: false`, `noImplicitAny: false` | Permite código menos seguro; crashes em runtime por null |
| 2 | `src/integrations/lovable/index.ts` | Dependência de `@lovable.dev/cloud-auth-js` (removida) | Login com Google ficaria quebrado se pacote fosse descontinuado |
| 3 | Vários hooks | Queries sem tratamento de `null` em `data` | Crashes silenciosos quando tabela retorna vazio |
| 4 | `src/lib/publicUrl.ts` | Referência a `lovableproject.com` como host de editor (removida) | URL pública incorreta em ambientes de preview |

### Baixos / Dívida Técnica

| # | Descrição | Ação Recomendada |
|---|-----------|-----------------|
| 5 | 25 componentes com 500+ linhas | Quebrar em sub-componentes por tab/seção |
| 6 | 153 hooks fazem chamadas diretas ao Supabase | Migrar progressivamente para `src/services/` |
| 7 | `eslint: @typescript-eslint/no-unused-vars: off` | Ativar para detectar dead code |
| 8 | Sem `.env.example` | Criar para documentar variáveis necessárias |
| 9 | Sem testes E2E (Playwright instalado, sem specs) | Criar testes para fluxos críticos (login, booking, chat) |
| 10 | `index.css` com 9.118 linhas | Organizar em módulos CSS ou Tailwind utilities |

---

## 7. Estrutura de Pastas Recomendada (Próximas Etapas)

```
src/
├── app/                    # App shell, providers, router
├── pages/                  # Rotas (manter atual)
├── features/               # Domínios de negócio (novo)
│   ├── leads/
│   ├── inbox/
│   ├── agents/
│   ├── booking/
│   ├── campaigns/
│   └── reports/
├── services/               # ← Criado agora
│   ├── auth.service.ts
│   ├── ai.service.ts
│   ├── leads.service.ts
│   ├── organizations.service.ts
│   └── supabase.service.ts
├── components/             # Componentes UI (manter atual)
├── hooks/                  # Hooks (migrar para services progressivamente)
├── types/                  # Tipos globais
├── lib/                    # Utilitários
└── integrations/           # Clientes externos (Supabase)
```

---

## 8. Plano Técnico — Próxima Etapa (Interface Brainfy)

### Objetivo
Redesenhar a interface com identidade visual premium, moderna e escura — estilo plataforma SaaS enterprise para CRM, IA e automação.

### Referência Visual
Inspiração em plataformas como Datacrazy (densas, escuras, cheias de dados) sem copiar identidade ou marca.

### Tom Visual
- **Paleta:** Fundo escuro (slate/zinc 900-950), acentos em azul elétrico ou verde-lima
- **Tipografia:** Inter ou Geist — clean, técnica
- **Componentes:** Cards com bordas sutis, glassmorphism leve, gradientes de destaque
- **Densidade:** Alta — painéis laterais, headers compactos, tabelas sem espaços desperdiçados
- **Animações:** Micro-interações suaves (framer-motion já incluso)

### Componentes a Redesenhar (prioridade)
1. Sidebar / navegação principal
2. Dashboard / Overview
3. Inbox (conversas)
4. Pipeline Kanban
5. Cards de leads
6. Painel de agente IA
7. Header e top bar
8. Modais e drawers

### Prerequisitos (esta etapa)
- [x] Remoção completa do Lovable
- [x] Build compilando sem erros
- [x] Camada de services criada
- [ ] TypeScript strict mode ativado progressivamente
- [ ] Testes E2E básicos criados

---

## 9. Decisões de Arquitetura para o SaaS

### Multi-empresa (Multitenancy)
O projeto já implementa multitenancy via `org_id` em todas as tabelas. As políticas RLS do Supabase garantem isolamento por organização. Para o modelo SaaS:

1. **Planos e limites:** Tabela `platform_plans` já existe. Criar `org_subscriptions` para vincular planos.
2. **Controle de uso de IA:** Já existe `useAITokenStatus`. Centralizar no `AIService` para controle de margem.
3. **Onboarding:** `GuidedOnboarding` já implementado. Adaptar para fluxo SaaS público.
4. **Billing:** Integrar Stripe/Cakto. Criar `billing.service.ts`.

### Controle de Margem de IA
Manter o modelo atual de chaves por plataforma (`platform_ai_keys`) com rate limiting nas Edge Functions. Adicionar:
- Dashboard de uso por organização no Super Admin
- Alertas automáticos quando uso > 80% do limite
- Fallback para modelo menor quando limite próximo

---

*Relatório gerado automaticamente durante auditoria de pré-lançamento do Brainfy.*
