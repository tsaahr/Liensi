# Liensi

Catalogo publico para sex shop com curadoria editorial e atendimento direto pelo WhatsApp. O cliente navega pelos produtos, filtra por categoria, busca por nome e abre uma mensagem pronta no WhatsApp. Nao ha carrinho, pagamento ou login de cliente.

O projeto tambem inclui uma area admin protegida por Supabase Auth para gerenciar produtos, variantes, categorias, estoque, imagens, banners, importacao CSV, financas operacionais, configuracao de WhatsApp e analytics do funil ate o WhatsApp.

O admin tambem tem uma tela inicial em `/admin` com resumo operacional: produtos ativos, esgotados, estoque baixo, promocoes, banners ativos, atalhos para financas/configuracoes e itens que precisam de atencao.

A tela `/admin/analytics` mostra visitantes anonimos, cliques em produtos, visualizacoes de paginas de produto e cliques no WhatsApp.

O catalogo tambem ja tem polimentos de vitrine para a fase antes dos produtos finais: filtros responsivos, ordenacao, estados vazios, loading, erro, SEO social e checklist de cadastro incompleto no admin.

## Stack

- Next.js 16 com App Router e TypeScript
- React 19
- Tailwind CSS
- Supabase Database, Auth e Storage
- shadcn/ui para a interface admin
- dnd-kit para reordenacao de imagens
- csv-parse para importacao CSV
- sharp para validar, redimensionar e converter uploads para WebP

## Configuracao

1. Instale as dependencias:

```bash
npm.cmd install
```

2. Crie um projeto no Supabase.

3. Execute o SQL de `supabase.sql` no SQL editor do Supabase. O arquivo cria tabelas, indices, RLS e policies do bucket `produtos`, incluindo `product_variants`, `catalog_banners`, banners responsivos, campos de estoque profissional, `stock_movements`, `analytics_events` e `site_settings` para configuracoes publicas seguras como o numero do WhatsApp.

4. O email `liensiparadise@gmail.com` ja esta autorizado como admin no `supabase.sql`. Se o usuario Auth ja existir e estiver pendente de confirmacao, o SQL confirma o email. A senha nao fica mais definida no repositorio.

5. Para criar ou recriar o usuario Auth por script, adicione `SUPABASE_SECRET_KEY` no `.env` (ou `SUPABASE_SERVICE_ROLE_KEY` legado) e rode:

```bash
npm.cmd run create-admin -- liensiparadise@gmail.com sua-senha
```

6. Copie `.env.example` para `.env.local` e preencha:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica-ou-publishable
NEXT_PUBLIC_SITE_URL=https://seudominio.com
NEXT_PUBLIC_WHATSAPP_NUMBER=5511999999999
```

Se voce ainda estiver usando a anon key legada do Supabase, pode usar `NEXT_PUBLIC_SUPABASE_ANON_KEY` como fallback. O projeto agora bloqueia o boot/build se uma chave secreta (`sb_secret_` ou `service_role`) aparecer em qualquer `NEXT_PUBLIC_*`.
Se voce estiver migrando de um `.env` antigo que usava `NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_secret_...`, mova essa chave para `SUPABASE_SECRET_KEY` e use a publishable key em `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

O `NEXT_PUBLIC_SITE_URL` e usado para sitemap e URLs canonicas das paginas de produto. Em desenvolvimento pode usar `http://localhost:3000`.

O `NEXT_PUBLIC_WHATSAPP_NUMBER` e o fallback inicial para montar links `https://wa.me/...` no botao flutuante do catalogo. Depois de aplicar `supabase.sql`, o admin pode trocar esse numero em `/admin/configuracoes` sem novo deploy. Use somente DDI + DDD + numero; se incluir espacos, parenteses ou hifen, o app limpa automaticamente. Na pagina de produto, o botao envia apenas `Ola, tenho interesse no {nome do produto}`.

## Deploy na Vercel

Ao publicar na Vercel, o arquivo `.env.local` do seu computador nao sobe junto. Voce precisa cadastrar as variaveis em `Project Settings > Environment Variables`:

```txt
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_WHATSAPP_NUMBER
```

Notas importantes:

- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e a chave publica do frontend. Nao use `sb_secret_` nem `service_role` aqui.
- `SUPABASE_SECRET_KEY` e so para scripts locais/server-side, como `npm.cmd run create-admin`.
- Depois de mudar env na Vercel, faca um novo deploy.
- Se preferir manter a chave anon antiga, a Vercel tambem aceita `NEXT_PUBLIC_SUPABASE_ANON_KEY`, mas a publishable key e o caminho recomendado.

## Rodando Localmente

```bash
npm.cmd run dev
```

Acesse:

