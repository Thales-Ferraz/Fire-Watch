// Dashboard: busca as denúncias UMA vez e preenche cards, alerta, mapa,
// gráfico e ocorrências recentes a partir desses mesmos dados.

const SIGLAS_ESTADOS = {
  "Minas Gerais": "MG", "São Paulo": "SP", "Rio de Janeiro": "RJ",
  "Bahia": "BA", "Paraná": "PR", "Rio Grande do Sul": "RS",
  "Goiás": "GO", "Pará": "PA", "Mato Grosso": "MT",
  "Mato Grosso do Sul": "MS", "Ceará": "CE", "Pernambuco": "PE",
  "Maranhão": "MA", "Amazonas": "AM", "Santa Catarina": "SC",
  "Espírito Santo": "ES", "Tocantins": "TO", "Rondônia": "RO",
  "Acre": "AC", "Roraima": "RR", "Amapá": "AP", "Piauí": "PI",
  "Rio Grande do Norte": "RN", "Paraíba": "PB", "Alagoas": "AL",
  "Sergipe": "SE", "Distrito Federal": "DF",
};

// Nomes mais longos primeiro, para "Mato Grosso do Sul" não ser contado como "Mato Grosso".
const NOMES_ESTADOS = Object.keys(SIGLAS_ESTADOS).sort((a, b) => b.length - a.length);

function siglaDoEstado(local) {
  const nome = NOMES_ESTADOS.find((n) => String(local || "").includes(n));
  return nome ? SIGLAS_ESTADOS[nome] : "Outros";
}

let dashboardHtml = null;   // dashboard.html fica em cache depois da 1ª vez
let dashboardGeracao = 0;   // evita desenhar um dashboard antigo se o usuário trocou de tela
let graficoAtual = null;

async function abrirDashboard() {
  const mainContent = document.querySelector(".content");
  if (!mainContent) return;
  const geracao = ++dashboardGeracao;

  try {
    if (!dashboardHtml) {
      const resposta = await fetch("dashboard.html");
      if (!resposta.ok) throw new Error("Erro ao carregar o dashboard.");
      dashboardHtml = await resposta.text();
    }
    if (geracao !== dashboardGeracao) return;
    mainContent.innerHTML = dashboardHtml;
  } catch (erro) {
    console.error(erro);
    mainContent.innerHTML = `<p class="estado-erro">Erro ao carregar o Dashboard.</p>`;
    return;
  }

  await atualizarDashboard(geracao);
}

// Busca os dados de novo e redesenha o dashboard (se ele estiver na tela).
async function atualizarDashboard(geracao = dashboardGeracao) {
  if (!document.getElementById("dashStats")) return;

  let denuncias;
  try {
    denuncias = await apiFetch("/denuncias");
  } catch (erro) {
    console.error(erro);
    if (geracao !== dashboardGeracao) return;
    mostrarAlertaDashboard(`<strong>Não foi possível carregar os dados:</strong> ${escapeHTML(erro.message)}`);
    return;
  }

  // O usuário pode ter trocado de tela enquanto os dados chegavam.
  if (geracao !== dashboardGeracao || !document.getElementById("dashStats")) return;

  denuncias = denuncias.map((d) => ({ ...d, status: normalizarStatus(d.status) }));

  preencherCards(denuncias);
  preencherAlerta(denuncias);
  preencherRecentes(denuncias);
  renderMapa(denuncias.filter(isAtiva));
  renderGraficoPorEstado(denuncias);
}

function mostrarAlertaDashboard(html) {
  const box = document.getElementById("dashAlerta");
  if (!box) return;
  document.getElementById("dashAlertaTexto").innerHTML = html;
  box.hidden = false;
}

function preencherCards(denuncias) {
  const hoje = hojeLocal();

  const valores = {
    emVerificacao: denuncias.filter((d) => d.status === STATUS.EM_VERIFICACAO).length,
    pendentes: denuncias.filter((d) => d.status === STATUS.PENDENTE).length,
    focosHoje: denuncias.filter((d) => d.data === hoje && d.status !== STATUS.ALARME_FALSO).length,
    // Usa a data em que o órgão marcou como resolvida, não a data do foco.
    resolvidasHoje: denuncias.filter(
      (d) => d.status === STATUS.RESOLVIDA && d.statusAtualizadoEm && hojeLocal(new Date(d.statusAtualizadoEm)) === hoje
    ).length,
  };

  const notas = {
    emVerificacao: (n) => (n === 0 ? "nenhuma no momento" : "em andamento"),
    pendentes: (n) => (n === 0 ? "nenhuma pendente" : "aguardando verificação"),
    focosHoje: (n) => (n === 0 ? "nenhum hoje" : "registrados hoje"),
    resolvidasHoje: (n) => (n === 0 ? "nenhuma hoje" : "resolvidas hoje"),
  };

  for (const [chave, valor] of Object.entries(valores)) {
    const el = document.querySelector(`[data-card="${chave}"]`);
    const nota = document.querySelector(`[data-nota="${chave}"]`);
    if (el) el.textContent = valor;
    if (nota) nota.textContent = notas[chave](valor);
  }
}

