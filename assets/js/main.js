/* ==========================================================================
   Sales & Sales Advogados — comportamento do site
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- Utilidades ---------- */
  const $ = (seletor, raiz = document) => raiz.querySelector(seletor);
  const $$ = (seletor, raiz = document) => Array.from(raiz.querySelectorAll(seletor));

  const raiz = document.documentElement;
  const gsap = window.gsap;
  if (gsap && window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);
  const movimentoReduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- WhatsApp ----------
     Único ponto que gera links. O encodeURIComponent transforma o "&" de
     "Sales & Sales" em %26; sem isso a mensagem chega cortada. */
  const MENSAGEM_PADRAO = 'Olá, Sales & Sales! Vim pelo site e gostaria de falar com um advogado.';

  function whatsappLink(mensagem) {
    return `https://wa.me/5511957761544?text=${encodeURIComponent(mensagem)}`;
  }

  /* ---------- Rastreamento ----------
     Envia para o GTM/GA4 e para o Meta Pixel, se estiverem instalados. */
  function track(evento, dados = {}) {
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: evento, ...dados });
      if (typeof window.fbq === 'function') window.fbq('trackCustom', evento, dados);
    } catch (erro) {
      /* Rastreamento nunca pode quebrar o site */
    }
  }

  /* ---------- Conteúdo da hero ----------
     "palavraChave" recebe o destaque dourado dentro da resposta.
     "ciclo: false" deixa a área fora da rotação automática (só aparece pelo chip). */
  const AREAS = {
    trabalhista: {
      problema: 'Fui demitido e não recebi meus direitos.',
      resposta: 'Seus direitos trabalhistas, defendidos com seriedade.',
      palavraChave: 'trabalhistas',
      mensagem: 'Olá, Sales & Sales! Vim pelo site e gostaria de falar com um advogado sobre uma questão trabalhista.',
    },
    previdenciario: {
      problema: 'Meu benefício do INSS foi negado.',
      resposta: 'Seu caso previdenciário analisado com atenção a cada detalhe.',
      palavraChave: 'previdenciário',
      mensagem: 'Olá, Sales & Sales! Vim pelo site e gostaria de falar com um advogado sobre uma questão previdenciária.',
    },
    familia: {
      problema: 'Preciso fazer um inventário e não sei por onde começar.',
      resposta: 'Questões de família conduzidas com cuidado e discrição.',
      palavraChave: 'família',
      mensagem: 'Olá, Sales & Sales! Vim pelo site e gostaria de falar com um advogado sobre uma questão de família ou sucessões.',
    },
    criminal: {
      problema: 'Recebi uma intimação e estou preocupado.',
      resposta: 'Defesa criminal técnica, ética e presente.',
      palavraChave: 'criminal',
      mensagem: 'Olá, Sales & Sales! Vim pelo site e gostaria de falar com um advogado sobre uma questão criminal.',
    },
    empresarial: {
      problema: 'Preciso de segurança jurídica para minha empresa.',
      resposta: 'Assessoria empresarial para você decidir com segurança.',
      palavraChave: 'empresarial',
      mensagem: 'Olá, Sales & Sales! Vim pelo site e gostaria de falar com um advogado sobre assessoria para a minha empresa.',
    },
    imobiliario: {
      problema: 'Tenho um problema com o meu imóvel.',
      resposta: 'Questões imobiliárias tratadas com clareza.',
      palavraChave: 'imobiliárias',
      mensagem: 'Olá, Sales & Sales! Vim pelo site e gostaria de falar com um advogado sobre uma questão imobiliária.',
    },
    outro: {
      problema: 'Meu caso é diferente e não sei a quem recorrer.',
      resposta: 'Cada caso é único. Converse com a nossa equipe.',
      palavraChave: 'único',
      mensagem: MENSAGEM_PADRAO,
      ciclo: false,
    },
  };

  const CICLO = Object.keys(AREAS).filter((chave) => AREAS[chave].ciclo !== false);

  /* Estado compartilhado: a área escolhida define a mensagem de todos os botões "de contexto" */
  const estado = { area: null };

  function mensagemAtual() {
    return estado.area ? AREAS[estado.area].mensagem : MENSAGEM_PADRAO;
  }

  function atualizarLinksWhatsapp() {
    $$('[data-wa="contexto"]').forEach((link) => { link.href = whatsappLink(mensagemAtual()); });
    sincronizarFormulario();
  }

  /* Um único ouvinte registra o clique de qualquer botão de WhatsApp, com a origem */
  document.addEventListener('click', (evento) => {
    const link = evento.target.closest('[data-wa-origem]');
    if (link) track('whatsapp_click', {
      origem: link.dataset.waOrigem,
      area: link.dataset.waArea || estado.area || 'nenhuma',
    });
  });

  /* ---------- Header ---------- */
  function iniciarHeader() {
    const header = $('#header');
    const aoRolar = () => header.classList.toggle('is-rolado', window.scrollY > 12);
    window.addEventListener('scroll', aoRolar, { passive: true });
    aoRolar();
  }

  /* ---------- Menu móvel ---------- */
  function iniciarMenu() {
    const botao = $('#menuBotao');
    const menu = $('#menuMobile');
    const fundoDoMenu = [$('#conteudo'), $('#rodape'), $('#flutuante')];

    function alternar(abrir) {
      raiz.classList.toggle('menu-aberto', abrir);
      botao.setAttribute('aria-expanded', String(abrir));
      botao.setAttribute('aria-label', abrir ? 'Fechar menu' : 'Abrir menu');
      menu.inert = !abrir;
      fundoDoMenu.forEach((elemento) => { elemento.inert = abrir; });
    }

    botao.addEventListener('click', () => alternar(botao.getAttribute('aria-expanded') !== 'true'));
    menu.addEventListener('click', (evento) => { if (evento.target.closest('a')) alternar(false); });

    document.addEventListener('keydown', (evento) => {
      if (evento.key === 'Escape' && raiz.classList.contains('menu-aberto')) {
        alternar(false);
        botao.focus();
      }
    });

    /* Se a tela crescer com o menu aberto, fecha para não travar a rolagem */
    window.matchMedia('(min-width: 1024px)').addEventListener('change', (evento) => {
      if (evento.matches) alternar(false);
    });
  }

  /* ---------- Fundo da hero: balança da justiça ----------
     Desenho em traço fino, gerado aqui para manter o HTML leve e para mudar a
     composição entre mobile e desktop:
     - a haste é a coluna canelada do emblema do escritório;
     - a base é uma pilha de códigos marcados com o "§";
     - o selo ao redor traz o princípio do art. 5º da Constituição Federal.
     Todas as medidas partem do pivô da balança, que é a origem (0, 0). */
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const LETREIRO_SELO = 'TODOS SÃO IGUAIS PERANTE A LEI · CONSTITUIÇÃO FEDERAL, ART. 5º · ';

  const BRACO = 270;          /* Metade do travessão */
  const QUEDA_PRATO = 300;    /* Distância entre o gancho e o prato */
  const CENTRO_SELO = 260;    /* Altura do centro do selo */
  const RAIO_SELO = 342;
  const PISO = 705;           /* Altura do piso */

  /* A inclinação soma a história contada pelo título com um toque do cursor */
  const inclinacao = { historia: 0, cursor: 0 };
  let partesBalanca = null;

  function aplicarInclinacao() {
    if (!partesBalanca) return;
    const graus = inclinacao.historia + inclinacao.cursor;
    const radianos = (graus * Math.PI) / 180;
    const x = BRACO * Math.cos(radianos);
    const y = BRACO * Math.sin(radianos);
    /* Os pratos seguem as pontas do travessão e balançam um pouco menos que ele */
    const balanco = (-graus * 0.45).toFixed(2);
    partesBalanca.travessao.setAttribute('transform', `rotate(${graus.toFixed(2)})`);
    partesBalanca.pratoEsquerdo.setAttribute('transform', `translate(${(-x).toFixed(2)} ${(-y).toFixed(2)}) rotate(${balanco})`);
    partesBalanca.pratoDireito.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${balanco})`);
  }

  function desenharFundo() {
    const svg = $('#heroLinhas');
    /* Celular e tablet: selo compacto no topo, acima do texto. Desktop: coluna direita.
       Com a escala menor, o traço engrossa e a inscrição aparece uma vez só,
       para continuar legível. */
    const largura = window.innerWidth;
    let composicao = { x: 1263, y: 215, escala: 0.7, traco: 1.3, fonteSelo: 19, repeticoes: 2 };
    if (largura < 640) composicao = { x: 800, y: 130, escala: 0.22, traco: 3.8, fonteSelo: 38, repeticoes: 1 };
    else if (largura < 1024) composicao = { x: 800, y: 120, escala: 0.4, traco: 2, fonteSelo: 26, repeticoes: 1 };

    svg.textContent = '';

    function elemento(tag, atributos, pai) {
      const novo = document.createElementNS(SVG_NS, tag);
      Object.keys(atributos).forEach((nome) => novo.setAttribute(nome, atributos[nome]));
      if (pai) pai.appendChild(novo);
      return novo;
    }

    /* Cada camada tem seu fator de parallax; o grupo interno aplica posição e escala */
    function camada(fator) {
      const externa = elemento('g', { 'data-fator': fator }, svg);
      return elemento('g', {
        transform: `translate(${composicao.x} ${composicao.y}) scale(${composicao.escala})`,
        'stroke-width': composicao.traco,
      }, externa);
    }

    const linha = (pai, x1, y1, x2, y2, opacidade) => elemento('line', {
      x1: x1.toFixed(1), y1: y1.toFixed(1), x2: x2.toFixed(1), y2: y2.toFixed(1),
      'stroke-opacity': opacidade, pathLength: 1,
    }, pai);
    const traco = (pai, d, opacidade) => elemento('path', { d, 'stroke-opacity': opacidade, pathLength: 1 }, pai);
    const circulo = (pai, cx, cy, r, opacidade) => elemento('circle', { cx, cy, r, 'stroke-opacity': opacidade, pathLength: 1 }, pai);

    /* Camada de trás: raios que saem do selo e piso em perspectiva */
    const fundo = camada(0.3);
    for (let graus = -176; graus <= -4; graus += 8) {
      const angulo = (graus * Math.PI) / 180;
      const cos = Math.cos(angulo);
      const sin = Math.sin(angulo);
      const inicio = RAIO_SELO + 34;
      linha(fundo, cos * inicio, CENTRO_SELO + sin * inicio, cos * 1500, CENTRO_SELO + sin * 1500, 0.3);
    }
    const fugaPiso = PISO - 150;
    for (let i = -9; i <= 9; i += 1) {
      const xBase = i * 300;
      const proporcao = (PISO - fugaPiso) / 420;
      linha(fundo, xBase * proporcao, PISO, xBase, fugaPiso + 420, 0.34);
    }
    [0, 14, 34, 64, 108, 172, 262].forEach((queda, indice) => {
      linha(fundo, -1500, PISO + queda, 1500, PISO + queda, indice === 0 ? 0.5 : 0.3);
    });

    /* Selo com a inscrição */
    const selo = camada(0.55);
    circulo(selo, 0, CENTRO_SELO, RAIO_SELO - 22, 0.5);
    circulo(selo, 0, CENTRO_SELO, RAIO_SELO + 24, 0.5);
    const idArco = 'arcoSelo';
    elemento('path', {
      id: idArco,
      stroke: 'none',
      d: `M ${-RAIO_SELO} ${CENTRO_SELO} a ${RAIO_SELO} ${RAIO_SELO} 0 1 1 ${RAIO_SELO * 2} 0 a ${RAIO_SELO} ${RAIO_SELO} 0 1 1 ${-RAIO_SELO * 2} 0`,
    }, selo);
    /* Uma palavra por elemento: como texto único, a inscrição virava o maior item da
       tela e atrasava o LCP, porque só existe depois que o JavaScript roda. */
    const letreiro = LETREIRO_SELO.repeat(composicao.repeticoes);
    const passo = (2 * Math.PI * RAIO_SELO - 8) / letreiro.length;
    Array.from(letreiro.matchAll(/\S+/g)).forEach((palavra) => {
      const inscricao = elemento('text', {
        fill: '#C9A45C',
        'fill-opacity': 0.8,
        stroke: 'none',
        'font-family': 'Cormorant Garamond, serif',
        'font-size': composicao.fonteSelo,
        'font-weight': 500,
      }, selo);
      const textoCurvo = elemento('textPath', {
        href: `#${idArco}`,
        startOffset: (palavra.index * passo).toFixed(1),
      }, inscricao);
      if (palavra[0].length > 1) {
        textoCurvo.setAttribute('textLength', (palavra[0].length * passo).toFixed(1));
        textoCurvo.setAttribute('lengthAdjust', 'spacing');
      }
      textoCurvo.textContent = palavra[0];
    });

    /* A balança */
    const balanca = camada(1);

    /* Haste: a coluna canelada do emblema */
    const meia = 30;
    const topoHaste = 46;
    const baseHaste = 512;
    [-meia, -meia / 3, meia / 3, meia].forEach((x, i) => {
      linha(balanca, x, topoHaste, x, baseHaste, i === 0 || i === 3 ? 1 : 0.5);
    });
    linha(balanca, -46, topoHaste, 46, topoHaste, 1);
    linha(balanca, -38, topoHaste - 14, 38, topoHaste - 14, 1);
    linha(balanca, -46, baseHaste, 46, baseHaste, 1);
    linha(balanca, -70, baseHaste + 16, 70, baseHaste + 16, 1);
    linha(balanca, -46, baseHaste, -70, baseHaste + 16, 1);
    linha(balanca, 46, baseHaste, 70, baseHaste + 16, 1);
    traco(balanca, `M -14 ${topoHaste - 14} L -7 14 M 14 ${topoHaste - 14} L 7 14`, 1);

    /* Pilha de códigos, de cima para baixo */
    const livros = [
      { y: 528, altura: 50, largura: 250, deslocamento: -8 },
      { y: 578, altura: 58, largura: 300, deslocamento: 10 },
      { y: 636, altura: 69, largura: 350, deslocamento: -4 },
    ];
    livros.forEach(({ y, altura, largura, deslocamento }) => {
      const esquerda = deslocamento - largura / 2;
      const direita = deslocamento + largura / 2;
      const lombada = 46;
      /* Capa com lombada arredondada */
      traco(balanca, `M ${direita} ${y} L ${esquerda + 12} ${y} Q ${esquerda} ${y + altura / 2} ${esquerda + 12} ${y + altura} L ${direita} ${y + altura}`, 1);
      linha(balanca, esquerda + lombada, y, esquerda + lombada, y + altura, 0.8);
      linha(balanca, esquerda + lombada + 8, y, esquerda + lombada + 8, y + altura, 0.5);
      /* Folhas */
      [0.25, 0.5, 0.75].forEach((p) => {
        linha(balanca, esquerda + lombada + 8, y + altura * p, direita, y + altura * p, 0.34);
      });
      linha(balanca, direita, y, direita, y + altura, 0.8);
      /* O "§" na lombada */
      const marca = elemento('text', {
        x: esquerda + lombada / 2 + 2,
        y: y + altura * 0.68,
        fill: '#C9A45C',
        'fill-opacity': 0.95,
        stroke: 'none',
        'text-anchor': 'middle',
        'font-family': 'Cormorant Garamond, serif',
        'font-size': Math.round(altura * 0.6),
      }, balanca);
      marca.textContent = '§';
    });

    /* Travessão: gira em torno do pivô */
    const travessao = elemento('g', {}, balanca);
    traco(travessao, `M ${-BRACO} -5 Q 0 -26 ${BRACO} -5`, 1);
    traco(travessao, `M ${-BRACO} 6 Q 0 -8 ${BRACO} 6`, 1);
    [-1, 1].forEach((lado) => {
      circulo(travessao, lado * (BRACO + 10), 0, 10, 1);
      traco(travessao, `M ${lado * 40} -20 Q ${lado * 90} -34 ${lado * 130} -18`, 0.5);
    });
    circulo(travessao, 0, 0, 20, 1);
    circulo(travessao, 0, 0, 8, 1);
    /* Remate acima do pivô */
    traco(balanca, 'M 0 -66 L 12 -44 L 0 -22 L -12 -44 Z', 1);

    /* Pratos: nascem no gancho, que é a origem de cada grupo */
    function prato() {
      const grupo = elemento('g', {}, balanca);
      const aba = 112;
      circulo(grupo, 0, 8, 6, 1);
      linha(grupo, 0, 14, -aba, QUEDA_PRATO, 0.8);
      linha(grupo, 0, 14, aba, QUEDA_PRATO, 0.8);
      linha(grupo, 0, 14, 0, QUEDA_PRATO + 14, 0.5);
      elemento('ellipse', { cx: 0, cy: QUEDA_PRATO, rx: aba, ry: 14, 'stroke-opacity': 1, pathLength: 1 }, grupo);
      traco(grupo, `M ${-aba} ${QUEDA_PRATO} Q 0 ${QUEDA_PRATO + 92} ${aba} ${QUEDA_PRATO}`, 1);
      traco(grupo, `M ${-aba * 0.62} ${QUEDA_PRATO + 26} Q 0 ${QUEDA_PRATO + 66} ${aba * 0.62} ${QUEDA_PRATO + 26}`, 0.4);
      return grupo;
    }

    partesBalanca = { travessao, pratoEsquerdo: prato(), pratoDireito: prato() };
    aplicarInclinacao();

    return svg;
  }

  /* Traços do fundo se desenham uma vez, depois da abertura */
  function animarEntradaFundo() {
    if (!gsap || movimentoReduzido) return;
    if (window.innerWidth < 1024) {
      gsap.from('#heroLinhas', { opacity: 0, duration: 1, clearProps: 'opacity' });
      return;
    }
    const tracos = $$('#heroLinhas line, #heroLinhas circle, #heroLinhas ellipse, #heroLinhas path[pathLength]');
    gsap.set(tracos, { strokeDasharray: 1, strokeDashoffset: 1 });
    gsap.to(tracos, {
      strokeDashoffset: 0,
      duration: 1.5,
      ease: 'power2.inOut',
      stagger: { amount: 0.7, from: 'random' },
      onComplete: () => gsap.set(tracos, { clearProps: 'strokeDasharray,strokeDashoffset' }),
    });
  }

  let limparParallax = () => {};

  function iniciarParallax() {
    if (!gsap || movimentoReduzido) return;

    /* Ao cruzar o breakpoint o fundo é redesenhado: desfaz o parallax anterior */
    limparParallax();
    const controle = new AbortController();
    const contexto = gsap.context(() => montarParallax(controle.signal));
    limparParallax = () => {
      controle.abort();
      contexto.revert();
    };
  }

  function montarParallax(sinal) {
    const camadas = () => $$('#heroLinhas > g');
    const brilho = $('#heroBrilho');
    const temCursor = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    if (temCursor) {
      const hero = $('#topo');
      const moverX = camadas().map((g) => gsap.quickTo(g, 'x', { duration: 1.1, ease: 'power3' }));
      const moverY = camadas().map((g) => gsap.quickTo(g, 'y', { duration: 1.1, ease: 'power3' }));
      const fatores = camadas().map((g) => Number(g.dataset.fator));
      const brilhoX = gsap.quickTo(brilho, 'x', { duration: 0.9, ease: 'power3' });
      const brilhoY = gsap.quickTo(brilho, 'y', { duration: 0.9, ease: 'power3' });

      hero.addEventListener('pointermove', (evento) => {
        const nx = evento.clientX / window.innerWidth - 0.5;
        const ny = evento.clientY / window.innerHeight - 0.5;
        fatores.forEach((fator, i) => {
          moverX[i](-nx * 44 * fator);
          moverY[i](-ny * 28 * fator);
        });
        brilhoX(evento.clientX);
        brilhoY(evento.clientY);
        gsap.to(inclinacao, {
          cursor: nx * 3,
          duration: 1.2,
          ease: 'power3.out',
          overwrite: 'auto',
          onUpdate: aplicarInclinacao,
        });
      }, { passive: true, signal: sinal });
    } else if (window.ScrollTrigger) {
      camadas().forEach((g) => {
        gsap.to(g, {
          y: 90 * Number(g.dataset.fator),
          ease: 'none',
          scrollTrigger: { trigger: '#topo', start: 'top top', end: 'bottom top', scrub: 0.6 },
        });
      });
    }
  }

  /* ---------- Título que conversa ---------- */
  function iniciarTitulo() {
    const frase = $('#heroFrase');
    const aoVivo = $('#heroAoVivo');
    const chips = $$('.chip');
    const lista = $('#casosLista');

    const ESPERA_RETOMADA = 8000;
    const VELOCIDADE_LETRA = 0.027;
    const PAUSA_RESPOSTA = 3;

    let linhaDoTempo = null;
    let indiceCiclo = 0;
    let temporizadorRetomada = null;
    let ultimoToqueNaLista = 0;
    let cicloAtivo = false;
    let foraDeVista = false;
    let ladoBalanca = 1;

    /* A leitura em voz alta acontece só quando a pessoa escolhe uma área.
       Anunciar cada troca automática interromperia o leitor de tela sem parar. */
    function anunciar(area) {
      aoVivo.textContent = `${area.problema} ${area.resposta}`;
    }

    function criar(tag, classe, texto) {
      const elemento = document.createElement(tag);
      if (classe) elemento.className = classe;
      if (texto !== undefined) elemento.textContent = texto;
      return elemento;
    }

    /* Monta as duas camadas de uma vez; cada palavra fica inteira para não quebrar no meio */
    function montar(area) {
      frase.textContent = '';
      frase.classList.add('is-pronta');

      const problema = criar('span', 'problema');
      const risco = criar('span', 'problema__risco');
      const letras = [];
      const palavras = `“${area.problema}”`.split(' ');
      palavras.forEach((palavra, indice) => {
        const grupo = criar('span', 'palavra');
        Array.from(palavra).forEach((caractere) => {
          const letra = criar('span', 'letra', caractere);
          letras.push(letra);
          grupo.appendChild(letra);
        });
        risco.appendChild(grupo);
        if (indice < palavras.length - 1) risco.appendChild(document.createTextNode(' '));
      });
      problema.appendChild(risco);

      const resposta = criar('span', 'resposta');
      const palavrasResposta = area.resposta.split(' ').map((palavra, indice, todas) => {
        const limpa = palavra.replace(/[.,]$/, '');
        const elemento = criar('span', 'resposta__palavra');
        if (limpa === area.palavraChave) {
          /* A pontuação fica fora do dourado */
          elemento.append(criar('span', 'resposta__chave', limpa), palavra.slice(limpa.length));
        } else {
          elemento.textContent = palavra;
        }
        resposta.appendChild(elemento);
        if (indice < todas.length - 1) resposta.appendChild(document.createTextNode(' '));
        return elemento;
      });

      frase.append(problema, resposta);
      return { problema, risco, letras, resposta, palavrasResposta };
    }

    /* Sem GSAP: mostra a resposta pronta */
    function mostrarResposta(area) {
      const partes = montar(area);
      partes.problema.style.visibility = 'hidden';
      partes.palavrasResposta.forEach((palavra) => { palavra.style.opacity = 1; });
    }

    function marcarChipAtual(chave) {
      chips.forEach((chip) => chip.classList.toggle('is-atual', chip.dataset.area === chave));
    }

    function pararLinhaDoTempo() {
      if (linhaDoTempo) linhaDoTempo.kill();
      linhaDoTempo = null;
    }

    function tocar(chave, { automatico }) {
      const area = AREAS[chave];
      pararLinhaDoTempo();
      marcarChipAtual(chave);
      if (automatico) acompanharCiclo(chave);

      if (!gsap) {
        mostrarResposta(area);
        return;
      }

      const partes = montar(area);
      const { letras, palavrasResposta } = partes;
      const tl = gsap.timeline({
        onComplete: () => { if (automatico) proximoDoCiclo(); },
      });
      linhaDoTempo = tl;

      /* Movimento reduzido: as frases trocam, sem digitação */
      if (movimentoReduzido) {
        letras.forEach((letra) => letra.classList.add('is-visivel'));
        tl.set(partes.problema, { autoAlpha: 0 }, 2.5)
          .set(palavrasResposta, { opacity: 1 }, 2.5)
          .to({}, { duration: 6 });
        return;
      }

      /* A balança pende para um lado enquanto o problema é apresentado */
      ladoBalanca *= -1;
      tl.to(inclinacao, {
        historia: ladoBalanca * 7,
        duration: 1.2,
        ease: 'power2.inOut',
        onUpdate: aplicarInclinacao,
      }, 0);

      /* 1. Digitação */
      const progresso = { n: 0 };
      let ultima = 0;
      tl.to(progresso, {
        n: letras.length,
        duration: letras.length * VELOCIDADE_LETRA,
        ease: 'none',
        onUpdate() {
          const atual = Math.floor(progresso.n);
          for (let i = ultima; i < atual; i += 1) letras[i].classList.add('is-visivel');
          if (atual !== ultima && atual > 0) {
            if (ultima > 0) letras[ultima - 1].classList.remove('is-cursor');
            letras[atual - 1].classList.add('is-cursor');
          }
          ultima = atual;
        },
      });

      /* 2. Risco dourado */
      tl.call(() => {
        letras.forEach((letra) => letra.classList.remove('is-cursor'));
      }, null, '+=0.4');
      tl.to(partes.risco, { '--risco': '100%', duration: 0.6, ease: 'power2.inOut' });

      /* 3. Saída do problema e entrada da resposta, palavra por palavra */
      tl.to(partes.problema, { opacity: 0, y: -10, duration: 0.3, ease: 'power2.in' }, '+=0.2');
      tl.fromTo(palavrasResposta,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.07 },
        '-=0.05');

      /* A resposta devolve o equilíbrio */
      tl.to(inclinacao, {
        historia: 0,
        duration: 1.6,
        ease: 'elastic.out(1, 0.55)',
        onUpdate: aplicarInclinacao,
      }, '<');

      /* 4. Pausa e saída */
      if (automatico) {
        tl.to(partes.resposta, { opacity: 0, duration: 0.35 }, `+=${PAUSA_RESPOSTA}`);
      } else {
        tl.timeScale(1.7); /* Quem clicou não quer esperar a digitação inteira */
      }
    }

    function proximoDoCiclo() {
      tocar(CICLO[indiceCiclo], { automatico: true });
      indiceCiclo = (indiceCiclo + 1) % CICLO.length;
    }

    function iniciarCiclo() {
      cicloAtivo = true;
      proximoDoCiclo();
      if (foraDeVista && linhaDoTempo) linhaDoTempo.pause();
    }

    function agendarRetomada() {
      clearTimeout(temporizadorRetomada);
      temporizadorRetomada = setTimeout(iniciarCiclo, ESPERA_RETOMADA);
    }

    /* Centraliza o chip na lista. Só tem efeito no mobile, onde a lista rola de lado. */
    function rolarChipParaVista(chip) {
      if (lista.scrollWidth <= lista.clientWidth) return;
      const caixaLista = lista.getBoundingClientRect();
      const caixaChip = chip.getBoundingClientRect();
      const alvo = lista.scrollLeft + (caixaChip.left - caixaLista.left) - (caixaLista.width - caixaChip.width) / 2;
      lista.scrollTo({ left: alvo, behavior: movimentoReduzido ? 'auto' : 'smooth' });
    }

    /* A lista anda junto com a marcação, para o chip atual nunca sair da tela.
       Se a pessoa acabou de mexer na lista, o ciclo não a tira do lugar. */
    function acompanharCiclo(chave) {
      if (Date.now() - ultimoToqueNaLista < ESPERA_RETOMADA) return;
      const chip = chips.find((item) => item.dataset.area === chave);
      if (chip) rolarChipParaVista(chip);
    }

    function selecionar(chip) {
      const chave = chip.dataset.area;
      const desmarcar = estado.area === chave;

      estado.area = desmarcar ? null : chave;
      chips.forEach((item) => {
        item.setAttribute('aria-pressed', String(item.dataset.area === estado.area));
      });
      atualizarLinksWhatsapp();

      cicloAtivo = false;
      clearTimeout(temporizadorRetomada);

      if (desmarcar) {
        agendarRetomada();
        return;
      }

      track('hero_chip_selecionado', { area: chave });
      anunciar(AREAS[chave]);
      rolarChipParaVista(chip);

      /* O ciclo volta a partir da área seguinte à escolhida */
      const posicao = CICLO.indexOf(chave);
      if (posicao >= 0) indiceCiclo = (posicao + 1) % CICLO.length;

      tocar(chave, { automatico: false });
      agendarRetomada();
    }

    chips.forEach((chip) => chip.addEventListener('click', () => selecionar(chip)));

    lista.addEventListener('pointerdown', () => { ultimoToqueNaLista = Date.now(); }, { passive: true });

    /* Qualquer interação com os chips adia a volta do ciclo */
    ['pointerdown', 'keydown', 'scroll'].forEach((tipo) => {
      lista.addEventListener(tipo, () => {
        if (!cicloAtivo && temporizadorRetomada) agendarRetomada();
      }, { passive: true });
    });

    if (!gsap) {
      frase.classList.add('is-pronta');
      return { comecar() {} };
    }

    /* Economiza processamento quando a hero não está visível */
    function atualizarVisibilidade() {
      if (!linhaDoTempo) return;
      if (foraDeVista || document.hidden) linhaDoTempo.pause();
      else linhaDoTempo.resume();
    }
    document.addEventListener('visibilitychange', atualizarVisibilidade);
    if ('IntersectionObserver' in window) {
      /* Pausa com metade da hero fora da tela: não disputa com as animações seguintes */
      new IntersectionObserver(([entrada]) => {
        foraDeVista = entrada.intersectionRatio < 0.5;
        atualizarVisibilidade();
      }, { threshold: [0, 0.5] }).observe($('#topo'));
    }

    return { comecar: iniciarCiclo };
  }

  /* ---------- Intro: assinatura ---------- */
  function iniciarIntro(aoTerminar) {
    const ativa = raiz.classList.contains('intro-on');
    clearTimeout(window.__travaIntro);

    function limpar() {
      raiz.classList.remove('intro-on');
      ['#intro', '#introAssinatura', '#introPular'].forEach((seletor) => {
        const elemento = $(seletor);
        if (elemento) elemento.remove();
      });
    }

    if (!ativa) {
      limpar();
      aoTerminar();
      return;
    }

    try { sessionStorage.setItem('ss-intro-vista', '1'); } catch (erro) { /* Modo privado */ }

    if (!gsap) {
      limpar();
      aoTerminar();
      return;
    }

    const painel = $('#intro');
    const assinatura = $('#introAssinatura');
    const tracos = $$('#mascaraPena path');
    const camadaOuro = $('#assinaturaOuro');
    const camadaBranca = $('#assinaturaBranca');
    const secundarios = $$('.logo__emblema, .logo__sub, .nav, .header__acoes');
    const entrada = $$('[data-entrada]');

    /* Tempo total: 0,95s de traço + 0,08s de respiro + 0,57s de voo = 1,6s */
    const TEMPO_TRACO = 0.95;
    const TEMPO_VOO = 0.57;

    /* Troca o centro por CSS por pixels absolutos, para o cálculo do voo ser direto */
    const inicio = assinatura.getBoundingClientRect();
    gsap.set(assinatura, { top: inicio.top, left: inicio.left, xPercent: 0, yPercent: 0, x: 0, y: 0, transform: 'none' });

    const comprimentos = tracos.map((traco) => traco.getTotalLength());
    const total = comprimentos.reduce((soma, valor) => soma + valor, 0);
    tracos.forEach((traco, i) => {
      /* Oculto até a sua vez: a ponta redonda do traço marcaria um ponto na tela */
      gsap.set(traco, { strokeDasharray: comprimentos[i], strokeDashoffset: comprimentos[i], visibility: 'hidden' });
    });

    gsap.set(secundarios, { opacity: 0 });

    let encerrada = false;
    function encerrar() {
      if (encerrada) return;
      encerrada = true;
      gsap.set(secundarios, { clearProps: 'opacity' });
      gsap.set(entrada, { clearProps: 'all' });
      limpar();
      aoTerminar();
    }

    const tl = gsap.timeline({ onComplete: encerrar });

    tracos.forEach((traco, i) => {
      tl.set(traco, { visibility: 'visible' });
      tl.to(traco, {
        strokeDashoffset: 0,
        duration: TEMPO_TRACO * (comprimentos[i] / total),
        ease: 'none',
      });
    });

    /* Tira a máscara: daqui em diante a assinatura é a escrita inteira */
    tl.call(() => camadaOuro.removeAttribute('mask'), null, '+=0.08');

    tl.addLabel('voo');
    tl.add(() => {
      const alvo = $('#logoEscrita').getBoundingClientRect();
      const origem = assinatura.getBoundingClientRect();
      gsap.to(assinatura, {
        x: alvo.left - origem.left,
        y: alvo.top - origem.top,
        scale: alvo.width / origem.width,
        duration: TEMPO_VOO,
        ease: 'power3.inOut',
      });
    }, 'voo');
    tl.to(camadaBranca, { opacity: 1, duration: TEMPO_VOO * 0.8, ease: 'power1.in' }, 'voo');

    /* O painel preto recua para cima: a hero abre de baixo para cima */
    tl.fromTo(painel,
      { clipPath: 'inset(0% 0% 0% 0%)' },
      { clipPath: 'inset(0% 0% 100% 0%)', duration: TEMPO_VOO, ease: 'power3.inOut' },
      'voo');
    tl.from(entrada, { y: 28, opacity: 0, duration: TEMPO_VOO, ease: 'power3.out', stagger: 0.035 }, 'voo');
    tl.to(secundarios, { opacity: 1, duration: 0.35 }, `voo+=${TEMPO_VOO - 0.3}`);

    function pular() {
      tl.kill();
      gsap.killTweensOf(assinatura);
      encerrar();
    }
    $('#introPular').addEventListener('click', pular);
    document.addEventListener('keydown', function aoTeclar(evento) {
      if (evento.key === 'Escape' && !encerrada) pular();
      if (encerrada) document.removeEventListener('keydown', aoTeclar);
    });
  }

  /* ---------- Links de mensagem fixa (cards e áreas) ---------- */
  function iniciarLinksFixos() {
    $$('[data-wa-msg]').forEach((link) => { link.href = whatsappLink(link.dataset.waMsg); });
  }

  /* ---------- Animações de entrada ao rolar ---------- */
  const animar = Boolean(gsap && window.ScrollTrigger && !movimentoReduzido);

  function iniciarRevelacoes() {
    if (!animar) return;
    const { ScrollTrigger } = window;

    const entrar = (lote) => gsap.fromTo(lote,
      { opacity: 0, y: 28 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08, clearProps: 'all' });

    ['[data-revelar]', '.area'].forEach((seletor) => {
      gsap.set(seletor, { opacity: 0 });
      ScrollTrigger.batch(seletor, { start: 'top 88%', once: true, onEnter: entrar });
    });
  }

  /* Contadores: só rodam uma vez e terminam no número escrito no HTML */
  function iniciarContadores() {
    if (!animar) return;
    $$('[data-contador]').forEach((elemento) => {
      const final = Number(elemento.dataset.contador);
      const valor = { n: 0 };
      elemento.textContent = '0';
      gsap.to(valor, {
        n: final,
        duration: 1.4,
        ease: 'power2.out',
        onUpdate: () => { elemento.textContent = String(Math.round(valor.n)); },
        scrollTrigger: { trigger: elemento, start: 'top 90%', once: true },
      });
    });
  }

  /* ---------- Prazos: setas que saem da frase até cada prazo ----------
     Toca sozinha uma vez, ao entrar na tela, e termina na pergunta com o botão.
     As setas são medidas a partir do layout real, então acompanham qualquer largura. */
  function iniciarPrazos() {
    if (!animar) return;
    const secao = $('#prazos');
    const svg = $('#prazosSetas');
    const frase = $('.prazos__frase');
    const lista = $('.prazos__lista');
    const prazos = $$('.prazo');
    const fecho = $('.prazos__fecho');
    const aviso = $('.prazos__aviso');
    const SVG = 'http://www.w3.org/2000/svg';
    const CINZA_APAGADO = '#6E7078';   /* Contraste suficiente para texto grande */
    const DURACAO_SETA = 1;
    const INTERVALO_SETAS = 0.4;
    const lateral = window.matchMedia('(min-width: 700px)');

    /* Separa a frase em palavras, preservando o destaque em <em> */
    const palavras = [];
    Array.from(frase.childNodes).forEach((no) => {
      const fragmento = document.createDocumentFragment();
      no.textContent.split(/(\s+)/).forEach((pedaco) => {
        if (!pedaco.trim()) {
          fragmento.append(pedaco);
          return;
        }
        const span = document.createElement('span');
        span.className = 'prazos__palavra';
        span.textContent = pedaco;
        palavras.push(span);
        fragmento.append(span);
      });
      if (no.nodeType === Node.TEXT_NODE) {
        no.replaceWith(fragmento);
      } else {
        no.textContent = '';
        no.append(fragmento);
      }
    });

    function novo(tag, atributos) {
      const elemento = document.createElementNS(SVG, tag);
      Object.keys(atributos).forEach((nome) => elemento.setAttribute(nome, atributos[nome]));
      svg.appendChild(elemento);
      return elemento;
    }

    const setas = prazos.map(() => ({
      linha: novo('path', {}),
      ponta: novo('path', { d: 'M-8 -5.5L0 0L-8 5.5', opacity: 0 }),
      pulso: novo('circle', { r: 2, opacity: 0 }),
      comprimento: 0,
      progresso: 0,
    }));
    const origem = novo('circle', { r: 4, class: 'prazos__ponto' });

    /* A linha e a ponta andam juntas: a ponta viaja pela curva, quadro a quadro */
    function aplicarSeta(seta) {
      const percorrido = seta.comprimento * seta.progresso;
      seta.linha.setAttribute('stroke-dashoffset', (seta.comprimento - percorrido).toFixed(2));
      if (seta.progresso <= 0) return;
      const ponto = seta.linha.getPointAtLength(percorrido);
      const antes = seta.linha.getPointAtLength(Math.max(0, percorrido - 3));
      const angulo = (Math.atan2(ponto.y - antes.y, ponto.x - antes.x) * 180) / Math.PI;
      seta.ponta.setAttribute('transform', `translate(${ponto.x.toFixed(2)} ${ponto.y.toFixed(2)}) rotate(${angulo.toFixed(2)})`);
      seta.ponta.setAttribute('opacity', 1);
    }

    /* Tablet e desktop: curvas da frase até cada prazo.
       Celular: um tronco na margem, com um ramo para cada prazo. */
    function desenharSetas() {
      const base = svg.getBoundingClientRect();
      const caixaFrase = frase.getBoundingClientRect();
      const inicio = lateral.matches
        ? { x: caixaFrase.right - base.left + 12, y: caixaFrase.top - base.top + caixaFrase.height / 2 }
        : { x: caixaFrase.left - base.left + 5, y: lista.getBoundingClientRect().top - base.top - 12 };

      origem.setAttribute('cx', inicio.x.toFixed(1));
      origem.setAttribute('cy', inicio.y.toFixed(1));

      prazos.forEach((prazo, indice) => {
        const numero = $('.prazo__numero', prazo).getBoundingClientRect();
        const fimX = prazo.getBoundingClientRect().left - base.left - 10;
        const fimY = numero.top - base.top + numero.height / 2;
        let caminho;
        if (lateral.matches) {
          const curva = (fimX - inicio.x) * 0.55;
          caminho = `M${inicio.x} ${inicio.y}C${inicio.x + curva} ${inicio.y} ${fimX - curva} ${fimY} ${fimX} ${fimY}`;
        } else {
          caminho = `M${inicio.x} ${inicio.y}V${fimY - 8}Q${inicio.x} ${fimY} ${inicio.x + 8} ${fimY}H${fimX}`;
        }
        const seta = setas[indice];
        seta.linha.setAttribute('d', caminho);
        seta.comprimento = seta.linha.getTotalLength();
        seta.linha.setAttribute('stroke-dasharray', `${seta.comprimento} ${seta.comprimento}`);
        seta.pulso.setAttribute('cx', fimX);
        seta.pulso.setAttribute('cy', fimY);
        aplicarSeta(seta);
      });
    }

    secao.classList.add('prazos--cena');
    desenharSetas();

    gsap.set(palavras, { color: CINZA_APAGADO });
    gsap.set(prazos, { opacity: 0 });
    gsap.set(aviso, { opacity: 0 });
    gsap.set(fecho, { autoAlpha: 0 });
    gsap.set(origem, { opacity: 0, scale: 0, transformOrigin: '50% 50%' });

    const tl = gsap.timeline({
      onStart: desenharSetas,   /* As fontes já chegaram: mede de novo */
      scrollTrigger: { trigger: secao, start: 'top 45%', once: true },
    });

    /* 1. A frase acende palavra por palavra */
    palavras.forEach((palavra, indice) => {
      tl.to(palavra, {
        color: palavra.closest('em') ? '#E4C98E' : '#EDEDEF',
        duration: 0.25,
        ease: 'none',
      }, indice * 0.08);
    });
    tl.to(origem, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(3)' }, '-=0.1');

    /* 2. Cada seta corre em movimento contínuo e entrega um prazo, que fica na tela */
    const inicioSetas = tl.duration() - 0.1;
    prazos.forEach((prazo, indice) => {
      const seta = setas[indice];
      /* Horários fixos: o ritmo não depende de o pulso anterior ter terminado */
      const partida = inicioSetas + indice * (DURACAO_SETA + INTERVALO_SETAS);
      tl.to(seta, {
        progresso: 1,
        duration: DURACAO_SETA,
        ease: 'sine.inOut',
        onUpdate: () => aplicarSeta(seta),
      }, partida);
      /* O prazo começa a surgir antes da seta chegar, sem parada entre os dois */
      tl.addLabel(`chegada${indice}`, partida + DURACAO_SETA * 0.78);
      tl.fromTo(prazo,
        { opacity: 0, x: -18 },
        { opacity: 1, x: 0, duration: 0.6, ease: 'power2.out', immediateRender: false },
        `chegada${indice}`);
      tl.fromTo(seta.pulso,
        { attr: { r: 2 }, opacity: 0.9 },
        { attr: { r: 20 }, opacity: 0, duration: 0.6, ease: 'power2.out', immediateRender: false },
        `chegada${indice}+=0.18`);
    });

    /* 3. A frase de origem vira a pergunta com o botão */
    tl.to(frase, { autoAlpha: 0, y: -12, duration: 0.35, ease: 'power1.inOut' }, '+=0.5');
    tl.fromTo(fecho,
      { autoAlpha: 0, y: 14 },
      { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out', immediateRender: false },
      '-=0.12');
    tl.to(aviso, { opacity: 1, duration: 0.4 }, '<');

    let espera;
    window.addEventListener('resize', () => {
      clearTimeout(espera);
      espera = setTimeout(desenharSetas, 120);
    }, { passive: true });
  }

  /* ---------- Áreas: abas, acordeão e ícones ---------- */
  function desenharIcones(painel) {
    if (!animar) return;
    const tracos = $$('.area__icone path', painel);
    gsap.fromTo(tracos,
      { strokeDasharray: 1, strokeDashoffset: 1 },
      {
        strokeDashoffset: 0,
        duration: 1.1,
        ease: 'power2.inOut',
        stagger: 0.03,
        clearProps: 'strokeDasharray,strokeDashoffset',
      });
  }

  function iniciarAreas() {
    const abas = $$('.aba');

    function ativar(aba, levarFoco) {
      const painelNovo = $(`#${aba.getAttribute('aria-controls')}`);
      if (!painelNovo.hidden) return;

      abas.forEach((item) => {
        const ativa = item === aba;
        item.setAttribute('aria-selected', String(ativa));
        item.tabIndex = ativa ? 0 : -1;
        $(`#${item.getAttribute('aria-controls')}`).hidden = !ativa;
      });
      if (levarFoco) aba.focus();

      if (animar) {
        gsap.fromTo(painelNovo, { autoAlpha: 0, x: 28 }, { autoAlpha: 1, x: 0, duration: 0.5, ease: 'power3.out', clearProps: 'all' });
        gsap.set($$('.area', painelNovo), { clearProps: 'all' });
        desenharIcones(painelNovo);
        window.ScrollTrigger.refresh();
      }
    }

    abas.forEach((aba, indice) => {
      aba.addEventListener('click', () => ativar(aba, false));
      aba.addEventListener('keydown', (evento) => {
        if (evento.key !== 'ArrowRight' && evento.key !== 'ArrowLeft') return;
        evento.preventDefault();
        const passo = evento.key === 'ArrowRight' ? 1 : -1;
        ativar(abas[(indice + passo + abas.length) % abas.length], true);
      });
    });

    /* Acordeão: uma área aberta por vez dentro de cada aba */
    $$('.area__botao').forEach((botao) => {
      botao.addEventListener('click', () => {
        const card = botao.closest('.area');
        const abrir = !card.classList.contains('is-aberta');
        $$('.area.is-aberta', card.parentElement).forEach((outra) => {
          outra.classList.remove('is-aberta');
          $('.area__botao', outra).setAttribute('aria-expanded', 'false');
        });
        card.classList.toggle('is-aberta', abrir);
        botao.setAttribute('aria-expanded', String(abrir));
      });
    });

    if (animar) {
      const primeiro = $('#painelVoce');
      gsap.set($$('.area__icone path', primeiro), { strokeDasharray: 1, strokeDashoffset: 1 });
      window.ScrollTrigger.create({
        trigger: primeiro,
        start: 'top 80%',
        once: true,
        onEnter: () => desenharIcones(primeiro),
      });
    }
  }

  /* ---------- Diferenciais ---------- */
  function iniciarDiferenciais() {
    if (!animar) return;
    const grade = $('.diferenciais');
    const linha = $('.diferenciais__linha');
    const largo = window.innerWidth >= 1024;

    grade.classList.add('diferenciais--anima');

    /* Desktop: a linha contínua acompanha o scroll */
    gsap.matchMedia().add('(min-width: 1024px)', () => {
      gsap.fromTo(linha, { scaleX: 0 }, {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: { trigger: grade, start: 'top 78%', end: 'top 30%', scrub: 0.5 },
      });
    });

    /* Cada item acende com a sua linha */
    $$('.diferencial').forEach((item, indice) => {
      gsap.fromTo(item, { opacity: 0, y: 18 }, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        delay: (largo ? indice : indice % 2) * 0.14,
        ease: 'power3.out',
        onStart: () => item.classList.add('is-aceso'),
        scrollTrigger: { trigger: item, start: 'top 84%', once: true },
      });
    });
  }

  /* ---------- Equipe: carrossel de cartões ----------
     A rolagem é nativa, com encaixe por CSS. Aqui ficam só os controles. */
  function iniciarEquipe() {
    const lista = $('#equipe');
    const cartoes = $$('.pessoa', lista);
    const controles = $('#equipeControles');
    const anterior = $('#equipeAnterior');
    const proxima = $('#equipeProxima');
    const areaPontos = $('#equipePontos');
    let atual = 0;

    const pontos = cartoes.map((cartao, indice) => {
      const ponto = document.createElement('button');
      ponto.type = 'button';
      ponto.className = 'carrossel__ponto';
      ponto.setAttribute('aria-label', `Ver ${$('.pessoa__nome', cartao).textContent}`);
      ponto.addEventListener('click', () => irPara(indice));
      areaPontos.appendChild(ponto);
      return ponto;
    });

    function deslocamento(indice) {
      const margem = parseFloat(getComputedStyle(lista).paddingLeft);
      const cartao = cartoes[indice].getBoundingClientRect();
      return lista.scrollLeft + cartao.left - lista.getBoundingClientRect().left - margem;
    }

    function irPara(indice) {
      const alvo = Math.max(0, Math.min(cartoes.length - 1, indice));
      lista.scrollTo({ left: deslocamento(alvo), behavior: movimentoReduzido ? 'auto' : 'smooth' });
    }

    function atualizar() {
      const limite = lista.scrollWidth - lista.clientWidth;
      const rola = limite > 2;
      controles.hidden = !rola;

      /* No fim da lista o último cartão pode não encostar na margem: o fim manda */
      if (lista.scrollLeft >= limite - 2) {
        atual = cartoes.length - 1;
      } else {
        let menor = Infinity;
        cartoes.forEach((_, indice) => {
          const distancia = Math.abs(deslocamento(indice) - lista.scrollLeft);
          if (distancia < menor) {
            menor = distancia;
            atual = indice;
          }
        });
      }

      cartoes.forEach((cartao, indice) => cartao.classList.toggle('is-ativa', rola && indice === atual));
      pontos.forEach((ponto, indice) => ponto.setAttribute('aria-current', String(indice === atual)));
      anterior.disabled = lista.scrollLeft <= 2;
      proxima.disabled = lista.scrollLeft >= limite - 2;
    }

    anterior.addEventListener('click', () => irPara(atual - 1));
    proxima.addEventListener('click', () => irPara(atual + 1));

    let quadro = 0;
    const agendarAtualizacao = () => {
      cancelAnimationFrame(quadro);
      quadro = requestAnimationFrame(atualizar);
    };
    lista.addEventListener('scroll', agendarAtualizacao, { passive: true });
    window.addEventListener('resize', agendarAtualizacao, { passive: true });
    atualizar();
  }

  /* ---------- Formulário em etapas ---------- */
  function iniciarFormulario() {
    const form = $('#formCaso');
    const etapas = $$('.etapa', form);
    const erro = $('#formErro');
    const barra = $('#formBarra');
    const trilho = $('.form__trilho');
    const contagem = $('#formContagem');
    const voltar = $('#formVoltar');
    const avancar = $('#formAvancar');
    const descricao = $('#formDescricao');
    const contador = $('#formContador');
    const nome = $('#formNome');
    const telefone = $('#formTelefone');
    const consentimento = $('#formConsentimento');
    const sucesso = $('#formSucesso');
    const linkFinal = $('#formLinkFinal');

    const MINIMO_DESCRICAO = 10;
    let atual = 1;
    let etapaUmRegistrada = false;

    const areaEscolhida = () => {
      const marcada = $('input[name="area"]:checked', form);
      return marcada ? marcada.value : '';
    };

    function mostrarErro(mensagem, campo) {
      erro.textContent = mensagem;
      if (campo) {
        campo.setAttribute('aria-invalid', 'true');
        campo.focus();
      }
    }

    function limparErro() {
      erro.textContent = '';
      $$('[aria-invalid]', form).forEach((campo) => campo.removeAttribute('aria-invalid'));
    }

    /* Mensagens de validação: dizem o que fazer, sem culpar a pessoa */
    function validar() {
      limparErro();
      if (atual === 1 && !areaEscolhida()) {
        mostrarErro('Escolha uma opção. Se não tiver certeza, marque “Não sei / Outro”.');
        return false;
      }
      if (atual === 2 && descricao.value.trim().length < MINIMO_DESCRICAO) {
        mostrarErro('Conte um pouco mais, em uma frase curta, para entendermos o seu caso.', descricao);
        return false;
      }
      if (atual === 3) {
        if (nome.value.trim().length < 2) {
          mostrarErro('Informe seu nome para sabermos como chamar você.', nome);
          return false;
        }
        const digitos = telefone.value.replace(/\D/g, '').length;
        if (digitos < 10) {
          mostrarErro('Confira o número: ele precisa ter DDD e telefone.', telefone);
          return false;
        }
        if (!consentimento.checked) {
          mostrarErro('Para continuar, marque a autorização de contato.', consentimento);
          return false;
        }
      }
      return true;
    }

    function irPara(numero) {
      const direcao = numero > atual ? 1 : -1;
      const nova = etapas[numero - 1];
      atual = numero;

      etapas.forEach((etapa) => { etapa.hidden = etapa !== nova; });
      voltar.hidden = numero === 1;
      avancar.textContent = numero === 3 ? 'Continuar no WhatsApp' : 'Continuar';
      contagem.textContent = `Etapa ${numero} de 3`;
      trilho.setAttribute('aria-valuenow', String(numero));
      barra.style.width = `${(numero / 3) * 100}%`;
      limparErro();

      if (gsap && !movimentoReduzido) {
        gsap.fromTo(nova, { x: direcao * 48, opacity: 0 }, { x: 0, opacity: 1, duration: 0.45, ease: 'power3.out', clearProps: 'all' });
      }
      $('.etapa__titulo', nova).focus({ preventScroll: true });
      track('form_etapa', { etapa: numero });
    }

    function montarMensagem() {
      return [
        'Olá, Sales & Sales! Vim pelo site e gostaria de falar com um advogado.',
        '',
        `*Área:* ${areaEscolhida()}`,
        `*Situação:* ${descricao.value.trim()}`,
        `*Nome:* ${nome.value.trim()}`,
        `*WhatsApp:* ${telefone.value}`,
      ].join('\n');
    }

    /* Máscara: (11) 9 1234-5678 ou (11) 1234-5678 */
    function formatarTelefone(valor) {
      const d = valor.replace(/\D/g, '').slice(0, 11);
      if (d.length <= 2) return d.length ? `(${d}` : '';
      const ddd = `(${d.slice(0, 2)}) `;
      if (d.length <= 6) return ddd + d.slice(2);
      if (d.length <= 10) return `${ddd}${d.slice(2, 6)}-${d.slice(6)}`;
      return `${ddd}${d[2]} ${d.slice(3, 7)}-${d.slice(7)}`;
    }

    telefone.addEventListener('input', () => { telefone.value = formatarTelefone(telefone.value); });
    descricao.addEventListener('input', () => { contador.textContent = String(descricao.value.length); });

    /* Clique de mouse ou toque já avança; pelo teclado, a pessoa confirma em Continuar */
    form.addEventListener('click', (evento) => {
      const opcao = evento.target.closest('input[name="area"]');
      if (!opcao) return;
      form.dataset.tocado = 'sim';
      if (!etapaUmRegistrada) {
        etapaUmRegistrada = true;
        track('form_etapa', { etapa: 1 });
      }
      if (evento.detail > 0) irPara(2);
    });

    voltar.addEventListener('click', () => irPara(atual - 1));

    form.addEventListener('submit', (evento) => {
      evento.preventDefault();
      if (!validar()) return;
      if (atual < 3) {
        irPara(atual + 1);
        return;
      }

      linkFinal.href = whatsappLink(montarMensagem());
      linkFinal.dataset.waArea = areaEscolhida();
      /* Só a área vai para o rastreamento; nome, telefone e relato não saem daqui */
      track('form_enviado', { area: areaEscolhida() });
      form.hidden = true;
      sucesso.hidden = false;
      sucesso.focus({ preventScroll: true });
      linkFinal.click();
    });
  }

  /* A escolha feita na hero já chega marcada no formulário */
  function sincronizarFormulario() {
    const form = $('#formCaso');
    if (!form || form.dataset.tocado === 'sim') return;
    $$('input[name="area"]', form).forEach((opcao) => {
      opcao.checked = Boolean(estado.area) && opcao.dataset.chip === estado.area;
    });
  }

  /* ---------- Botão flutuante ---------- */
  function iniciarFlutuante() {
    const botao = $('#flutuante');
    if (!('IntersectionObserver' in window)) {
      botao.classList.add('is-visivel');
      return;
    }
    new IntersectionObserver(([entrada]) => {
      botao.classList.toggle('is-visivel', !entrada.isIntersecting);
    }).observe($('#topo'));

    /* Sai de cena nas áreas que já têm botão próprio, para não cobrir conteúdo */
    const areasComBotao = new Set();
    const observador = new IntersectionObserver((entradas) => {
      entradas.forEach((entrada) => {
        if (entrada.isIntersecting) areasComBotao.add(entrada.target);
        else areasComBotao.delete(entrada.target);
      });
      botao.classList.toggle('is-recolhido', areasComBotao.size > 0);
    }, { rootMargin: '-15% 0px' });
    observador.observe($('.form-caixa'));
    observador.observe($('#prazos'));
  }

  /* ---------- Inicialização ---------- */
  atualizarLinksWhatsapp();
  iniciarLinksFixos();
  iniciarHeader();
  iniciarMenu();
  desenharFundo();

  const titulo = iniciarTitulo();
  iniciarParallax();

  /* A composição do fundo muda entre celular, tablet e desktop */
  ['(min-width: 640px)', '(min-width: 1024px)'].forEach((consulta) => {
    window.matchMedia(consulta).addEventListener('change', () => {
      limparParallax();
      desenharFundo();
      iniciarParallax();
    });
  });

  iniciarIntro(() => {
    $('#heroFrase').setAttribute('aria-hidden', 'true');
    animarEntradaFundo();
    titulo.comecar();
  });

  iniciarEquipe();
  iniciarFormulario();
  iniciarFlutuante();

  /* O que fica abaixo da dobra é preparado aos poucos, sem disputar com a abertura */
  const agendar = window.requestIdleCallback
    ? (tarefa) => window.requestIdleCallback(tarefa, { timeout: 800 })
    : (tarefa) => setTimeout(tarefa, 80);
  const fila = [iniciarPrazos, iniciarAreas, iniciarRevelacoes, iniciarContadores, iniciarDiferenciais];
  (function proxima() {
    const tarefa = fila.shift();
    if (!tarefa) return;
    agendar(() => {
      tarefa();
      proxima();
    });
  })();

  const ano = $('#anoAtual');
  if (ano) ano.textContent = String(new Date().getFullYear());
})();
