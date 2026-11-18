// Gerenciar Denúncias (só órgãos aprovados): todas as denúncias, com troca de status.

async function abrirGerenciarDenuncias() {
  const mainContent = document.querySelector(".content");
  if (!mainContent) return;
  mainContent.innerHTML = `<p class="carregando">Carregando denúncias…</p>`;

  try {
    const denuncias = await apiFetch("/denuncias");
    if (rotaAtual() !== "gerenciar") return; // usuário já trocou de tela
    renderGerenciar(denuncias);
  } catch (erro) {
    console.error("Erro ao buscar denúncias:", erro);
    mainContent.innerHTML = `<p class="estado-erro">${escapeHTML(erro.message)}</p>`;
  }
}

function renderGerenciar(denuncias) {
  montarListaDenuncias({
    chave: "gerencia",
    titulo: "Gerenciar Denúncias",
    denuncias,
    vazio: "Nenhuma denúncia cadastrada até o momento.",
    // Um botão para cada status; o status atual fica marcado e desabilitado.
    acoes: (d) => {
      const atual = normalizarStatus(d.status);
      const botoes = Object.values(STATUS).map((s) => `
        <button type="button" class="btn-status ${classeStatus(s)}" data-acao="status" data-status="${escapeHTML(s)}"
          ${s === atual ? 'disabled aria-pressed="true"' : 'aria-pressed="false"'}>
          ${escapeHTML(s)}
        </button>`).join("");
      return `<div class="acoes-status" role="group" aria-label="Mudar status">${botoes}</div>`;
    },
    aoAcao: (acao, id, botao) => {
      if (acao === "status") atualizarStatus(id, botao.dataset.status, botao);
    },
  });
}

async function atualizarStatus(id, novoStatus, botao) {
  try {
    // Só órgãos aprovados conseguem: o servidor recusa (403) qualquer outro usuário.
    await comBotaoOcupado(botao, "Salvando…", () =>
      apiFetch(`/denuncias/${encodeURIComponent(id)}/status`, {
        method: "PATCH",
        body: { status: novoStatus },
      })
    );
    toast(`Status alterado para "${novoStatus}".`, "sucesso");
    abrirGerenciarDenuncias(); // re-renderiza mantendo os filtros
  } catch (erro) {
    console.error("Erro:", erro);
    toast(erro.message, "erro");
  }
}
