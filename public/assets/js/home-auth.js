document.addEventListener("DOMContentLoaded", () => {
  const usuario = getUsuarioLogado();

  const areaVisitante = document.getElementById("areaVisitante");
  const areaUsuario = document.getElementById("areaUsuario");
  const nomeUsuario = document.getElementById("nomeUsuario");
  const areaOrgao = document.getElementById("areaOrgao");

  if (!usuario) {
    if (areaVisitante) areaVisitante.style.display = "flex";
    if (areaUsuario) areaUsuario.style.display = "none";
    if (areaOrgao) areaOrgao.style.display = "none";
    return;
  }

  if (areaVisitante) areaVisitante.style.display = "none";
  if (areaUsuario) areaUsuario.style.display = "flex";

  if (nomeUsuario) {
    nomeUsuario.textContent = `Olá, ${usuario.nome}`;
  }

  if (usuario.tipo === "orgao") {
    if (areaOrgao) areaOrgao.style.display = "block";
  } else {
    if (areaOrgao) areaOrgao.style.display = "none";
  }
});