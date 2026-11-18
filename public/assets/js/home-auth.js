// Mostra/esconde áreas do menu e do cabeçalho conforme o usuário logado.
// (Só visual: as permissões de verdade são checadas pelo servidor.)
function aplicarPerfilNaTela() {
  const usuario = getUsuarioLogado();
  const mostrar = (id, visivel) => {
    const el = document.getElementById(id);
    if (el) el.hidden = !visivel;
  };

  mostrar("areaVisitante", !usuario);
  mostrar("areaUsuario", !!usuario);
  mostrar("areaOrgao", isOrgao());
  mostrar("areaAdmin", isAdmin());

  const nome = document.getElementById("nomeUsuario");
  if (nome) nome.textContent = usuario ? usuario.nome.split(" ")[0] : "";
  const avatar = document.getElementById("avatarUsuario");
  if (avatar) avatar.textContent = usuario ? usuario.nome.trim().charAt(0).toUpperCase() : "";
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
    if (erro.status === 401) {
      limparSessao();
      toast("Sua sessão expirou. Entre novamente.", "info");
    }
  }
  aplicarPerfilNaTela();
});