- Catalogo: `http://localhost:3000`
- Admin: `http://localhost:3000/admin`

## Importacao CSV

No admin, acesse `Produtos > Importar`.

O importador cria ou atualiza produtos usando o `slug` como chave. Se a categoria informada nao existir, ela sera criada automaticamente.

Colunas aceitas:

```csv
sku,nome,slug,descricao,preco,preco_promocional,estoque,estoque_minimo,categoria,ativo,image_paths,cover_image_path
```

Tambem sao aceitos aliases em ingles, como `name`, `description`, `price`, `promotional_price`, `stock`, `category` e `active`.

CSVs de estoque da Roxflow tambem sao aceitos:

- `item_name` vira `nome`
- `quantity` vira `estoque`
- `cost_price` ou `cost` vira `preco`
- `sku`, `codigo`, `cod`, `ref` ou `referencia` viram o codigo interno/SKU
- quando nao houver `categoria`, o produto entra na categoria `Geral`

Regras:

- O importador e tolerante para CSVs incompletos.
- `categoria` nunca e obrigatoria; quando faltar, sera criada/usada a categoria `Geral`.
- `nome` e o unico campo realmente necessario. Se faltar, o importador tenta gerar com `sku`, `id` ou `inventory_id`.
- Antes de importar, escolha o modo de estoque: `Substituir estoque pelo CSV` ou `Somar ao estoque atual`.
- Em `Substituir`, produtos existentes ficam exatamente com o estoque do CSV.
- Em `Somar`, produtos existentes recebem `estoque atual + estoque do CSV`; produtos novos entram com o estoque do CSV.
- Se `preco` faltar ou vier invalido, o produto entra com preco `0` e fica inativo ate revisao.
- Se `estoque` faltar ou vier invalido, o produto entra com estoque `0`.
- `estoque_minimo` e opcional; quando vazio, usa `3` como limite de baixo estoque.
- `slug` e opcional; quando vazio, sera gerado pelo nome.
- `ativo` aceita valores como `sim`, `nao`, `true`, `false`, `ativo` e `inativo`.
- `image_paths` e opcional e deve conter caminhos ja existentes no bucket `produtos`, separados por `|`.
- Quando `image_paths` vier preenchido, a galeria cadastrada daquele produto sera substituida pelos paths do CSV.
- Existe um modelo em `public/templates/produtos.csv`.

## Logica de Produtos

- Produtos podem ter zero, uma ou varias imagens. Imagem nao e obrigatoria; sem imagem, o catalogo usa o placeholder visual da LIENSI.
- Uploads manuais de produto aceitam JPG, PNG ou WebP ate 10 MB e sao convertidos para WebP no servidor.
- Imagens principais do catalogo e da pagina de produto usam `next/image` com tamanhos estaveis e dominio do Supabase configurado em `next.config.mjs`.
- A galeria usa `product_images.display_order` para ordenar imagens e `is_cover` para escolher a capa.
- Na edicao admin, as acoes da galeria usam `formAction` nos botoes para funcionar dentro do formulario de produto sem criar `<form>` aninhado.
- Ao excluir uma imagem no admin, o vinculo em `product_images` e removido, a lista da galeria sincroniza apos o refresh e uma nova capa e escolhida automaticamente quando a imagem excluida era a capa.
- A pagina de produto exibe carrossel quando ha mais de uma imagem, com setas, contador, miniaturas e swipe no mobile.
- A base de midia fica centralizada em `getProductMedia()`, com capa, lista ordenada, slides e flags de multiplas imagens.
- Preco real fica em `products.price`; preco promocional opcional fica em `products.promotional_price`.
- A logica de promocao fica centralizada em `getProductPricing()`: ela valida se a promocao e menor que o preco real, calcula o preco atual, o valor de desconto e o percentual de desconto.
- O percentual de desconto aparece nos badges de promocao dos cards e da pagina de produto.
- Campos manuais de preco aceitam formatos como `199,90` e `199.90`.
- Produtos podem ter variantes opcionais em `product_variants`, como tamanho, voltagem, fragrancia ou outra opcao.
- A pagina de produto mostra seletor de variantes quando existe pelo menos uma variante ativa.
- Ao clicar no WhatsApp com uma variante selecionada, a mensagem inclui o nome da variante junto do produto, sem link da pagina.

## Estoque

