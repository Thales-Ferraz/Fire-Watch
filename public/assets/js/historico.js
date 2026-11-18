// Histórico: denúncias feitas pelo próprio usuário (com busca, filtros e paginação).

async function abrirHistorico() {
  const mainContent = document.querySelector(".content");
  if (!mainContent) return;

  if (!isLogado()) {
    mainContent.innerHTML = `
      <p class="estado-vazio">Entre na sua conta para ver o histórico das suas denúncias.<br><br>
        <a class="btn btn-primario" href="login.html">Entrar</a></p>`;
    return;
  }

  mainContent.innerHTML = `<p class="carregando">Carregando histórico…</p>`;

  try {
    // O servidor filtra pelas denúncias do usuário do token.
    const denuncias = await apiFetch("/denuncias?minhas");
    if (rotaAtual() !== "historico") return; // usuário já trocou de tela

    montarListaDenuncias({
      chave: "historico",
      titulo: "Histórico de Denúncias",
      denuncias,
      vazio: "Você ainda não fez nenhuma denúncia.",
      acoes: () => `
        <button type="button" class="btn btn-perigo btn-sm btn-bloco" data-acao="excluir">${icone("lixeira")} Excluir denúncia</button>`,
      aoAcao: (acao, id, botao) => {
        if (acao === "excluir") excluirDenuncia(id, botao);
      },
    });
  } catch (erro) {
    console.error("Erro ao buscar histórico:", erro);
    mainContent.innerHTML = `<p class="estado-erro">${escapeHTML(erro.message)}</p>`;
  }
}

async function excluirDenuncia(id, botao) {
  const ok = await confirmar("A denúncia e a foto anexada serão apagadas. Isso não pode ser desfeito.", {
    titulo: "Excluir denúncia?",
    textoOk: "Excluir",
    perigo: true,
  });
  if (!ok) return;

  try {
    await comBotaoOcupado(botao, "Excluindo…", () =>
      apiFetch(`/denuncias/${encodeURIComponent(id)}`, { method: "DELETE" })
    );
    toast("Denúncia excluída.", "sucesso");
    abrirHistorico();
  } catch (erro) {
    console.error("Erro:", erro);
    toast(erro.message, "erro");
  }
}