function preencherAlerta(denuncias) {
  const box = document.getElementById("dashAlerta");
  if (!box) return;

  const criticas = denuncias.filter((d) => isAtiva(d) && d.gravidade === "Crítica");
  if (!criticas.length) {
    box.hidden = true;
    return;
  }

  const estados = [...new Set(criticas.map((d) => siglaDoEstado(d.local)))].filter((s) => s !== "Outros");
  const onde = estados.length ? ` em ${estados.join(", ")}` : "";
  const n = criticas.length;
  mostrarAlertaDashboard(
    `<strong>Alerta ativo:</strong> ${n} foco${n > 1 ? "s" : ""} crítico${n > 1 ? "s" : ""}${escapeHTML(onde)} aguardando atendimento.`
  );
}

function preencherRecentes(denuncias) {
  const lista = document.getElementById("dashRecentes");
  const total = document.getElementById("dashRecentesTotal");
  if (!lista) return;

  const recentes = denuncias
    .filter(isAtiva)
    .sort((a, b) => `${b.data} ${b.horario || ""}`.localeCompare(`${a.data} ${a.horario || ""}`))
    .slice(0, 5);

  if (total) total.textContent = `${recentes.length} de ${denuncias.filter(isAtiva).length} ativas`;

  if (!recentes.length) {
    lista.innerHTML = `<p class="estado-vazio">Nenhum foco ativo no momento.</p>`;
    return;
  }

  const iconePorGravidade = { Baixa: "fumaca", Média: "flame", Alta: "flame", Crítica: "sirene" };

  lista.innerHTML = recentes.map((d) => `
      <div class="incident-item">
        <span class="inc-icon ${classeGravidade(d.gravidade)}">${icone(iconePorGravidade[d.gravidade] || "flame")}</span>
        <div class="inc-info">
          <div class="inc-name">${escapeHTML(d.local)}</div>
          <div class="inc-meta">
            <span class="num">${escapeHTML(formatarData(d.data))}${d.horario ? " · " + escapeHTML(d.horario) : ""}</span>
            <span aria-hidden="true">·</span>
            <span class="texto-grav ${classeGravidade(d.gravidade)}">${escapeHTML(d.gravidade)}</span>
          </div>
        </div>
        <span class="status ${classeStatus(d.status)}">${escapeHTML(d.status)}</span>
      </div>`).join("");
}

function renderGraficoPorEstado(denuncias) {
  const canvas = document.getElementById("graficoEstados");
  if (!canvas) return;

  const validas = denuncias.filter((d) => d.status !== STATUS.ALARME_FALSO);
  const total = document.getElementById("dashGraficoTotal");
  if (total) total.textContent = `${validas.length} denúncia${validas.length !== 1 ? "s" : ""}`;

  if (!window.Chart) {
    canvas.parentElement.innerHTML = `<p class="estado-vazio">Não foi possível carregar a biblioteca de gráficos.</p>`;
    return;
  }

  const contagem = {};
  validas.forEach((d) => {
    const estado = siglaDoEstado(d.local);
    contagem[estado] = (contagem[estado] || 0) + 1;
  });
  const ordenados = Object.entries(contagem).sort((a, b) => b[1] - a[1]);
  const labels = ordenados.map(([estado]) => estado);
  const valores = ordenados.map(([, qtd]) => qtd);
  // Uma só série = uma só cor (laranja da marca). "Outros" fica em cinza, porque não é um estado.
  const corBarra = labels.map((l) => (l === "Outros" ? "rgba(161,161,170,0.45)" : "rgba(255,92,26,0.85)"));
  const corBarraHover = labels.map((l) => (l === "Outros" ? "rgba(161,161,170,0.7)" : "#ff7a3d"));

  // Destrói o gráfico anterior antes de criar outro (evita vazamento de memória).
  if (graficoAtual) graficoAtual.destroy();

  const fonte = { family: getComputedStyle(document.body).fontFamily };

  graficoAtual = new Chart(canvas.getContext("2d"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Denúncias",
        data: valores,
        backgroundColor: corBarra,
        hoverBackgroundColor: corBarraHover,
        borderRadius: 6,
        borderSkipped: false,
        barThickness: "flex",
        maxBarThickness: 28,
      }],
    },
    options: {
      indexAxis: "y", // barras horizontais
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(31,31,35,0.95)",
          borderColor: "rgba(255,255,255,0.13)",
          borderWidth: 1,
          padding: 10,
          cornerRadius: 8,
          titleFont: { ...fonte, weight: "600" },
          bodyFont: fonte,
          displayColors: false,
          callbacks: {
            label: (ctx) => `${ctx.parsed.x} denúncia${ctx.parsed.x !== 1 ? "s" : ""}`,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: "#9d9da6", stepSize: 1, precision: 0, font: fonte },
          grid: { color: "rgba(255,255,255,0.06)" },
          border: { display: false },
        },
        y: {
          ticks: { color: "#cfcfd4", font: { ...fonte, size: 13, weight: "600" } },
          grid: { display: false },
          border: { display: false },
        },
      },
    },
  });
}