- Produtos possuem SKU/codigo interno opcional.
- Variantes possuem nome, SKU opcional, estoque proprio, ordem e status ativo/inativo.
- Quando um produto tem variantes ativas, o estoque exibido no catalogo e no admin e a soma do estoque dessas variantes.
- Quando nao ha variantes ativas, o produto usa o estoque geral de `products.stock`.
- A listagem admin nao faz ajuste inline de estoque para produtos com variantes; nesses casos o ajuste fica no formulario do produto, por variante.
- A importacao CSV altera apenas o estoque geral/fallback do produto. Para produtos com variantes, ajuste o estoque de cada variante no formulario do produto.
- Cada produto tem `low_stock_threshold`, usado para alertar baixo estoque no admin.
- A listagem de produtos tem filtros para ativos, inativos, esgotados, baixo estoque e promocoes.
- Alteracoes de estoque feitas pelo formulario do produto, variantes, listagem inline ou importacao CSV geram registros em `stock_movements`.
- O historico de estoque aparece na tela de edicao de cada produto.
- O historico e privado: somente admin autenticado consegue ler/escrever `stock_movements`.
- Custo de compra ainda nao foi adicionado porque e dado sensivel e nao deve ficar exposto junto da tabela publica de produtos sem uma separacao propria.

## Financas e Configuracoes

- A pagina `/admin/financas` calcula produtos cadastrados, produtos ativos, unidades em estoque e valor bruto potencial se todo o estoque ativo for vendido.
- O calculo usa o preco atual do produto: preco promocional quando existir promocao valida, senao preco normal.
- Produtos com variantes usam a soma das variantes ativas, do mesmo jeito que a vitrine publica.
- A tela tambem mostra valor medio por unidade, impacto potencial de descontos e resumo por categoria.
- Esses numeros sao operacionais: nao incluem custo de compra, lucro, frete, taxas, impostos ou venda confirmada.
- A pagina `/admin/configuracoes` permite trocar o numero do WhatsApp do catalogo pelo admin. O valor fica em `site_settings` e o `.env` continua sendo fallback.

## Categorias

- A pagina `/admin/categorias` cria, edita e exclui categorias.
- Ela tambem permite abrir uma categoria e mover varios produtos para ela de uma vez, marcando checkboxes.
- Como cada produto pertence a uma unica categoria, a acao em massa move os produtos selecionados para a categoria escolhida.

## Analytics

- O catalogo registra eventos anonimos de `catalog_view`, `product_card_click`, `product_view` e `whatsapp_click`.
- Cada navegador recebe um `liensi_visitor_id` anonimo no `localStorage`; nao existe login de cliente.
- A rota `/api/analytics/event` valida os eventos e grava em `analytics_events`.
- A pagina `/admin/analytics` mostra visitantes unicos, eventos por tipo, produtos que mais levam ao WhatsApp, conversao card -> WhatsApp e eventos recentes com botao `Ver mais`.
- A conversao e uma metrica de intencao: ela mede clique no WhatsApp, nao confirma envio de mensagem nem venda.
- O app respeita `Do Not Track` quando o navegador envia `navigator.doNotTrack = "1"`.
- O banco nao guarda IP bruto. O evento pode guardar path, referrer, user agent e metadados simples para leitura operacional.

## Banners do Catalogo

- Banners sao gerenciados em `/admin/banners`.
- Cada banner tem imagem desktop obrigatoria, imagem mobile opcional, foco horizontal/vertical, titulo, chamada curta, texto, botao/link, texto alternativo, ordem e status ativo/inativo.
- O catalogo mostra um carrossel no topo quando existe pelo menos um banner ativo, com swipe no mobile.
- Quando nao houver banner ativo, a area de banner nao aparece.
- Uploads de banner aceitam JPG, PNG ou WebP ate 10 MB e sao convertidos para WebP no servidor.
- As imagens dos banners sao salvas no bucket publico `produtos`, nos caminhos `banners/desktop-{uuid}.webp` e `banners/mobile-{uuid}.webp`.
- Quando nao houver imagem mobile, o catalogo usa a imagem desktop tambem no mobile.
- Para habilitar essa funcionalidade no Supabase, reaplique `supabase.sql`.

## Paginas de Produto

Cada produto ativo ganha uma pagina publica em:

```txt
/produto/slug-do-produto
```

Os cards da home apontam para essa pagina, e a listagem admin mostra um botao `Ver pagina` para produtos ativos. A pagina individual tem uma seta clara para voltar ao catalogo. A galeria funciona como carrossel quando o produto tem varias imagens e fica alinhada ao topo no desktop. Descricoes longas aparecem recolhidas com `Ver mais`/`Ver menos`. Quando o produto tem variantes ativas, a pagina mostra as opcoes antes do botao WhatsApp. O Next gera paginas estaticas para os slugs ativos com ISR de 60 segundos e tambem publica `/sitemap.xml` com uma URL por produto.

As paginas de produto possuem metadata propria, Open Graph/Twitter card e fallback de detalhes quando a descricao ainda nao foi escrita.

