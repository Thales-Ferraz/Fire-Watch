function getUsuarioLogado() {
  return JSON.parse(sessionStorage.getItem("usuarioLogado"));
}

function isLogado() {
  return !!getUsuarioLogado();
}

function isOrgao() {
  const usuario = getUsuarioLogado();
  return usuario && usuario.tipo === "orgao";
}

function logout() {
  sessionStorage.removeItem("usuarioLogado");
  window.location.href = "login.html";
}