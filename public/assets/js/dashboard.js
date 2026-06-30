async function abrirDashboard() {
  const mainContent = document.querySelector(".content");
  if (!mainContent) return;

  try {
    const resposta = await fetch("dashboard.html");
    if (!resposta.ok) throw new Error("Erro ao carregar dashboard.");

    const html = await resposta.text();
    mainContent.innerHTML = html;

    if (typeof refazerMapaNoDashboard === "function") {
      refazerMapaNoDashboard();
    }

    await atualizarCards();
    await renderGraficoPorEstado();

  } catch (erro) {
    console.error(erro);
    mainContent.innerHTML = `<p style="color: #ff3b3b; text-align: center; padding: 20px;">⚠️ Erro ao carregar o Dashboard.</p>`;
  }
}

async function atualizarCards() {
  try {
    const resposta = await fetch("https://fire-watch.onrender.com/denuncias");
    const denuncias = await resposta.json();

    const hoje = new Date().toISOString().split("T")[0];

    const emVerificacao  = denuncias.filter(d => d.status.trim() === "Em Verificação").length;
    const pendentes      = denuncias.filter(d => d.status.trim() === "Pendente").length;
    const focosHoje      = denuncias.filter(d => d.data === hoje).length;
    const resolvidosHoje = denuncias.filter(d => d.status.trim() === "Resolvida" && d.data === hoje).length;

    document.querySelector(".stat-card.c-fire .stat-value").textContent   = emVerificacao;
    document.querySelector(".stat-card.c-fire .stat-note").textContent    = emVerificacao === 0 ? "nenhuma no momento" : "em andamento";

    document.querySelector(".stat-card.c-danger .stat-value").textContent = pendentes;
    document.querySelector(".stat-card.c-danger .stat-note").textContent  = pendentes === 0 ? "nenhuma pendente" : "aguardando verificação";

    document.querySelector(".stat-card.c-ember .stat-value").textContent  = focosHoje;
    document.querySelector(".stat-card.c-ember .stat-note").textContent   = focosHoje === 0 ? "nenhum hoje" : "registrados hoje";

    document.querySelector(".stat-card.c-green .stat-value").textContent  = resolvidosHoje;
    document.querySelector(".stat-card.c-green .stat-note").textContent   = resolvidosHoje === 0 ? "nenhuma hoje" : "resolvidas hoje";

  } catch (erro) {
    console.error("Erro ao atualizar cards:", erro);
  }
}

async function renderGraficoPorEstado() {
  try {
    const resposta = await fetch("https://fire-watch.onrender.com/denuncias");
    const denuncias = await resposta.json();

    // Conta denúncias por estado
   const siglas = {
    "Minas Gerais": "MG", "São Paulo": "SP", "Rio de Janeiro": "RJ",
    "Bahia": "BA", "Paraná": "PR", "Rio Grande do Sul": "RS",
    "Goiás": "GO", "Pará": "PA", "Mato Grosso": "MT",
    "Mato Grosso do Sul": "MS", "Ceará": "CE", "Pernambuco": "PE",
    "Maranhão": "MA", "Amazonas": "AM", "Santa Catarina": "SC",
    "Espírito Santo": "ES", "Tocantins": "TO", "Rondônia": "RO",
    "Acre": "AC", "Roraima": "RR", "Amapá": "AP", "Piauí": "PI",
    "Rio Grande do Norte": "RN", "Paraíba": "PB", "Alagoas": "AL",
    "Sergipe": "SE", "Distrito Federal": "DF"
    };

    const contagemEstados = {};
        denuncias
            .filter(d => d.status.trim() !== "Alarme Falso")
            .forEach(d => {
        const estadoEncontrado = Object.keys(siglas).find(nome => d.local.includes(nome));
        const estado = estadoEncontrado ? siglas[estadoEncontrado] : "Outros";
        contagemEstados[estado] = (contagemEstados[estado] || 0) + 1;
    });

    // Ordena do maior para o menor
    const estadosOrdenados = Object.entries(contagemEstados)
      .sort((a, b) => b[1] - a[1]);

    const labels = estadosOrdenados.map(([estado]) => estado);
    const valores = estadosOrdenados.map(([, qtd]) => qtd);

    // Substitui o incidents-box pelo gráfico
    const incidentsBox = document.querySelector(".incidents-box");
    if (!incidentsBox) return;

    incidentsBox.innerHTML = `
      <div class="incidents-header">
        Denúncias por Estado
        <span>${denuncias.length} total</span>
      </div>
      <div style="padding: 16px; height: calc(100% - 48px); display: flex; align-items: center;">
        <canvas id="graficoEstados"></canvas>
      </div>
    `;

    // Carrega Chart.js dinamicamente se ainda não estiver carregado
    if (!window.Chart) {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/chart.js";
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    const ctx = document.getElementById("graficoEstados").getContext("2d");

    new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Denúncias",
          data: valores,
          backgroundColor: labels.map((_, i) => {
            const cores = ["#ff5c1a", "#ff8c42", "#ff3b3b", "#29d17c", "#4db8ff", "#d4d400"];
            return cores[i % cores.length] + "cc"; // cc = 80% opacidade
          }),
          borderColor: labels.map((_, i) => {
            const cores = ["#ff5c1a", "#ff8c42", "#ff3b3b", "#29d17c", "#4db8ff", "#d4d400"];
            return cores[i % cores.length];
          }),
          borderWidth: 1,
          borderRadius: 6,
        }]
      },
      options: {
        indexAxis: "y", // barras horizontais
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.parsed.x} denúncia${ctx.parsed.x !== 1 ? "s" : ""}`
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: "#8a9099",
              stepSize: 1,
              precision: 0
            },
            grid: { color: "#2a2d30" },
            border: { color: "#2a2d30" }
          },
          y: {
            ticks: { color: "#c4c8cd", font: { size: 13, weight: "600" } },
            grid: { display: false },
            border: { color: "#2a2d30" }
          }
        }
      }
    });

  } catch (erro) {
    console.error("Erro ao renderizar gráfico:", erro);
  }
}