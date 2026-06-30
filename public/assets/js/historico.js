// Histórico e renderização de cards
async function abrirHistorico() {
  try {
    const usuario = JSON.parse(sessionStorage.getItem("usuarioLogado"));

    if (!usuario) {
      renderCards([]);
      return;
    }

    const resposta = await fetch(
      `https://fire-watch.onrender.com/denuncias?usuarioId=${usuario.id}`
    );
    const denuncias = await resposta.json();
    renderCards(denuncias.reverse());
  } catch (erro) {
    renderCards([]);
    console.error("Erro ao buscar histórico:", erro);
  }
}

function createCard(denuncia) {
  // Cores baseadas na gravidade para o badge
  let corGravidade = "#ff8c42"; // Média (Laranja)
  if (denuncia.gravidade === "Baixa") corGravidade = "#1eeb84"; // Verde
  if (denuncia.gravidade === "Alta") corGravidade = "#ff5c1a"; // Vermelho/Laranja escuro
  if (denuncia.gravidade === "Crítica") corGravidade = "#ff3b3b"; // Vermelho vivo

  const corStatus = {
    Pendente: { bg: "#0a1a2a", cor: "#4db8ff" },
    Resolvida: { bg: "#0f200f", cor: "#29d17c" },
    "Alarme Falso": { bg: "#2a2a00", cor: "#d4d400" },
    "Em verificação": { bg: "#35250d", cor: "#e88e44" },
  }[denuncia.status] || { bg: "#35250d", cor: "#e88e44" };
  return `
  <div style="
      background: #161819; 
      border: 1px solid #2a2d30; 
      border-radius: 10px; 
      padding: 16px; 
      display: flex; 
      flex-direction: column; 
      justify-content: space-between;
      gap: 12px;
  ">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
          <h5 style="margin: 0; font-size: 15px; font-weight: 600; color: #fff;">${denuncia.local}</h5>
          <span style="
              font-size: 10px; 
              font-weight: 700; 
              padding: 3px 8px; 
              border-radius: 4px; 
              text-transform: uppercase; 
              background: ${corGravidade}; 
              color: #fff;
              white-space: nowrap;
          ">${denuncia.gravidade}</span>
      </div>
      
      <p style="margin: 0; font-size: 13px; color: #8a9099; line-height: 1.4;">
          <strong style="color: #c4c8cd;">Descrição:</strong> ${denuncia.descricao}${denuncia.foto ? `
            <img src="${denuncia.foto}" style="
              width: 100%;
              max-height: 160px;
              object-fit: cover;
            border-radius: 6px;
            border: 1px solid #2a2d30;
            " />
            ` : ""}
      </p>
      
      <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: auto;">
          <span style="font-size: 11px; background: #1e2022; color: #8a9099; padding: 4px 8px; border-radius: 4px; border: 1px solid #2a2d30;">
              📅 ${denuncia.data} ${denuncia.horario ? "· 🕐 " + denuncia.horario : ""}
          </span>
          <span style="font-size: 11px; background: ${corStatus.bg}; color: ${corStatus.cor}; padding: 4px 8px; border-radius: 4px; font-weight: 600;">
            ${denuncia.status}
          </span>                   
      </div>
      <button
        onclick="excluirDenuncia('${denuncia.id}')"
        style="
        width: 100%; padding: 8px; border: none; border-radius: 6px;
        background: #2a0000; color: #ff3b3b;
        font-size: 12px; font-weight: 600; cursor: pointer;
        border: 1px solid #5a0000;
        transition: background 0.15s;
        margin-top: 4px;
        "
        onmouseover="this.style.background='#5a0000'"
        onmouseout="this.style.background='#2a0000'"
        >🗑 Excluir Denúncia</button>
      </div>
  `;
}

function renderCards(denuncias) {
  // Captura o contêiner central dinamicamente do DOM
  const mainContent = document.querySelector(".content");
  if (!mainContent) return;

  if (!denuncias.length) {
    mainContent.innerHTML = `
        <div class="incidents-box">
          <div class="incidents-header">
            Histórico de Denúncias
            <span>0 registros</span>
          </div>
          <div style="padding: 32px; text-align: center; color: #45494d; font-size: 14px;">
            Nenhuma denúncia cadastrada até o momento.
          </div>
        </div>
    `;
    return;
  }

  // Mapeia as denúncias aplicando o card estilizado inline
  const listaDeCards = denuncias
    .map(createCard)
    .join("");

  // Substitui a área central pela Grid limpa de histórico
  mainContent.innerHTML = `
      <div class="incidents-box">
        <div class="incidents-header">
          Histórico de Denúncias
          <span>${denuncias.length} registro${denuncias.length !== 1 ? "s" : ""}</span>
        </div>
        <div style="padding: 16px;">
            <div style="
                display: grid; 
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); 
                gap: 14px;
            ">
                ${listaDeCards}
            </div>
        </div>
      </div>
  `;
}
async function excluirDenuncia(id) {
  const confirmado = confirm("Tem certeza que deseja excluir esta denúncia?");
  if (!confirmado) return;

  try {
    const resposta = await fetch(`https://fire-watch.onrender.com/denuncias/${id}`, {
      method: "DELETE"
    });

    if (resposta.ok) {
      abrirHistorico();
    } else {
      alert("Erro ao excluir: " + resposta.status);
    }
  } catch (erro) {
    console.error("Erro:", erro);
    alert("Erro ao conectar ao servidor.");
  }
}