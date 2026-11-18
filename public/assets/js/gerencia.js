async function abrirGerenciarDenuncias() {
  try {
    const denuncias = await apiFetch("/denuncias");
    renderGerenciar(denuncias.reverse());
  } catch (erro) {
    console.error("Erro ao buscar denúncias:", erro);
    alert(erro.message);
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
      const corGravidade = corDaGravidade(d.gravidade);
      const statusAtual = normalizarStatus(d.status);
      const corStatus = corDoStatus(statusAtual);

      const id = escapeHTML(d.id);
      const foto = urlFoto(d.foto);

      // Um botão para cada status; o status atual fica marcado e desabilitado.
      const botoesStatus = Object.values(STATUS).map((s) => {
        const c = COR_STATUS[s];
        const atual = s === statusAtual;
        return `
          <button
            onclick="atualizarStatus(this.dataset.id, this.dataset.status)"
            data-id="${id}" data-status="${escapeHTML(s)}"
            ${atual ? 'disabled aria-pressed="true"' : ""}
            style="
              padding: 8px; border-radius: 6px;
              background: ${atual ? c.borda : c.bg}; color: ${atual ? "#fff" : c.cor};
              font-size: 12px; font-weight: 600; cursor: ${atual ? "default" : "pointer"};
              border: 1px solid ${c.borda};
            "
          >${c.icone} ${escapeHTML(s)}</button>`;
      }).join("");

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
          <h5 style="margin: 0; font-size: 15px; font-weight: 600; color: #fff;">${escapeHTML(d.local)}</h5>
          <span style="
            font-size: 10px;
            font-weight: 700;
            padding: 3px 8px;
            border-radius: 4px;
            text-transform: uppercase;
            background: ${corGravidade};
            color: #fff;
            white-space: nowrap;
          ">${escapeHTML(d.gravidade)}</span>
        </div>

        <p style="margin: 0; font-size: 13px; color: #8a9099; line-height: 1.4;">
          <strong style="color: #c4c8cd;">Descrição:</strong> ${escapeHTML(d.descricao)}</p>${foto ? `
            <img src="${foto}" alt="Foto da denúncia" loading="lazy" style="
              width: 100%;
              max-height: 160px;
              object-fit: cover;
              border-radius: 6px;
              border: 1px solid #2a2d30;
              " />
          ` : ""}

        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
          <span style="font-size: 11px; background: #1e2022; color: #8a9099; padding: 4px 8px; border-radius: 4px; border: 1px solid #2a2d30;">
            📅 ${escapeHTML(d.data)} ${d.horario ? "· 🕐 " + escapeHTML(d.horario) : ""}
          </span>
          <span style="font-size: 11px; background: ${corStatus.bg}; color: ${corStatus.cor}; padding: 4px 8px; border-radius: 4px; font-weight: 600;">
            ${corStatus.icone} ${escapeHTML(statusAtual)}
          </span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 4px;">
          ${botoesStatus}
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
    // Só órgãos aprovados conseguem: o servidor recusa (403) qualquer outro usuário.
    await apiFetch(`/denuncias/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      body: { status: novoStatus },
    });
    abrirGerenciarDenuncias(); // re-renderiza com status atualizado
  } catch (erro) {
    console.error("Erro:", erro);
    alert(erro.message);
  }
}
