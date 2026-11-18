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
    mainContent.innerHTML = `<p style="color: #ff3b3b; text-align: center; padding: 20px;">⚠️ Erro ao carregar o Dashboard.</p>`;
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
    lista.innerHTML = `<div style="padding: 24px; text-align: center; color: #8a9099; font-size: 14px;">
      Nenhum foco ativo no momento.</div>`;
    return;
  }

  const icone = { Baixa: "🌫️", Média: "🔥", Alta: "🔥", Crítica: "🚨" };

  lista.innerHTML = recentes.map((d) => {
    const c = corDoStatus(d.status);
    return `
      <div class="incident-item">
        <div class="inc-icon">${icone[d.gravidade] || "🔥"}</div>
        <div class="inc-info">
          <div class="inc-name">${escapeHTML(d.local)}</div>
          <div class="inc-meta">
            ${escapeHTML(d.data)}${d.horario ? " · " + escapeHTML(d.horario) : ""} · Gravidade
            <span style="color: ${corDaGravidade(d.gravidade)}; font-weight: 600;">${escapeHTML(d.gravidade)}</span>
          </div>
        </div>
        <span class="badge" style="background: ${c.bg}; color: ${c.cor};">${escapeHTML(d.status)}</span>
      </div>`;
  }).join("");
}

function renderGraficoPorEstado(denuncias) {
  const canvas = document.getElementById("graficoEstados");
  if (!canvas) return;

  const validas = denuncias.filter((d) => d.status !== STATUS.ALARME_FALSO);
  const total = document.getElementById("dashGraficoTotal");
  if (total) total.textContent = `${validas.length} denúncia${validas.length !== 1 ? "s" : ""}`;

  if (!window.Chart) {
    canvas.parentElement.innerHTML = `<p style="color:#8a9099;text-align:center;padding:20px;">
      Não foi possível carregar a biblioteca de gráficos.</p>`;
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
  const cores = ["#ff5c1a", "#ff8c42", "#ff3b3b", "#29d17c", "#4db8ff", "#d4d400"];

  // Destrói o gráfico anterior antes de criar outro (evita vazamento de memória).
  if (graficoAtual) graficoAtual.destroy();

  graficoAtual = new Chart(canvas.getContext("2d"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Denúncias",
        data: valores,
        backgroundColor: labels.map((_, i) => cores[i % cores.length] + "cc"),
        borderColor: labels.map((_, i) => cores[i % cores.length]),
        borderWidth: 1,
        borderRadius: 6,
      }],
    },
    options: {
      indexAxis: "y", // barras horizontais
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.parsed.x} denúncia${ctx.parsed.x !== 1 ? "s" : ""}`,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: "#8a9099", stepSize: 1, precision: 0 },
          grid: { color: "#2a2d30" },
          border: { color: "#2a2d30" },
        },
        y: {
          ticks: { color: "#c4c8cd", font: { size: 13, weight: "600" } },
          grid: { display: false },
          border: { color: "#2a2d30" },
        },
      },
    },
  });
}

// Ponto de entrada único da página.
document.addEventListener("DOMContentLoaded", abrirDashboard);
