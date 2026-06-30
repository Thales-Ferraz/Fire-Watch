async function abrirGerenciarDenuncias() {
  try {
    const resposta = await fetch("https://fire-watch.onrender.com/denuncias");
    const denuncias = await resposta.json();
    renderGerenciar(denuncias.reverse());
  } catch (erro) {
    console.error("Erro ao buscar denúncias:", erro);
  }
}

function renderGerenciar(denuncias) {
  const mainContent = document.querySelector(".content");
  if (!mainContent) return;

  if (!denuncias || denuncias.length === 0) {
    mainContent.innerHTML = `
      <div class="incidents-box">
        <div class="incidents-header">
          Gerenciar Denúncias
          <span>0 registros</span>
        </div>
        <div style="padding: 32px; text-align: center; color: #45494d; font-size: 14px;">
          Nenhuma denúncia cadastrada até o momento.
        </div>
      </div>
    `;
    return;
  }

  const cards = denuncias
    .map((d) => {
      const corGravidade =
        {
          Baixa: "#29d17c",
          Média: "#ff8c42",
          Alta: "#ff5c1a",
          Crítica: "#ff3b3b",
        }[d.gravidade] || "#ff8c42";

      const corStatus = {
        "Pendente": { bg: "#0a1a2a", cor: "#4db8ff" },
        "Resolvida": { bg: "#0f200f", cor: "#29d17c" },
        "Alarme Falso": { bg: "#2a2a00", cor: "#d4d400" },
        "Em verificação": { bg: "#35250d", cor: "#e88e44" },
      }[d.status] || { bg: "#35250d", cor: "#e88e44" };

      return `
      <div style="
        background: #161819;
        border: 1px solid #2a2d30;
        border-radius: 10px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      ">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
          <h5 style="margin: 0; font-size: 15px; font-weight: 600; color: #fff;">${d.local}</h5>
          <span style="
            font-size: 10px;
            font-weight: 700;
            padding: 3px 8px;
            border-radius: 4px;
            text-transform: uppercase;
            background: ${corGravidade};
            color: #fff;
            white-space: nowrap;
          ">${d.gravidade}</span>
        </div>

        <p style="margin: 0; font-size: 13px; color: #8a9099; line-height: 1.4;">
          <strong style="color: #c4c8cd;">Descrição:</strong> ${d.descricao}</p>${d.foto ? `
            <img src="${d.foto}" style="
              width: 100%;
              max-height: 160px;
              object-fit: cover;
              border-radius: 6px;
              border: 1px solid #2a2d30;
              " />
          ` : ""}

        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
          <span style="font-size: 11px; background: #1e2022; color: #8a9099; padding: 4px 8px; border-radius: 4px; border: 1px solid #2a2d30;">
            📅 ${d.data} ${d.horario ? "· 🕐 " + d.horario : ""}
          </span>
          <span style="font-size: 11px; background: ${corStatus.bg}; color: ${corStatus.cor}; padding: 4px 8px; border-radius: 4px; font-weight: 600;">
            ⏳ ${d.status}
          </span>
        </div>

        <button
          onclick="atualizarStatus('${d.id}', 'Resolvida')"
          style="
            flex: 1; padding: 8px; border: none; border-radius: 6px;
            background: #0f200f; color: #29d17c;
            font-size: 12px; font-weight: 600; cursor: pointer;
            border: 1px solid #1a4a1a;
            transition: background 0.15s;
          "
          onmouseover="this.style.background='#1a4a1a'"
          onmouseout="this.style.background='#0f200f'"
        >✔ Resolvida</button>
        
        <button
        onclick="atualizarStatus('${d.id}', 'Alarme Falso')"
        style="
        flex: 1; padding: 8px; border: none; border-radius: 6px;
        background: #2a2a00; color: #d4d400;
        font-size: 12px; font-weight: 600; cursor: pointer;
        border: 1px solid #4a4a00;
        transition: background 0.15s;
        "
        onmouseover="this.style.background='#4a4a00'"
        onmouseout="this.style.background='#2a2a00'"
        >⚠ Alarme Falso</button>
        
        <div style="display: flex; gap: 8px; margin-top: 4px;">
          <button
            onclick="atualizarStatus('${d.id}', 'Pendente')"
            style="
              flex: 1; padding: 8px; border: none; border-radius: 6px;
              background: #0a1a2a; color: #4db8ff;
              font-size: 12px; font-weight: 600; cursor: pointer;
              border: 1px solid #1a3a5a;
              transition: background 0.15s;
            "
            onmouseover="this.style.background='#1a3a5a'"
            onmouseout="this.style.background='#0a1a2a'"
          >⏳ Pendente</button>
          <button
            onclick="atualizarStatus('${d.id}', 'Em Verificação')"
            style="
              flex: 1; padding: 8px; border: none; border-radius: 6px;
              background: #35250d; color: #e88e44;
              font-size: 12px; font-weight: 600; cursor: pointer;
              border: 1px solid #c68c46;
              transition: background 0.15s;
            "
            onmouseover="this.style.background='#c68c46'"
            onmouseout="this.style.background='#35250d'"
          >Em verificação</button>

        </div>
      </div>
    `;
    })
    .join("");

  mainContent.innerHTML = `
    <div class="incidents-box">
      <div class="incidents-header">
        Gerenciar Denúncias
        <span>${denuncias.length} registro${denuncias.length !== 1 ? "s" : ""}</span>
      </div>
      <div style="padding: 16px;">
        <div style="
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 14px;
        ">
          ${cards}
        </div>
      </div>
    </div>
  `;
}

async function atualizarStatus(id, novoStatus) {
  try {
    const resposta = await fetch(`https://fire-watch.onrender.com/denuncias/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: novoStatus }),
    });

    if (resposta.ok) {
      abrirGerenciarDenuncias(); // re-renderiza com status atualizado
    } else {
      alert("Erro ao atualizar status: " + resposta.status);
    }
  } catch (erro) {
    console.error("Erro:", erro);
    alert("Erro ao conectar ao servidor.");
  }
}
