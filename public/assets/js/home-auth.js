// Mostra/esconde áreas do menu conforme o usuário logado.
// (Só visual: as permissões de verdade são checadas pelo servidor.)
function aplicarPerfilNaTela() {
  const usuario = getUsuarioLogado();

  const areaVisitante = document.getElementById("areaVisitante");
  const areaUsuario = document.getElementById("areaUsuario");
  const nomeUsuario = document.getElementById("nomeUsuario");
  const areaOrgao = document.getElementById("areaOrgao");
  const areaAdmin = document.getElementById("areaAdmin");

  if (areaVisitante) areaVisitante.style.display = usuario ? "none" : "flex";
  if (areaUsuario) areaUsuario.style.display = usuario ? "flex" : "none";
  if (nomeUsuario) nomeUsuario.textContent = usuario ? `Olá, ${usuario.nome}` : "";
  if (areaOrgao) areaOrgao.style.display = isOrgao() ? "block" : "none";
  if (areaAdmin) areaAdmin.style.display = isAdmin() ? "block" : "none";
}

document.addEventListener("DOMContentLoaded", async () => {
  aplicarPerfilNaTela();
  if (!getToken()) return;

  // Atualiza os dados do usuário (ex.: órgão aprovado depois do login)
  // e encerra a sessão se o token tiver expirado.
  try {
    const { usuario } = await apiFetch("/auth/me");
    salvarSessao(getToken(), usuario);
  } catch (erro) {
    if (erro.status === 401) limparSessao();
  }
  aplicarPerfilNaTela();
});
