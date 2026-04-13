# READMEAI - Liensi

## [ESTADO ATUAL]

- Projeto Next.js 16 criado na raiz `C:\Projetos\Liensi` com App Router, TypeScript, React 19 e Tailwind CSS.
- Catalogo publico implementado com home, busca por nome, filtro por categoria, cards editoriais, nomes de produto com capitalizacao de titulo, pagina individual de produto em `/produto/[slug]` com seta de voltar ao catalogo, carrossel de galeria, descricao longa com `Ver mais`, preco promocional com percentual de desconto, estoque, banners editaveis e botao WhatsApp flutuante sem fundo, fixo no centro inferior e proporcional a viewport. O header publico nao mostra link para admin, e a copy visivel do catalogo evita termos de codigo.
- Logica e UI de galeria/carrossel implementadas com `getProductMedia()`: produtos aceitam zero, uma ou varias imagens, com ordenacao por `display_order`, capa por `is_cover`, setas, contador e miniaturas na pagina de produto.
- Logica e UI de promocao implementadas com `getProductPricing()`: preco real, preco promocional valido, preco atual, valor descontado e percentual de desconto ficam centralizados; badges do catalogo exibem `% OFF`.
- Area admin implementada com login Supabase Auth, painel/resumo operacional em `/admin`, CRUD de produtos, CRUD de categorias, CRUD de banners, estoque inline, upload multiplo de imagens, reordenacao por drag-and-drop, selecao de capa, exclusao robusta de imagens e atalho `Catalogo` para a vitrine publica.
- Admin de uso diario melhorado com mensagens de sucesso/erro, botoes com loading, confirmacao antes de exclusoes, sincronizacao da galeria apos refresh e previa viva do produto no formulario antes de publicar/salvar.
- Estoque profissional implementado: produtos tem SKU/codigo interno opcional, limite de baixo estoque configuravel, filtros de estoque na listagem admin e historico privado em `stock_movements`.
- Variantes opcionais implementadas: produtos podem ter variacoes com nome, SKU opcional, estoque proprio, ordem e status ativo/inativo; quando ha variantes ativas, o estoque publico/admin passa a ser a soma delas e o estoque geral vira fallback.
- Uploads manuais de produtos e banners agora validam JPG/PNG/WebP ate 10 MB, redimensionam e convertem para WebP no servidor com `sharp`.
- Banners responsivos implementados: imagem desktop obrigatoria, imagem mobile opcional, foco horizontal/vertical editavel e fallback para desktop quando nao houver mobile.
- Analytics anonimo implementado: catalogo registra visitas, cliques em cards, views de paginas de produto e cliques no WhatsApp; admin acompanha o funil em `/admin/analytics`, com ultimos eventos em lista curta expansivel por `Ver mais`.
- Polimento pre-cadastro implementado: filtros publicos mais confortaveis, ordenacao com rotulos em portugues, incluindo `Promocao` no singular, URLs de filtro com `busca`/`categoria`/`ordem`, categoria `Geral` unificada em `Todas as categorias`, contador de produtos, estados vazios/loading/erro, swipe em banner/galeria, `next/image` para produto, SEO social e checklist de produto incompleto no admin.
- Icones do app implementados a partir do `Liensi.png` atual: favicon da aba, icon PNG do Next, Apple touch icon, PNGs Android e manifest web.
- Importador CSV de produtos implementado em `/admin/produtos/importar`; cria/atualiza por slug, cria categorias automaticamente, suporta CSV Roxflow (`item_name`, `quantity`, `cost_price`/`cost`), aceita CSVs incompletos com defaults editaveis e permite escolher se o estoque do CSV substitui ou soma ao estoque atual.
- Edicao admin de galeria de produto corrigida para nao renderizar `<form>` dentro do formulario principal do produto; botoes de capa/exclusao/ordem usam `formAction` e o `DndContext` tem id estavel para evitar mismatch de hidratacao.
- Supabase preparado via `supabase.sql` com tabela `admin_users`, funcao `is_admin()`, tabelas do catalogo, tabela `product_variants`, tabela `catalog_banners` responsiva, tabela `stock_movements`, tabela `analytics_events`, indices, RLS e policies de storage para o bucket `produtos`.
- Endurecimento de seguranca aplicado no setup Supabase/Vercel: frontend agora aceita `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (com fallback legado para `NEXT_PUBLIC_SUPABASE_ANON_KEY`), bloqueia boot/build se uma chave secreta `sb_secret_`/`service_role` for exposta em `NEXT_PUBLIC_*`, e o script `create-admin` passou a preferir `SUPABASE_SECRET_KEY`.
- Admin ganhou `/admin/financas` com valor bruto potencial do estoque ativo, resumo por categoria e impacto de promocoes; `/admin/configuracoes` permite trocar o WhatsApp do catalogo via `site_settings`; `/admin/categorias` ganhou fluxo de mover varios produtos para uma categoria por checkbox.
- Menu horizontal do admin ajustado para ser responsivo sem `overflow-x-auto`; os links quebram em varias linhas quando a largura fica pequena.
- `.env` local foi corrigido nesta sessao: a chave publica do Supabase saiu de `NEXT_PUBLIC_SUPABASE_ANON_KEY` inseguro para `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, e a `sb_secret_...` foi movida para `SUPABASE_SECRET_KEY`.
- A intencao atual do produto e: somente admin faz login; clientes apenas leem o catalogo publico e abrem WhatsApp.
- Solicitacao de criacao do usuario Auth `liensiparadise@gmail.com` foi aceita pelo Supabase, mas o login testado retornou `Email not confirmed`; `supabase.sql` agora confirma esse usuario sem gravar senha fixa no repositorio. A senha deve ser definida no painel Auth ou via `scripts/create-admin.mjs`.
- Validacao local apos ajustar filtros/categorias e remover cor visual das variantes: `npm.cmd run lint` e `npm.cmd run build` passaram.
- Validacao desta sessao: `npm.cmd run lint` e `npm.cmd run build` passaram com as novas telas de financas/configuracoes, WhatsApp via `site_settings`, organizacao em massa de categorias e nav admin responsiva.
- Apos troca manual do `Liensi.png`, os icones derivados foram regenerados novamente.

