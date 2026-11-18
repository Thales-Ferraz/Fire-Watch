// Sessão do usuário no navegador.
// Guardamos só o token (JWT) e os dados públicos do usuário — nunca a senha.

const CHAVE_TOKEN = "fw_token";
const CHAVE_USUARIO = "usuarioLogado";

// Sessões antigas (antes do token) guardavam o usuário com a senha: descarta.
if (sessionStorage.getItem(CHAVE_USUARIO) && !sessionStorage.getItem(CHAVE_TOKEN)) {
  sessionStorage.removeItem(CHAVE_USUARIO);
}

function getToken() {
  return sessionStorage.getItem(CHAVE_TOKEN);
}

function getUsuarioLogado() {
  try {
    return JSON.parse(sessionStorage.getItem(CHAVE_USUARIO));
  } catch {
    return null;
  }
}

function salvarSessao(token, usuario) {
  sessionStorage.setItem(CHAVE_TOKEN, token);
  sessionStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
}

function limparSessao() {
  sessionStorage.removeItem(CHAVE_TOKEN);
  sessionStorage.removeItem(CHAVE_USUARIO);
}

function isLogado() {
  return !!getToken() && !!getUsuarioLogado();
}

// Só serve para mostrar/esconder botões; quem decide de verdade é o servidor.
function isOrgao() {
  const u = getUsuarioLogado();
  return !!u && u.tipo === "orgao" && u.status === "aprovado";
}

function isAdmin() {
  const u = getUsuarioLogado();
  return !!u && u.admin === true;
}

function logout() {
  limparSessao();
  window.location.href = "login.html";
}
