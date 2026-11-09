# Sales & Sales Advogados: site institucional

Site one-page em HTML, CSS e JavaScript puro, sem etapa de build. As animações usam GSAP e ScrollTrigger, carregados pelo cdnjs.

## Como abrir

Rode um servidor local na pasta do projeto:

```bash
python -m http.server 5500
```

Depois acesse:

- `http://localhost:5500`: site normal. A abertura com a assinatura aparece uma vez por sessão.
- `http://localhost:5500/?intro=1`: força a abertura, útil para apresentar ao cliente.

Abrir o `index.html` com dois cliques também funciona, mas o servidor reproduz melhor o site publicado.

## Publicação

Envie para qualquer hospedagem estática: `index.html`, `politica-de-privacidade.html` e a pasta `assets/`. A pasta `.claude/` e este README não precisam subir.

Depois de editar o CSS ou o JavaScript, troque o número de versão no `index.html` (`style.css?v=...` e `main.js?v=...`, por exemplo para a data do dia). Sem isso, quem já visitou o site pode continuar vendo a versão antiga, guardada no navegador.

Ative a compressão gzip ou brotli na hospedagem. Ela reduz bastante o tamanho do HTML, do CSS e do JavaScript.

## Dados fictícios a substituir

**Esta é uma versão de demonstração.** Nomes, números e fotos abaixo são fictícios e precisam ser trocados antes de publicar. Nomes de advogados e números de OAB inventados não podem ir ao ar em um site real.

Cada item tem o atributo `data-placeholder` no elemento. Para listar no código, busque por `data-placeholder`. Depois de trocar um item, apague o atributo.

### Conteúdo (`index.html`)

| Seção | Item | Valor fictício atual |
|---|---|---|
| 3. Credibilidade | Anos de atuação | 12. Troque o número no texto e em `data-contador` |
| 6. Escritório | Foto do escritório | `assets/img/escritorio.webp`. O site recorta em 4:3 |
| 6. Equipe | Fotos | `assets/img/equipe-1.webp` a `equipe-3.webp`, 600x750 |
| 6. Equipe | Nomes | Helena Vasconcelos, Rafael Monteiro, Lucas Duarte. Atualize também o `alt` das fotos |
| 6. Equipe | Cargos | Sócia, Sócio, Advogado |
| 6. Equipe | Áreas principais | Trabalhista e Previdenciário; Criminal e Empresarial; Família e Sucessões |
| 6. Equipe | OAB/SP | 000.001, 000.002, 000.003 |
| 9. Contato | Horário | Segunda a sexta, das 9h às 18h |
| Rodapé | Redes sociais | Apontam para a página inicial de cada rede. Troque pelo endereço real |
| Rodapé | Registro na OAB/SP | 00.000 |
| Rodapé | CNPJ | 00.000.000/0001-00 |

Se a equipe tiver mais ou menos de 3 pessoas, duplique ou apague um bloco `<article class="pessoa">`.

As fotos da equipe e do escritório são imagens geradas por IA, só para demonstração. Para trocar, salve as novas fotos com os mesmos nomes de arquivo e em WebP.

### Outros arquivos

| Arquivo | Item |
|---|---|
| `politica-de-privacidade.html` | Texto de exemplo. Precisa de revisão jurídica antes de publicar |
| `index.html`, no `<head>` | ID do Google Tag Manager (ainda como `[PLACEHOLDER]`, em bloco comentado) |
| `index.html`, no `<head>` | ID do Meta Pixel (ainda como `[PLACEHOLDER]`, em bloco comentado) |

### Revisão dos prazos legais

A seção 4 cita prazos reais, com fonte. Peça para um advogado do escritório confirmar os textos antes de publicar. Eles ficam em `<section class="prazos">`, no `index.html`.

## Onde trocar

### Logo

Os vetores da logo ficam no início do `<body>` do `index.html`, nos paths `#logo-emblema` e `#logo-escrita`. Header, rodapé e abertura usam esses mesmos símbolos.

Se a escrita da logo mudar, o percurso da abertura também precisa mudar: ele fica em `#mascaraPena`, no mesmo arquivo, e segue o traço das letras atuais.

Outros arquivos da marca, em `assets/img/`:

- `logo-original.webp`: arquivo recebido do cliente
- `logo.svg`: logo vetorizada completa
- `emblema.svg`: favicon
- `og-image.jpg`: imagem de compartilhamento em redes sociais

### Cores, fontes e espaçamentos

Ficam nas variáveis do `:root`, no início de `assets/css/style.css`. As fontes são carregadas no `<head>` do `index.html`.

O dourado também aparece em dois pontos fora das variáveis: o gradiente `#gradOuro`, no `index.html`, e o texto do selo e o "§" do fundo, na função `desenharFundo()` de `assets/js/main.js`.

### IDs de rastreamento

No `<head>` do `index.html`, descomente os blocos do GTM e do Meta Pixel e troque os IDs. Nenhuma outra alteração é necessária: a função `track()` detecta o que estiver instalado.

Eventos enviados:

| Evento | Dados | Quando |
|---|---|---|
| `whatsapp_click` | `origem`, `area` | Clique em qualquer botão de WhatsApp |
| `hero_chip_selecionado` | `area` | Escolha de um chip na hero |
| `form_etapa` | `etapa` | Cada etapa do formulário |
| `form_enviado` | `area` | Envio do formulário |

Valores de `origem`: `header`, `hero`, `prazos`, `area`, `formulario`, `contato`, `flutuante`.

Nome, telefone e relato digitados no formulário não vão para o rastreamento nem para nenhum servidor: seguem apenas na mensagem que a própria pessoa envia pelo WhatsApp.

### WhatsApp e textos

- **Número e links:** função `whatsappLink()` em `assets/js/main.js`. Todo link passa por ela. Os links de reserva escritos no `index.html`, usados só sem JavaScript, repetem o número.
- **Frases e mensagens da hero:** objeto `AREAS`, em `assets/js/main.js`.
- **Mensagens das áreas:** atributo `data-wa-msg` de cada link, no `index.html`.
- **Telefones e endereço:** seções de contato e menu móvel no `index.html`, e o JSON-LD no `<head>`.

### Domínio

O domínio `salesesalesadvogados.com.br` aparece no `canonical`, nas tags Open Graph e Twitter e no JSON-LD, todos no `<head>`. Atualize esses pontos se o endereço mudar.

## Publicidade da advocacia

Os textos seguem o Provimento 205/2021 da OAB. Ao editar, evite promessa de resultado, preços, descontos, depoimentos de clientes, listas de clientes, número de causas ganhas e linguagem sensacionalista.
