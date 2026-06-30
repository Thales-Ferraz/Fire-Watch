// Função auxiliar para exibir/esconder o box informativo
function toggleInfo() {
  const box = document.getElementById('infoBox');
  if (box) {
    box.style.display = box.style.display === 'none' ? 'block' : 'none';
  }
}

// 1. Abre a tela inicial com a lista de categorias do catálogo
async function abrirCatalogo() {
  const mainContent = document.querySelector(".content");
  if (!mainContent) return;

  try {
    const resposta = await fetch("catalogo.html");
    if (!resposta.ok) throw new Error("Erro ao carregar catálogo.");
    
    const html = await resposta.text();
    mainContent.innerHTML = html;
  } catch (erro) {
    console.error(erro);
    mainContent.innerHTML = `<p style="color: #ff3b3b; text-align: center; padding: 20px;">⚠️ Erro ao carregar o catálogo.</p>`;
  }
}

// 2. Renderiza o artigo selecionado na tela principal (Estilo Wikipédia)
function abrirArtigoWiki(categoria) {
  const mainContent = document.querySelector(".content");
  if (!mainContent) return;

  const artigo = artigos[categoria];

  if (!artigo) {
    mainContent.innerHTML = `<p style="color: #ff3b3b; padding: 20px;">Artigo não encontrado. <a href="#" onclick="abrirCatalogo()">Voltar</a></p>`;
    return;
  }

  // Gera o sumário lateral do artigo
  const linksSumario = artigo.secoes.map((secao, i) => `
    <li style="margin-bottom: 10px;">
      <a href="#${secao.id}" style="color: #ff5c1a; text-decoration: none; font-size: 14px;">${i + 1}. ${secao.titulo}</a>
    </li>
  `).join("");

  // Gera os blocos de conteúdo textual
  const blocosConteudo = artigo.secoes.map(secao => `
    <div id="${secao.id}" style="margin-bottom: 32px; background: #161819; border: 1px solid #2a2d30; padding: 20px; border-radius: 8px;">
      <h3 style="color: #fff; font-size: 18px; margin-top: 0; margin-bottom: 12px; border-bottom: 1px solid #2a2d30; padding-bottom: 8px;">${secao.titulo}</h3>
      <div style="color: #d2d0d0; font-size: 14px; line-height: 1.6;">${secao.conteudo}</div>
    </div>
  `).join("");

  // Injeta o layout de duas colunas (Sumário esquerdo | Conteúdo direito)
  mainContent.innerHTML = `
    <div style="padding: 16px;">
      <div style="margin-bottom: 20px;">
        <button onclick="abrirCatalogo()" style="background: transparent; border: 1px solid #2a2d30; color: #c4c8cd; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 13px;">
          ← Voltar ao Catálogo
        </button>
        <h1 style="color: #fff; font-size: 24px; margin: 12px 0 0 0;">${artigo.titulo}</h1>
      </div>

      <div style="display: flex; gap: 20px; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 200px; max-width: 280px; background: #161819; border: 1px solid #2a2d30; padding: 16px; border-radius: 8px; height: fit-content;">
          <div style="font-weight: 700; color: #fff; margin-bottom: 12px; border-bottom: 1px solid #2a2d30; padding-bottom: 6px;">Sumário</div>
          <ul style="list-style: none; padding: 0; margin: 0;">${linksSumario}</ul>
        </div>

        <div style="flex: 2; min-width: 300px;">
          ${blocosConteudo}
        </div>
      </div>
    </div>
  `;
}
const artigos = {
  animais: {
titulo: "Queimadas e Impacto na Fauna",
    secoes: [
      {
        id: "impacto",
        titulo: "Como as Queimadas Afetam os Animais",
        conteudo:
          "<p>As queimadas destroem habitats naturais e forçam animais silvestres a abandonar seu território em busca de refúgio. Répteis, pequenos mamíferos e insetos estão entre os mais vulneráveis, pois sua locomoção lenta impede que escapem do avanço rápido das chamas. Aves conseguem fugir com mais facilidade, mas perdem ninhos e fontes de alimento.</p><p>Mesmo os animais que sobrevivem ao incêndio enfrentam sérias dificuldades: falta de comida, ausência de abrigo e desorientação. Muitos acabam invadindo rodovias e áreas urbanas, o que aumenta o risco de atropelamentos e conflitos com humanos.</p><p>O impacto vai além da fauna local. A destruição de polinizadores, como abelhas e borboletas, compromete a recuperação da vegetação nas áreas atingidas, criando um ciclo difícil de reverter.</p>"
      },
      {
        id: "procedimentos",
        titulo: "O Que Fazer ao Encontrar um Animal Ferido",
        conteudo:
          "<ul><li>Não toque no animal com as mãos desprotegidas. Animais silvestres feridos podem morder, arranhar ou transmitir doenças.</li><li>Mantenha distância e observe se o animal apresenta risco imediato de ser atropelado ou de piorar sua situação.</li><li>Ligue imediatamente para o IBAMA ou para o Corpo de Bombeiros (193) e informe a localização exata.</li><li>Não tente alimentar o animal com comida caseira nem oferecer água de forma forçada.</li><li>Se for absolutamente necessário conter o animal para protegê-lo do trânsito, utilize uma caixa de papelão ou pano grosso, sem forçar contato direto.</li><li>Aguarde equipe especializada. Intervenções sem treinamento podem estressar o animal e agravar seus ferimentos.</li></ul>"
      },
      {
        id: "prevencao",
        titulo: "Prevenção e Papel da Comunidade",
        conteudo:
          "<p>Nunca atear fogo em vegetação, mesmo em terrenos próprios e em épocas de seca. A Lei de Crimes Ambientais (Lei 9.605/98) prevê penas de 2 a 4 anos de reclusão para quem provoca incêndio em mata ou floresta.</p><p>Denuncie qualquer foco de incêndio assim que perceber fumaça ou chamas. Quanto mais cedo o Corpo de Bombeiros for acionado, menor a área destruída e o número de animais afetados.</p><p>Evite jogar bitucas de cigarro em beiras de estrada, campos secos ou áreas de vegetação. Em períodos de estiagem, uma faísca é suficiente para iniciar um incêndio de grandes proporções.</p>"
      },
      {
        id: "contatos-animais",
        titulo: "Contatos de Emergência",
        conteudo:
          "<ul><li><strong>IBAMA – Denúncias Ambientais:</strong> 0800-618-080 (gratuito)</li><li><strong>Corpo de Bombeiros:</strong> 193</li><li><strong>Polícia Ambiental / Militar:</strong> 190 (solicite redirecionamento)</li><li><strong>CETAS (Centro de Triagem de Animais Silvestres):</strong> Localize o mais próximo em ibama.gov.br</li><li><strong>Defesa Civil:</strong> 199</li></ul>"
      }
    ]
  },

  rodovias: {
    titulo: "Queimadas e Segurança nas Rodovias",
    secoes: [
      {
        id: "risco",
        titulo: "Por Que a Fumaça é Perigosa no Trânsito",
        conteudo:
          "<p>A fumaça gerada por queimadas próximas a rodovias pode reduzir a visibilidade a menos de 50 metros em questão de minutos. Nessas condições, mesmo motoristas experientes têm dificuldade de perceber veículos parados, curvas à frente ou animais na pista.</p><p>A Polícia Rodoviária Federal (PRF) registra aumento significativo de colisões traseiras e engavetamentos durante os meses de estiagem, especialmente nas rodovias do Centro-Oeste, Norte e Nordeste do Brasil, regiões mais afetadas pelas queimadas.</p><p>Além da visibilidade reduzida, a fumaça irrita os olhos e provoca tosse repentina, o que pode fazer com que o motorista perca brevemente o controle do veículo.</p>"
      },
      {
        id: "conduta",
        titulo: "Como Agir ao Encontrar Fumaça na Pista",
        conteudo:
          "<ul><li>Reduza a velocidade imediatamente ao avistar fumaça à frente.</li><li>Acenda os faróis baixos. Não use farol alto: a luz reflete nas partículas de fumaça e piora ainda mais a visibilidade.</li><li>Aumente a distância de segurança do veículo à frente para pelo menos o dobro do normal.</li><li>Não ultrapasse outros veículos em condições de fumaça intensa.</li><li>Se a situação piorar, procure a próxima praça de pedágio, posto de gasolina ou área de descanso sinalizada para parar em segurança.</li><li>Se for inevitável parar no acostamento, acione o pisca-alerta, coloque o triângulo de segurança e saia do veículo afastando-se da faixa de rolamento.</li></ul>"
      },
      {
        id: "denuncia-rodovias",
        titulo: "Como Denunciar Focos de Incêndio em Rodovias",
        conteudo:
          "<p>Ao perceber chamas ou fumaça densa próximas a uma rodovia federal, ligue imediatamente para a PRF pelo número 191. Informe o nome da rodovia, o km aproximado e a direção do fogo.</p><p>A PRF pode acionar o bloqueio da via, solicitar o Corpo de Bombeiros e providenciar sinalização de emergência para alertar os demais motoristas. Agir rapidamente pode evitar acidentes graves e salvar vidas.</p><p>Não tente registrar vídeos ou fotos enquanto dirige. Pare em local seguro antes de qualquer registro ou ligação.</p>"
      },
      {
        id: "contatos-rodovias",
        titulo: "Contatos de Emergência nas Rodovias",
        conteudo:
          "<ul><li><strong>Polícia Rodoviária Federal (PRF):</strong> 191</li><li><strong>SAMU:</strong> 192</li><li><strong>Corpo de Bombeiros:</strong> 193</li><li><strong>Defesa Civil:</strong> 199</li><li><strong>Polícia Militar:</strong> 190</li></ul>"
      }
    ]
  },

  saude: {
    titulo: "Efeitos das Queimadas na Saúde",
    secoes: [
      {
        id: "efeitos",
        titulo: "O Que a Fumaça Faz ao Organismo",
        conteudo:
          "<p>A fumaça das queimadas é uma mistura complexa de gases e partículas. O componente mais preocupante é o material particulado fino, chamado MP2,5, cujas partículas são tão pequenas que penetram profundamente nos pulmões e podem até chegar à corrente sanguínea.</p><p>A exposição, mesmo que breve, pode causar irritação nos olhos, nariz e garganta, crises de tosse seca, falta de ar e piora de quadros respiratórios preexistentes. Em exposições prolongadas, aumenta o risco de infecções respiratórias, agravamento de asma e de doenças pulmonares obstrutivas crônicas (DPOC), além de eventos cardiovasculares como infartos e AVC.</p><p>De acordo com a Fundação Oswaldo Cruz (FIOCRUZ), períodos intensos de queimadas estão diretamente associados ao aumento de internações hospitalares por problemas respiratórios, especialmente em crianças e idosos.</p>"
      },
      {
        id: "grupos-risco",
        titulo: "Grupos de Maior Risco",
        conteudo:
          "<p>Embora qualquer pessoa possa ser afetada pela fumaça, alguns grupos devem ter atenção redobrada:</p><ul><li><strong>Crianças menores de 5 anos:</strong> o sistema respiratório ainda está em desenvolvimento, tornando-as mais vulneráveis.</li><li><strong>Idosos acima de 60 anos:</strong> maior probabilidade de complicações cardiovasculares e respiratórias.</li><li><strong>Gestantes:</strong> a exposição ao MP2,5 pode interferir no desenvolvimento do feto e aumentar o risco de parto prematuro.</li><li><strong>Pessoas com asma, DPOC ou doenças cardíacas:</strong> a fumaça pode desencadear crises agudas.</li><li><strong>Trabalhadores ao ar livre:</strong> agricultores, garis e outros profissionais expostos por muitas horas seguidas.</li></ul>"
      },
      {
        id: "protecao",
        titulo: "Como se Proteger em Dias de Fumaça Intensa",
        conteudo:
          "<ul><li>Fique em ambientes fechados com janelas e portas fechadas sempre que possível.</li><li>Se tiver ar-condicionado, use no modo de recirculação interna para não puxar o ar de fora.</li><li>Utilize máscara de proteção respiratória PFF2 ou N95 ao sair de casa. Máscaras cirúrgicas comuns não filtram as partículas finas da fumaça.</li><li>Beba bastante água ao longo do dia para manter as mucosas hidratadas.</li><li>Evite atividades físicas ao ar livre, pois a respiração acelerada aumenta a quantidade de partículas inaladas.</li><li>Pessoas com doenças respiratórias devem manter a medicação em dia e consultar seu médico ao notar piora dos sintomas.</li><li>Acompanhe os índices de qualidade do ar pelo aplicativo Qualidade do Ar Brasil ou por sites estaduais de monitoramento ambiental.</li></ul>"
      },
      {
        id: "emergencia-saude",
        titulo: "Sinais de Emergência e Quando Buscar Atendimento",
        conteudo:
          "<p>Procure atendimento médico imediatamente se você ou alguém próximo apresentar:</p><ul><li>Dificuldade respiratória intensa ou sensação de sufocamento.</li><li>Dor ou pressão no peito.</li><li>Coloração azulada nos lábios ou nas pontas dos dedos (cianose).</li><li>Confusão mental, tontura intensa ou perda de consciência.</li><li>Chiado no peito persistente que não cede com o uso de broncodilatador.</li></ul><p>Não espere os sintomas piorarem. Em caso de dúvida, acione o SAMU.</p><ul><li><strong>SAMU:</strong> 192</li><li><strong>Corpo de Bombeiros:</strong> 193</li><li><strong>Defesa Civil:</strong> 199</li><li><strong>UPA / UBS mais próxima:</strong> consulte o site da prefeitura do seu município</li></ul>"
      }
    ]
  }
}