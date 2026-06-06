## Objetivo

A Central de Ajuda (`/ajuda`) hoje está vazia (0 categorias, 0 artigos). Vou populá-la com um pacote essencial de conteúdo em português, já publicado, visível para qualquer usuário autenticado. Você (super admin) continua podendo editar tudo pelo painel — sem mudança de permissões.

## Categorias (5)

Todas com `visibility = 'all'` (qualquer usuário vê). Ícones do lucide-react.

| Slug | Nome | Ícone | Cor |
|---|---|---|---|
| primeiros-passos | Primeiros Passos | Rocket | emerald |
| atendimento | Atendimento & Inbox | MessageSquare | sky |
| leads-vendas | Leads & Vendas | Target | violet |
| ia-automacoes | IA & Automações | Sparkles | amber |
| integracoes | Integrações & Canais | Plug | rose |

## Artigos (15 publicados)

Conteúdo em HTML rico (títulos, listas, dicas), `is_published = true`, `published_at = now()`.

**Primeiros Passos**
1. Bem-vindo à plataforma — visão geral e tour das áreas
2. Configurando seu perfil e disponibilidade
3. Convidando sua equipe e definindo papéis (Admin, Gestor, Vendedor)

**Atendimento & Inbox**
4. Como funciona a Inbox omnichannel (fila, aceite por setor, transferência)
5. Atendendo no WhatsApp: regras de debounce, chunking e correções
6. "Chamar com IA" e reativação inteligente de conversas

**Leads & Vendas**
7. Cadastrando e qualificando leads (BANT, tags, etapas)
8. Pipeline Kanban e movimentação de negócios
9. Metas, comissões e leaderboard

**IA & Automações**
10. Treinando o Brain do seu produto (FAQs, arquivos, YouTube, sites)
11. Criando agentes de IA e atribuindo por canal
12. Cadências inteligentes e disparos automáticos pós-venda

**Integrações & Canais**
13. Conectando WhatsApp (Evolution, Meta Cloud, BotConversa)
14. Integrando Hotmart, Cakto e webhooks externos
15. Agendamentos: Google Calendar e booking omnichannel

## Como será feito

1. **Migration** — só para garantir um `display_order` padrão se faltar (não precisa alterar schema, já existe). Pulado.
2. **Insert de dados** via tool de insert (não migration):
   - `INSERT` das 5 categorias em `help_categories`
   - `INSERT` dos 15 artigos em `help_articles`, cada um vinculado à sua categoria pelo slug, com `summary` curto, `content_html` formatado e `tags` relevantes
3. Verificação rápida: `SELECT count(*)` e abrir `/ajuda` no preview para conferir layout.

## Fora de escopo

- Não vou editar componentes React (`HelpCenter.tsx`, `HelpArticle.tsx`) — já funcionam.
- Não vou criar imagens de capa (`cover_image_url` ficará nulo; o layout tolera).
- Não vou vincular os artigos a `platform_releases`.
- Não vou alterar políticas RLS nem permissões.

Se quiser, depois posso gerar capas com IA ou aumentar para o pacote completo (~60 artigos cobrindo toda a documentação interna).
