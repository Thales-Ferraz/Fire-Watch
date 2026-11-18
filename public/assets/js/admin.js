// Tela do administrador: aprovar ou recusar cadastros de órgãos públicos.

async function abrirAprovacaoOrgaos() {
  const mainContent = document.querySelector(".content");
  if (!mainContent) return;
  mainContent.innerHTML = `<p class="carregando">Carregando cadastros…</p>`;

  try {
    const pendentes = await apiFetch("/admin/usuarios?status=pendente");
    if (rotaAtual() !== "aprovar") return;
    renderAprovacaoOrgaos(pendentes);
  } catch (erro) {
    mainContent.innerHTML = `<p class="estado-erro">${escapeHTML(erro.message)}</p>`;
  }
}

function renderAprovacaoOrgaos(usuarios) {
  const mainContent = document.querySelector(".content");
  if (!mainContent) return;

  const cards = usuarios.length
    ? usuarios.map((u) => `
        <article class="card orgao-card">
          <strong>${escapeHTML(u.nome)}</strong>
          <span>Login: ${escapeHTML(u.login)} · ${escapeHTML(u.email)}</span>
          <span>${escapeHTML(u.orgao)} — ${escapeHTML(u.cargo)} · Matrícula ${escapeHTML(u.matricula)}</span>
          <span>E-mail institucional: ${escapeHTML(u.emailInstitucional)}</span>
          <div class="orgao-acoes">
            <button type="button" class="btn btn-sm btn-sucesso" data-acao="aprovado" data-id="${escapeHTML(u.id)}">${icone("check")} Aprovar</button>
            <button type="button" class="btn btn-sm btn-perigo" data-acao="rejeitado" data-id="${escapeHTML(u.id)}">${icone("fechar")} Recusar</button>
          </div>
        </article>`).join("")
    : `<p class="estado-vazio grade-cheia">Nenhum cadastro de órgão aguardando aprovação.</p>`;

  mainContent.innerHTML = `
    <section class="painel">
      <div class="painel-cabecalho">
        <h2>Aprovar Órgãos</h2>
        <span>${usuarios.length} pendente${usuarios.length !== 1 ? "s" : ""}</span>
      </div>
      <div class="painel-corpo grade-cards">${cards}</div>
    </section>`;

  mainContent.querySelectorAll("button[data-acao]").forEach((botao) => {
    botao.addEventListener("click", () => definirStatusUsuario(botao.dataset.id, botao.dataset.acao, botao));
  });
}

async function definirStatusUsuario(id, status, botao) {
  const aprovar = status === "aprovado";
  const ok = await confirmar(
    aprovar
      ? "O órgão poderá mudar o status de todas as denúncias."
      : "O usuário não poderá mais entrar no sistema.",
    { titulo: aprovar ? "Aprovar este cadastro?" : "Recusar este cadastro?", textoOk: aprovar ? "Aprovar" : "Recusar", perigo: !aprovar }
  );
  if (!ok) return;

  try {
    await comBotaoOcupado(botao, "Salvando…", () =>
      apiFetch(`/admin/usuarios/${encodeURIComponent(id)}`, { method: "PATCH", body: { status } })
    );
    toast(aprovar ? "Cadastro aprovado." : "Cadastro recusado.", "sucesso");
    abrirAprovacaoOrgaos();
  } catch (erro) {
    toast(erro.message, "erro");
  }
}