## [LOG DE ALTERACOES]

- `package.json`, `next.config.mjs`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`, `eslint.config.mjs`, `components.json`: configuracao inicial do projeto.
- `app/globals.css`, `app/layout.tsx`: tema global, fontes Cormorant Garamond/DM Sans, tokens shadcn e direcao visual do catalogo.
- `lib/supabase/*`, `lib/catalog.ts`, `lib/admin-data.ts`, `lib/admin-actions.ts`, `lib/auth.ts`, `lib/env.ts`, `lib/utils.ts`, `proxy.ts`: integracao Supabase, protecao admin, consultas, mutations, slugs publicos, URL base do site, formatacao de nomes e revalidacao.
- `components/catalog/*`, `app/page.tsx`, `app/produto/[slug]/page.tsx`, `app/not-found.tsx`: catalogo publico e pagina de produto; o header publico removeu o link direto para `/admin`, detalhes usam `formatProductName` e a pagina de produto tem seta superior para voltar ao catalogo.
- `components/catalog/product-description.tsx`, `app/produto/[slug]/page.tsx`: descricao longa da pagina de produto ganhou bloco recolhivel com fade e `Ver mais`/`Ver menos`; a galeria fica alinhada/sticky no topo em desktop para reduzir espaco vazio quando o texto cresce.
- `lib/pricing.ts`: helper central para validar promocao e calcular preco atual, desconto em valor e desconto percentual.
- `lib/product-media.ts`: helper central para ordenar imagens, selecionar capa e preparar slides futuros para carrossel.
- `components/catalog/price.tsx`, `components/catalog/product-card.tsx`, `components/catalog/product-gallery.tsx`, `app/produto/[slug]/page.tsx`, `app/admin/produtos/page.tsx`: usam os helpers de preco/midia; cards e detalhe exibem `% OFF`, e a galeria do detalhe tem setas/contador/miniaturas.
- `components/catalog/product-variant-picker.tsx`, `lib/product-stock.ts`, `components/catalog/product-card.tsx`, `app/produto/[slug]/page.tsx`: catalogo e pagina de produto agora usam estoque agregado por variantes, mostram badge de variantes e selecionam a variante antes de abrir WhatsApp.
- `components/catalog/catalog-banner-carousel.tsx`, `app/page.tsx`, `lib/catalog.ts`: home busca banners ativos via ISR e renderiza carrossel editorial somente quando existem banners ativos.
- `components/catalog/catalog-filters.tsx`, `components/catalog/product-grid.tsx`, `components/catalog/product-card.tsx`, `components/catalog/product-gallery.tsx`, `components/catalog/catalog-image-placeholder.tsx`, `components/catalog/whatsapp-button.tsx`, `app/globals.css`, `next.config.mjs`: vitrine publica ganhou filtros responsivos, ordenacao, contador, cards mais estaveis, placeholder premium, swipe mobile, safe area no WhatsApp e `next/image`.
- `components/catalog/catalog-filters.tsx`, `app/page.tsx`, `lib/catalog.ts`: filtros publicos passaram a exibir e gerar parametros em portugues (`busca`, `categoria`, `ordem`, `menor-preco`, `maior-preco`, `promocoes`), com rotulo visivel `Promocao`, mantendo compatibilidade com parametros antigos (`q`, `category`, `sort`, `price-asc`, `price-desc`, `promo`); a categoria `Geral` nao aparece como opcao separada e `categoria=geral` volta para todas as categorias.
- `components/catalog/catalog-header.tsx`, `components/catalog/product-card.tsx`, `components/catalog/product-grid.tsx`, `components/catalog/product-variant-picker.tsx`, `components/catalog/product-gallery.tsx`, `components/catalog/catalog-banner-carousel.tsx`, `components/catalog/product-description.tsx`, `components/catalog/whatsapp-button.tsx`, `app/produto/[slug]/page.tsx`, `app/layout.tsx`, `app/not-found.tsx`, `app/opengraph-image.tsx`, `lib/whatsapp.ts`: copy publica do catalogo revisada para acentos, rotulos naturais, badges sem `OFF`, unidades por extenso e fallback `Curadoria Liensi` no lugar de `Sem categoria`; seletor publico de variantes nao mostra mais bolinha de cor.
- `components/catalog/catalog-banner-carousel.tsx`, `app/admin/banners/page.tsx`, `lib/catalog.ts`, `lib/admin-data.ts`, `lib/admin-actions.ts`, `lib/types.ts`: banners passaram a suportar imagem desktop, imagem mobile opcional e foco da imagem.
- `lib/image-processing.ts`, `lib/admin-actions.ts`, `components/admin/product-form.tsx`, `app/admin/banners/page.tsx`, `package.json`, `package-lock.json`: uploads manuais de produto/banner agora usam `sharp` para validar, redimensionar e converter para WebP.
- `app/admin/banners/page.tsx`, `components/admin/admin-shell.tsx`, `lib/admin-data.ts`, `lib/admin-actions.ts`: admin ganhou aba de banners para criar, editar, trocar imagem, ordenar, ativar/desativar e excluir banners.
- `lib/analytics.ts`, `lib/analytics-client.ts`, `app/api/analytics/event/route.ts`, `components/analytics/*`, `components/catalog/product-card.tsx`, `components/catalog/whatsapp-button.tsx`, `app/page.tsx`, `app/produto/[slug]/page.tsx`: funil anonimo registra visitas, clique no card, pagina do produto e clique no WhatsApp.
- `app/admin/analytics/page.tsx`, `components/admin/admin-shell.tsx`, `lib/admin-data.ts`: admin ganhou pagina de analytics com periodos de 7/30/90 dias, cards de resumo, ranking de produtos e eventos recentes.
- `components/admin/recent-analytics-events.tsx`, `app/admin/analytics/page.tsx`: ultimos eventos do analytics passaram a renderizar inicialmente 8 itens e revelar mais 8 por clique em `Ver mais`, evitando uma lista longa na pagina.
- `app/opengraph-image.tsx`, `app/robots.ts`, `app/error.tsx`, `app/admin/error.tsx`, `app/admin/loading.tsx`, `app/produto/[slug]/loading.tsx`, `app/layout.tsx`, `app/not-found.tsx`, `app/produto/[slug]/page.tsx`: SEO/social, robots, estados de loading/erro/404 e metadata de produto preparados.
- `Liensi.png`, `app/favicon.ico`, `app/icon.png`, `app/apple-icon.png`, `public/favicon-16x16.png`, `public/favicon-32x32.png`, `public/android-chrome-192x192.png`, `public/android-chrome-512x512.png`, `public/liensi-icon.png`, `public/site.webmanifest`, `app/layout.tsx`: icones do app gerados do simbolo central da marca e registrados no metadata/manifest. Em 12/04/2026, o `Liensi.png` foi trocado manualmente para uma versao 500x500 e os derivados foram regenerados com recorte central 300x300.
- `lib/product-readiness.ts`, `app/admin/page.tsx`, `app/admin/produtos/page.tsx`, `components/admin/product-form.tsx`: checklist de prontidao do produto, filtro de incompletos e badges de campos pendentes no admin.
- `app/admin/page.tsx`: deixou de redirecionar direto para produtos e virou painel com resumo de produtos ativos, esgotados, estoque baixo, promocoes, banners e itens de atencao.
- `components/admin/admin-notice.tsx`, `components/admin/submit-button.tsx`: feedback reutilizavel para sucesso/erro e botoes submit com loading/confirmacao.
- `components/admin/product-form.tsx`: ganhou previa da vitrine em tempo real com imagem selecionada, status, estoque, categoria e preco/promocao.
- `components/admin/product-variants-editor.tsx`, `components/admin/product-form.tsx`: formulario de produto ganhou editor de variantes com nome, SKU opcional, estoque, ativo/inativo, reordenacao simples e remocao; o campo de cor/hex foi removido da UI para simplificar cadastro.
- `components/admin/product-form.tsx`: tambem ganhou campos de SKU/codigo interno e limite de baixo estoque.
- `components/admin/stock-update-form.tsx`: ajuste inline de estoque aceita nota para historico.
- `app/admin/produtos/page.tsx`: ganhou filtros para todos, ativos, inativos, esgotados, baixo estoque e promocoes; lista mostra SKU, badges de estoque e bloqueia ajuste inline quando o produto usa variantes.
- `app/admin/produtos/[id]/editar/page.tsx`: ganhou historico de estoque do produto, incluindo nome da variante quando a movimentacao veio de variante.
- `lib/admin-actions.ts`: alteracoes de estoque por cadastro/edicao/listagem/importacao CSV e por variantes registram `stock_movements`.
- `lib/admin-data.ts`, `lib/types.ts`: consultas/tipos reconhecem SKU, limite de baixo estoque, variantes e historico de movimentacoes.
- `components/admin/product-image-manager.tsx`: reordenacao admin passou a compartilhar a ordenacao central de imagens; a lista local do drag-and-drop agora sincroniza quando o servidor devolve imagens atualizadas apos upload/exclusao.
- `components/admin/product-image-manager.tsx`: removidos formularios internos da galeria; capa, exclusao e salvar ordem agora usam `SubmitButton formAction` dentro do formulario principal, com `formNoValidate`, e o `DndContext` recebeu id fixo por produto.
- `README.md`, `READMEAI.md`: documentado o ajuste de hidratacao da galeria admin.
- `lib/admin-actions.ts`: actions de galeria (`updateImageOrder`, `setCoverImage`, `deleteProductImage`) passaram a validar imagem inexistente, retornar mensagens amigaveis, restringir updates por `product_id`, checar erros e revalidar a pagina do produto sem gerar erro bruto no admin.
- `lib/utils.ts`, `lib/admin-actions.ts`: parse manual de preco passou a aceitar virgula e ponto decimal via logica compartilhada; validacao/importacao usam `getProductPricing()`.
- `app/sitemap.ts`: sitemap com home e uma URL por produto ativo.
- `app/admin/produtos/page.tsx`: listagem admin inclui atalho `Ver pagina` para produtos ativos.
- `components/icons/whatsapp-icon.tsx`, `lib/whatsapp.ts`, `components/catalog/whatsapp-button.tsx`: icone, montagem centralizada de links `wa.me` com `NEXT_PUBLIC_WHATSAPP_NUMBER` e botao flutuante sem fundo fixo no centro inferior; mensagem de produto fica `Ola, tenho interesse no {nome do produto}` sem URL.
- `components/admin/*`, `app/admin/*`: login e telas admin; `components/admin/admin-shell.tsx` inclui atalho para abrir `/` em nova aba.
- `app/admin/produtos/importar/page.tsx`: tela de upload e feedback da importacao CSV, incluindo avisos de ajustes automaticos.
- `app/admin/produtos/importar/page.tsx`, `lib/admin-actions.ts`: importacao CSV ganhou modo de estoque `Substituir` ou `Somar ao estoque atual`; o resultado mostra qual modo foi usado.
- `public/templates/produtos.csv`: modelo de CSV para produtos.
- `components/ui/*`: componentes shadcn-style usados pelo admin.
- `supabase.sql`: arquivo oficial para aplicar/evoluir o banco Supabase; agora inclui `product_variants`, `catalog_banners` com imagem mobile/foco, `stock_movements`, `analytics_events`, campos `sku` e `low_stock_threshold` em `products`, indices, RLS e policies.
- `scripts/create-admin.mjs`: script para criar admin via chave de backend (`SUPABASE_SECRET_KEY`, com fallback legado para `SUPABASE_SERVICE_ROLE_KEY`). Nao usa signup publico.
- `lib/env.ts`, `lib/supabase/server.ts`, `lib/supabase/browser.ts`, `lib/supabase/public.ts`, `next.config.mjs`: frontend passou a usar chave publica/publishable do Supabase e ganhou trava explicita contra `sb_secret_`/`service_role` em `NEXT_PUBLIC_*`.
- `README.md`, `READMEAI.md`, `.env.example`: instrucoes de setup/deploy atualizadas para Vercel, chave publishable no frontend e segredo de backend fora do frontend.
- `.env`: atualizado para usar `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` no frontend e `SUPABASE_SECRET_KEY` no backend local.
- `supabase.sql`, `lib/settings.ts`, `lib/whatsapp.ts`, `lib/admin-data.ts`, `lib/admin-actions.ts`, `components/catalog/whatsapp-button.tsx`, `components/catalog/product-variant-picker.tsx`, `app/page.tsx`, `app/produto/[slug]/page.tsx`: numero do WhatsApp passou a ser configuravel por `site_settings`, com fallback seguro no `.env` e revalidacao do catalogo apos salvar.
- `app/admin/configuracoes/page.tsx`, `components/admin/admin-shell.tsx`, `app/admin/page.tsx`: adicionada area admin para trocar o WhatsApp do catalogo e atalhos/menu para a nova tela.
- `app/admin/financas/page.tsx`, `components/admin/admin-shell.tsx`, `app/admin/page.tsx`: adicionada area financeira operacional com produtos cadastrados, unidades em estoque, valor bruto potencial se vender tudo, resumo por categoria e impacto de descontos.
- `app/admin/categorias/page.tsx`, `lib/admin-actions.ts`: categorias ganharam formulario por categoria para mover varios produtos de uma vez usando checkboxes.
- `components/admin/admin-shell.tsx`: nav do admin removeu rolagem horizontal e passou a usar `flex-wrap`, `min-w-0`, logo sem encolher e botao Sair estavel.

## [BLOQUEIOS/ERROS]

- O workspace comecou vazio e sem `.git`.
- `npm` via PowerShell (`npm.ps1`) esta bloqueado por Execution Policy. Use sempre `npm.cmd` e `npx.cmd` neste ambiente.
- O build local pode retornar catalogo vazio se `.env.local` ainda nao existir; isso e intencional para permitir compilar antes de conectar ao Supabase.
- O projeto foi migrado para Next 16.2.3 depois que o escopo permitiu tecnologia mais atual; isso removeu o alerta de audit da linha Next 14/15.
- As portas `3000` e `3001` ja estavam ocupadas por outros servicos; o dev server do Liensi foi iniciado em `http://localhost:3002`.
- Variaveis `NEXT_PUBLIC_*` sao lidas pelo Next no build/dev server; se mudar `NEXT_PUBLIC_SITE_URL` ou o fallback `NEXT_PUBLIC_WHATSAPP_NUMBER` com o servidor aberto, reiniciar `npm.cmd run dev`. O WhatsApp salvo em `/admin/configuracoes` vem de `site_settings` e nao precisa de rebuild.
- Paginas de produto chegaram a retornar 404 mesmo com produto ativo porque `params.slug` estava sendo lido de forma sincrona. No Next 16, `params` e `searchParams` devem ser aguardados. Corrigido em `/produto/[slug]`, `/admin/produtos/[id]/editar`, `/`, `/admin/login` e `/admin/produtos/importar`.
- O setup agora bloqueia `next dev`/`next build` se uma chave secreta do Supabase (`sb_secret_` ou JWT `service_role`) for colocada em `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` ou `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Se isso acontecer, mover a chave para `SUPABASE_SECRET_KEY` e cadastrar a chave publica correta no frontend.
- Esse bloqueio foi contornado ao corrigir o `.env` local; builds atuais passam usando `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- O importador CSV nao faz upload de arquivos de imagem; ele apenas vincula `image_paths` ja existentes no bucket `produtos`. Para imagem nova, subir pelo formulario do produto ou via Storage antes de importar o path.
- A primeira tentativa com `C:\Users\lithy\Downloads\roxflow-estoque-2026-04-11T23-11-08.csv` retornou `created=0`, `updated=0`, `errors=19`, porque o CSV nao tinha coluna `categoria`. O importador foi ajustado novamente para nao exigir categoria nem preco/estoque perfeitos: categoria ausente usa `Geral`, preco ausente/invalido usa `0` e deixa o produto inativo, estoque ausente/invalido usa `0`.
- No modo `Somar ao estoque atual`, CSV com estoque ausente/invalido soma `0`, porque a importacao permissiva continua usando default seguro. Conferir avisos da tela antes de considerar o estoque final fechado.
- Build falhou uma vez porque `??` foi misturado com `||` sem parenteses nos `alt` de banner. Corrigido usando `(banner.alt_text ?? banner.title) || ...`.
- Para estoque profissional houve mudanca de banco; e obrigatorio reexecutar `supabase.sql` antes de usar `/admin`, `/admin/produtos` e edicao de produto com a nova UI.
- Para banners responsivos tambem houve mudanca de banco; e obrigatorio reexecutar `supabase.sql` antes de salvar banner com imagem mobile/foco. A consulta publica de banners tem fallback para compilar/carregar enquanto as colunas novas ainda nao existem.
- `sharp` foi adicionado como dependencia de runtime porque o processamento de imagem acontece nas server actions. Nao importar `lib/image-processing.ts` em componentes client.
- Para analytics houve mudanca de banco; e obrigatorio reexecutar `supabase.sql` para criar `analytics_events`. Antes disso, `/admin/analytics` mostra aviso de setup, e `/api/analytics/event` responde sem quebrar a navegacao caso a insercao falhe.
- Para WhatsApp configuravel houve mudanca de banco; e obrigatorio reexecutar `supabase.sql` para criar `site_settings`. Antes disso, o catalogo usa `NEXT_PUBLIC_WHATSAPP_NUMBER` como fallback e `/admin/configuracoes` mostra aviso de setup.
- `next/image` exige que `NEXT_PUBLIC_SUPABASE_URL` esteja disponivel no build para configurar `remotePatterns`. Sem essa env, o build ainda passa, mas imagens remotas do Supabase precisam do env correto no runtime/build de producao.
- Build falhou uma vez porque `discountPercentage` pode ser `null` na ordenacao por promocoes. Corrigido com fallback `?? 0`.
- Para variantes houve mudanca de banco; e obrigatorio reexecutar `supabase.sql` antes de salvar produtos com variantes. A consulta publica de produtos tem fallback para compilar/carregar enquanto `product_variants` ainda nao existe, mas o admin depende da tabela nova.
- Build falhou uma vez depois de adicionar o fallback de variantes porque o tipo retornado pelo Supabase virou `GenericStringError`; corrigido usando cast explicito via `unknown` em `lib/catalog.ts`.
- Favicons podem ficar presos no cache do navegador. Depois de trocar `Liensi.png` ou regenerar icones, testar com hard refresh, aba anonima ou limpando cache do site.
- A exclusao de imagem do produto podia parecer nao funcionar porque `ProductImageManager` mantinha estado local para o drag-and-drop sem sincronizar novas props apos o refresh do server action. Corrigido com sincronizacao por `useEffect`.
- A exclusao/definicao de capa tambem podia cair em erro bruto quando a imagem ja tinha sido removida ou quando a tela estava desatualizada. Corrigido usando `maybeSingle()`, `adminRedirect()` e checagem explicita dos erros do Supabase.
- Se a remocao do arquivo no Storage falhar depois de remover o vinculo em `product_images`, o produto deixa de exibir a imagem e o admin mostra aviso de possivel limpeza manual do Storage.
- A tela de edicao de produto gerou hydration error porque `ProductForm` e um `<form>` e `ProductImageManager` renderizava outros `<form>` para capa/exclusao/ordem. Corrigido trocando os formularios internos por botoes com `formAction`; manter `formNoValidate` para acoes da galeria nao serem bloqueadas por campos obrigatorios do cadastro.
- O `aria-describedby` do `@dnd-kit` tambem podia divergir entre server e client (`DndDescribedBy-*`). Corrigido passando `id` estavel ao `DndContext`.
- A lista de ultimos eventos do analytics podia alongar demais a pagina. Corrigido com componente client pequeno que mostra 8 eventos por vez; sem mudanca de schema ou consulta.
- Havia rotulos publicos do catalogo com tom tecnico ou sem acentos (`Ordem`, `Catalogo`, `price-asc` na URL, `OFF`, `un.`, `Sem categoria`). Corrigido na UI e nas URLs geradas pelos filtros, sem remover suporte aos links antigos.
- O filtro publico exibia `Todas as categorias` e tambem a categoria `Geral`, causando duplicidade. Corrigido escondendo `Geral` da lista publica e tratando `categoria=geral` como todas as categorias.
- O seletor publico de variantes mostrava bolinha de cor baseada em `color_hex`, e o admin pedia codigo hexadecimal. Corrigido removendo a bolinha no publico e removendo o campo de cor do editor admin; a coluna segue nullable no banco apenas por compatibilidade.

## [PROXIMOS PASSOS]

1. Reexecutar `supabase.sql` no Supabase para criar/atualizar schema, incluindo `product_variants`, banners responsivos, `stock_movements`, `analytics_events`, `site_settings`, campos de SKU/baixo estoque, policies, whitelist admin e confirmacao de email para `liensiparadise@gmail.com`.
2. Ajustar env local/Vercel para usar `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` no frontend; se existir uma `sb_secret_...` atual em `NEXT_PUBLIC_SUPABASE_ANON_KEY`, mover essa credencial para `SUPABASE_SECRET_KEY` e buscar a publishable key correta no painel do Supabase.
3. Ajustar na Vercel os mesmos valores corrigidos localmente: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_WHATSAPP_NUMBER` e, quando souber o dominio final, `NEXT_PUBLIC_SITE_URL`.
4. Se o login ainda falhar, confirmar/criar o usuario em Supabase Auth ou adicionar `SUPABASE_SECRET_KEY` e rodar `npm.cmd run create-admin -- liensiparadise@gmail.com <senha>`.
5. Abrir `/admin/produtos/[id]/editar` no navegador e confirmar que a galeria nao mostra mais hydration error, que reordenar/salvar ordem funciona, que definir capa funciona e que excluir imagem continua pedindo confirmacao.
6. Abrir `/admin/analytics` com mais de 8 eventos recentes e confirmar que a lista inicial fica curta, que `Ver mais` adiciona mais eventos sem scroll longo inicial e que o estado vazio continua funcionando.
7. Abrir a home e testar filtros publicos: nao deve aparecer o titulo `Escolha com calma`, a categoria `Geral` nao deve aparecer separada de `Todas as categorias`, busca deve gerar `?busca=...`, categoria deve gerar `categoria`, ordenacao deve mostrar `Promocao`, gerar `ordem=menor-preco`/`maior-preco`/`promocoes`, e links antigos com `category`/`sort` ainda devem funcionar.
8. Rodar `npm.cmd run lint` e `npm.cmd run build` apos novas alteracoes.
9. Testar fluxo admin: criar categoria, criar produto, adicionar variantes com estoque, enviar imagens, reordenar galeria, definir capa, excluir imagem secundaria, excluir imagem de capa, ajustar estoque e conferir checklist de prontidao.
10. Testar importacao CSV com `C:\Users\lithy\Downloads\roxflow-estoque-2026-04-11T23-11-08.csv` nos dois modos de estoque (`Substituir` e `Somar`) e confirmar no feedback da tela quantos produtos foram criados/atualizados e quantos ajustes automaticos foram aplicados.
11. Criar pelo menos um banner em `/admin/banners`, testar imagem desktop/mobile, ajustar foco e validar que a home mostra o carrossel; desativar/excluir todos e validar que a area some.
12. Validar no admin que mensagens de sucesso/erro aparecem, botoes entram em loading e confirmacoes bloqueiam exclusoes acidentais.
13. Testar filtros de estoque em `/admin/produtos`, mudar estoque inline em produto sem variante, mudar estoque por variante no formulario e confirmar o historico em `/admin/produtos/[id]/editar`.
14. Com dados reais no Supabase, validar visualmente a home, detalhe de produto, filtros/ordenacao, swipe mobile e o fluxo completo do admin.
15. Testar analytics: abrir a home em aba anonima, clicar em um produto, clicar no WhatsApp e confirmar em `/admin/analytics` que os eventos aparecem apos alguns segundos.
16. Testar `/admin/configuracoes`: trocar o WhatsApp, abrir o catalogo e confirmar que o link `wa.me` usa o numero novo sem novo deploy.
17. Testar `/admin/financas` com produtos com e sem variantes, confirmando que o valor potencial usa estoque agregado e preco promocional valido.
18. Testar `/admin/categorias`: mover produtos em massa para uma categoria e conferir que filtros do catalogo e paginas de produto atualizam.
19. Validar visualmente o favicon na aba do navegador e os icones de atalho/mobile depois de subir ou reiniciar o dev server.
20. Futuramente, se o volume crescer, criar agregacoes SQL/materialized views para analytics em vez de ler ate 5.000 eventos recentes no admin.

## [NOTAS DE ARQUITETURA]

- Somente usuarios autenticados cujo email ativo existe em `public.admin_users` sao admin.
- O catalogo usa leitura publica via RLS apenas para produtos ativos; admins autenticados conseguem ler produtos inativos.
- As policies de escrita usam `public.is_admin()`; signup publico nao concede admin sem whitelist.
- `site_settings` e tabela publica apenas para chaves explicitamente liberadas por policy (`whatsapp_number`). Nao guardar segredos nela; configuracoes sensiveis devem ficar em env/backend.
- Nao adicionar login/cadastro de cliente sem uma mudanca explicita de escopo.
- Nao expor link de admin no catalogo publico; o acesso ao admin deve ser conhecido pelo dono e feito via `/admin`.
- `supabase.sql` e o arquivo canonico para mudancas de banco; sempre atualizar ele quando novas entidades/campos/policies forem necessarios.
- Mutations do admin chamam `revalidatePath` e `revalidateTag(..., "max")` para atualizar home e paginas de produto no contrato do Next 16.
- Next 16 usa `proxy.ts` no lugar de `middleware.ts`; a protecao do `/admin` fica nesse arquivo.
- Rotas admin exportam `dynamic = "force-dynamic"` para nao pre-renderizar paginas dependentes de cookies/auth.
- Paginas de produto usam `generateStaticParams()` com slugs ativos retornados por `getProductSlugs()`, ISR de 60 segundos e `dynamicParams = true` para permitir novos produtos depois do build.
- Em rotas App Router no Next 16, tipar `params`/`searchParams` como `Promise<...>` e usar `await` antes de acessar propriedades. Ler direto pode produzir 404/intermitencia em rotas dinamicas.
- `app/sitemap.ts` usa `NEXT_PUBLIC_SITE_URL` via `siteUrl` em `lib/env.ts`; se nao houver valor, cai para `http://localhost:3000` ou `VERCEL_URL`.
- O frontend deve usar `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` como chave publica preferencial; `NEXT_PUBLIC_SUPABASE_ANON_KEY` segue apenas como fallback legado.
- `next.config.mjs` faz fail-fast quando encontra `sb_secret_` ou JWT `service_role` em `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`, para impedir deploy com segredo exposto no bundle.
- `scripts/create-admin.mjs` deve usar `SUPABASE_SECRET_KEY` como chave de backend; `SUPABASE_SERVICE_ROLE_KEY` ficou como compatibilidade legado.
- `supabase.sql` e o unico arquivo canonico de banco. Ele nao define mais senha fixa para o admin; o SQL so confirma email e whitelist, e a senha deve nascer fora do repositorio.
- Os icones do app usam as convencoes do App Router: `app/favicon.ico`, `app/icon.png` e `app/apple-icon.png`. Arquivos complementares ficam em `public/` e sao referenciados por `public/site.webmanifest`.
- O recorte dos icones usa o simbolo central de `Liensi.png`, nao a arte inteira com texto, para manter leitura em 16x16/32x32. A fonte atual e 500x500; o recorte usado foi 300x300 a partir de `left=100`, `top=100`. Se a imagem fonte mudar de novo, recalcular o recorte e regenerar todos os tamanhos juntos.
- A seta de voltar da pagina de produto e um `Link` para `/#catalogo`, nao `history.back()`, para funcionar bem mesmo quando o usuario abre a URL direta ou vem de fora.
- A descricao do produto e um client component pequeno apenas para medir overflow e alternar `Ver mais`. Manter a pagina de produto como Server Component e nao mover dados/queries para o client.
- Em desktop, a galeria da pagina de produto fica em wrapper `lg:sticky lg:top-24` e a coluna textual usa alinhamento ao topo; isso evita o texto ficar centralizado ao lado da foto e melhora descricoes maiores.
- O botao WhatsApp publico e fixo no centro inferior, sem fundo, com `size-[clamp(64px,12vmin,120px)]` e icone `size-[clamp(46px,8.4vmin,84px)]`, para escalar como porcentagem da viewport sem perder limite minimo/maximo. O numero vem de `site_settings.whatsapp_number` quando a tabela existe e cai para `NEXT_PUBLIC_WHATSAPP_NUMBER` como fallback; `lib/whatsapp.ts` monta `https://wa.me/<numero>?text=...` e normaliza com `digitsOnly`. Na pagina do produto a mensagem nao leva URL: `Ola, tenho interesse no {nome do produto}`.
- Imagens ficam publicas no bucket `produtos`, evitando URL assinada para o catalogo.
- Produto sem imagem e um estado valido. Nao adicionar constraint exigindo imagem em `product_images`.
- `getProductMedia()` e a fonte unica para ordenar galeria, capa e futuros slides de carrossel.
- `ProductImageManager` mantem estado local somente para permitir reordenacao drag-and-drop antes de salvar. Sempre sincronizar esse estado quando `images` mudar; senao imagens excluidas podem continuar aparecendo ate reload completo.
- Como `ProductImageManager` e renderizado dentro de `ProductForm`, nao adicionar `<form>` dentro dele. Para novas actions de galeria, usar `SubmitButton` com `formAction` e `formNoValidate`.
- Manter `DndContext` da galeria com id derivado de `productId`; sem id fixo, o contador interno do `@dnd-kit` pode gerar `aria-describedby` diferente entre SSR e client.
- `deleteProductImage()` remove primeiro o registro em `product_images` e depois tenta limpar o arquivo do Storage. Isso prioriza tirar a imagem do catalogo/admin mesmo se o arquivo fisico falhar; nesse caso a action mostra aviso de limpeza manual.
- Ao excluir uma imagem marcada como capa, `deleteProductImage()` escolhe a proxima imagem por `display_order` como capa. Nao mover essa regra para o client.
- Cards e galeria publica usam `next/image`; manter `next.config.mjs` sincronizado com o dominio do Supabase quando mudar o projeto.
- Produto sem imagem usa `CatalogImagePlaceholder`, nao deve quebrar layout nem obrigar upload antes da publicacao.
- `getProductPricing()` e a fonte unica para decidir se a promocao e valida. So considerar promocao ativa quando `promotional_price` existir, for maior/igual a zero e menor que `price`; `discountPercentage` alimenta os badges `% OFF`.
- `getCatalogProducts(search, category, sort)` aceita ordenacao `newest`, `price-asc`, `price-desc` e `promo`; a ordenacao acontece depois da normalizacao dos produtos para usar preco atual/promocional.
- A URL publica nova dos filtros deve usar `busca`, `categoria` e `ordem`; `ordem` aceita `mais-recentes`, `menor-preco`, `maior-preco` e `promocoes`. `lib/catalog.ts` ainda aceita valores antigos (`newest`, `price-asc`, `price-desc`, `promo`) para compatibilidade.
- Na copy publica do catalogo, evitar termos tecnicos ou abreviados como `Ordem`, `OFF`, `un.`, `Sem categoria` e qualquer valor de codigo. Preferir `Organizar por`, `% de desconto`, `unidade(s)` e `Curadoria Liensi`.
- `Geral` e categoria fallback de importacao/cadastro, mas nao deve aparecer como filtro separado na vitrine; manter unificado em `Todas as categorias`.
- `catalog_banners` controla o carrossel do topo da home. Publico le apenas banners ativos; admin le/escreve tudo via `public.is_admin()`.
- Banners usam o mesmo bucket publico `produtos`, no prefixo `banners/`. Ao excluir ou trocar imagem de banner, o arquivo antigo tambem e removido do Storage.
- Banners agora aceitam `mobile_storage_path` opcional e `focal_point_x`/`focal_point_y` de 0 a 100. O catalogo usa `<picture>` com source mobile ate 767px e `object-position` pelo foco salvo.
- Se nao houver banner ativo, `CatalogBannerCarousel` retorna `null`; nao reintroduzir hero estatico sem pedido explicito.
- Uploads manuais de produto e banner devem passar por `optimizeImageUpload()` em `lib/image-processing.ts`, que aceita JPG/PNG/WebP ate 10 MB, aplica `rotate()`, limita dimensoes e gera WebP. Produto salva em `products/{productId}/{uuid}.webp`; banner salva em `banners/desktop-{uuid}.webp` e `banners/mobile-{uuid}.webp`.
- `lib/catalog.ts` tenta selecionar as novas colunas de banner e faz fallback para o select antigo se o Supabase ainda nao tiver a migracao aplicada, evitando quebra de build antes do usuario reexecutar o SQL.
- `analytics_events` registra `catalog_view`, `product_card_click`, `product_view` e `whatsapp_click`. Publico so tem policy de insert; admin autenticado via `public.is_admin()` consegue ler e deletar.
- O visitante anonimo fica em `localStorage` como `liensi_visitor_id`. Isso mede navegador/dispositivo, nao pessoa real; nao usar esses numeros como venda confirmada.
- `trackAnalyticsEvent()` usa `navigator.sendBeacon()` quando possivel e `fetch(..., keepalive: true)` como fallback para nao perder cliques antes de navegacao/abertura do WhatsApp.
- `/api/analytics/event` valida payload com Zod e grava com cliente publico Supabase. Erros de insert retornam 202 para nao atrapalhar o catalogo.
- `/admin/analytics` agrega no servidor os ultimos 5.000 eventos do periodo escolhido (7/30/90 dias). Conversao de produto usa visitantes unicos que clicaram no card e tambem clicaram no WhatsApp no mesmo periodo.
- `RecentAnalyticsEvents` e o unico client component dos ultimos eventos; a pagina server formata e envia somente `id`, titulo, horario e detalhe para evitar serializar metadata/user agent desnecessarios.
- `/admin` e o painel inicial e nao deve voltar a ser apenas redirect; ele serve como checklist operacional diario.
- `getProductReadiness()` centraliza o checklist de produto incompleto: imagem, descricao, preco, categoria e estoque. O admin usa isso no painel, listagem e formulario.
- Estados de UI criados: `app/error.tsx`, `app/admin/error.tsx`, `app/admin/loading.tsx`, `app/produto/[slug]/loading.tsx`, 404 editorial e OG image dinamica.
- `SubmitButton` usa `useFormStatus()` e confirmacao via `window.confirm()`. Usar esse componente em novas mutations admin para manter loading/confirmacao consistentes.
- A previa do produto em `ProductForm` e apenas visual; a fonte de verdade continua sendo o FormData validado em `saveProduct()`.
- `products.sku` e opcional e tem indice unico parcial `products_sku_unique_idx` quando preenchido.
- `products.low_stock_threshold` controla baixo estoque por produto; o dashboard/listagem nao usam mais limite fixo global.
- `stock_movements` registra `quantity_delta`, `stock_before`, `stock_after`, `reason`, `note`, `created_by` e `created_by_email`; publico nao tem acesso.
- `product_variants` e opcional. Com pelo menos uma variante ativa, `getProductStock()` soma o estoque das variantes ativas e ignora `products.stock` para a vitrine. Sem variantes ativas, `products.stock` continua sendo o estoque geral/fallback.
- Variantes inativas nao aparecem no seletor publico e nao contam para estoque. Produtos com variantes nao usam ajuste inline de estoque na listagem admin; editar no formulario para manter o historico por variante.
- `stock_movements.variant_id` usa `on delete set null` e `variant_name` preserva o nome exibivel quando a variante for removida.
- O WhatsApp da pagina de produto recebe `Produto - Variante` quando uma variante esta selecionada, sem link da pagina, mas o analytics ainda registra o produto pelo `product_id`/`slug` principal.
- `lib/catalog.ts` tenta selecionar `product_variants` e cai para select antigo se a tabela ainda nao existir; isso protege catalogo/build antes da migracao ser aplicada, mas nao substitui reexecutar o SQL para o admin.
- Custo de compra foi intencionalmente deixado fora desta rodada porque `products` e tabela legivel publicamente para o catalogo. Se for adicionar custo/margem, preferir tabela admin-only separada ou revogacao granular de coluna antes de expor no schema publico.
- Importacao CSV usa `slug` como chave de upsert de produto; imagens no CSV substituem os registros de `product_images` daquele produto sem apagar arquivos do Storage. Quando o CSV nao tiver `slug`, o slug e gerado por nome com `sku`/`id` como sufixo quando existir.
- Importacao CSV agora tem `stock_mode`: `replace` mantem o comportamento antigo e troca `products.stock` pelo CSV; `add` soma a quantidade do CSV ao `products.stock` existente apenas para produtos ja existentes. Produtos novos sempre entram com o estoque do CSV.
- O CSV ainda altera somente `products.stock`. Produtos com variantes ativas exibem estoque por `product_variants`, entao o CSV atualiza apenas o fallback desses produtos; para estoque real por variacao, editar variantes no formulario.
- `formatProductName()` em `lib/utils.ts` normaliza exibicao de nomes para formato de titulo, mantendo conectores como `de`, `da`, `do`, `com`, `para` em minusculo quando nao sao a primeira palavra. Novos produtos salvos pelo admin/importados por CSV tambem usam essa normalizacao no campo `name`.
- Importacao CSV e permissiva por design: categoria nao e obrigatoria, campos ausentes recebem defaults seguros e os avisos aparecem no painel de resultado para revisao posterior no admin.