## Vitrine e SEO

- A home tem busca, filtro por categoria, ordenacao por novidades, menor preco, maior preco e promocao.
- A interface pública do catálogo usa rótulos em português claro: `Buscar produto`, `Ver por categoria`, `Organizar por`, `Mais recentes`, `Menor preço`, `Maior preço` e `Promoção`.
- Os filtros públicos geram URLs legíveis com `busca`, `categoria` e `ordem`; links antigos com `q`, `category` e `sort` continuam funcionando.
- A categoria interna `Geral` fica unificada em `Todas as categorias` na vitrine pública.
- O catalogo mostra contador de produtos encontrados e estado vazio diferente para catalogo sem produtos ou filtros sem resultado.
- Existem telas de loading/erro para produto e admin, alem de uma pagina 404 editorial.
- `/opengraph-image` gera a imagem social padrao da marca.
- `/robots.txt` permite o catalogo publico e bloqueia `/admin` e `/api`.
- O botao do WhatsApp respeita `safe-area-inset-bottom` para nao colar na borda de celulares.
- Os icones do app foram gerados a partir do `Liensi.png` atual: favicon da aba, `app/icon.png`, `app/apple-icon.png`, PNGs para atalhos Android e `public/site.webmanifest`.

No desenvolvimento atual, o app esta rodando em `http://localhost:3002`; a porta `3000` pode estar ocupada por outro servico local. Use a porta exibida pelo `npm.cmd run dev`.

## Comandos

```bash
npm.cmd run lint
npm.cmd run build
npm.cmd run start
```

## Notas

- O cliente final nao faz login. Ele apenas le o catalogo publico e chama o WhatsApp.
- O admin mostra mensagens de sucesso/erro apos acoes comuns e usa botoes com estado de carregamento para evitar cliques duplicados.
- Exclusoes de produto, categoria, banner e imagem pedem confirmacao antes de executar.
- Se uma imagem ja tiver sido removida ou o arquivo do Storage nao puder ser apagado, o admin mostra uma mensagem amigavel em vez de derrubar a pagina de edicao.
- O formulario de produto tem uma previa da vitrine com imagem, categoria, status, estoque e promocao antes de salvar.
- O formulario de produto tambem permite editar SKU, limite de baixo estoque e variantes com estoque proprio, e mostra checklist de prontidao da vitrine.
- A listagem e o painel admin destacam produtos incompletos, com filtro dedicado em `/admin/produtos?stock=incomplete`.
- Nomes de produtos sao exibidos com capitalizacao de titulo no catalogo, paginas de produto e listagem admin.
- Produtos criados manualmente ou importados por CSV passam a salvar o nome com capitalizacao normalizada.
- O header publico nao mostra link para o admin; o acesso admin fica separado em `/admin`.
- O admin tem um atalho `Catalogo` para abrir a vitrine publica.
- O admin tem uma aba `Banners` para editar o carrossel do topo da vitrine.
- O admin tem uma aba `Financas` para acompanhar valor bruto potencial do estoque ativo.
- O admin tem uma aba `Config` para trocar o WhatsApp do catalogo sem redeploy.
- O admin tem uma aba `Analytics` para acompanhar o funil anonimo ate o WhatsApp; os ultimos eventos abrem em uma lista curta e podem ser expandidos com `Ver mais`.
- O menu do admin quebra em varias linhas quando necessario, sem criar rolagem horizontal em telas menores.
- O catalogo publico usa um botao fixo de WhatsApp no centro inferior da tela, sem fundo, exibindo apenas o icone em tamanho proporcional a viewport.
- O favicon e os icones instalaveis usam o simbolo central recortado de `Liensi.png` para manter legibilidade em tamanhos pequenos. Ao trocar `Liensi.png`, regenere os derivados em `app/` e `public/`.
- Nao ha cadastro publico no app.
- O arquivo oficial para aplicar/evoluir o banco e `supabase.sql`.
- Produtos inativos nao aparecem no catalogo publico.
- Produtos inativos nao geram pagina publica acessivel; ao ativar o produto, a pagina fica disponivel em `/produto/[slug]`.
- Produtos sem estoque exibem badge de esgotado e bloqueiam o botao do WhatsApp.
- Produtos com estoque menor ou igual ao limite configurado aparecem como baixo estoque no admin.
- Variantes inativas nao contam no estoque publico nem aparecem no seletor do catalogo.
- Imagens sao salvas no bucket publico `produtos`, no caminho `products/{productId}/{uuid}.webp`.
- Imagens de banner sao salvas no mesmo bucket publico `produtos`, no caminho `banners/...`.
- Somente emails ativos em `public.admin_users` sao tratados como admin.
