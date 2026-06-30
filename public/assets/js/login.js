const API_URL = "https://fire-watch.onrender.com/usuarios";
const PAGINA_INICIAL = "firewatch.html";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formLogin");

  if (form) {
    form.addEventListener("submit", realizarLogin);
  }
});

async function realizarLogin(event) {
  event.preventDefault();

  const login = document.getElementById("username").value.trim();
  const senha = document.getElementById("password").value;

  if (!login || !senha) {
    alert("Preencha login e senha.");
    return;
  }

  try {
    const resposta = await fetch(
      `${API_URL}?login=${encodeURIComponent(login)}&senha=${encodeURIComponent(senha)}`
    );

    const usuarios = await resposta.json();

    if (usuarios.length === 0) {
      alert("Usuário não encontrado. Faça o cadastro.");
      return;
    }

    const usuario = usuarios[0];

    if (usuario.primeiroLogin === true) {
      const patchResposta = await fetch(`${API_URL}/${usuario.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          primeiroLogin: false
        })
      });

      if (!patchResposta.ok) {
        throw new Error("Erro ao atualizar primeiro login.");
      }

      usuario.primeiroLogin = false;
    }

    sessionStorage.setItem("usuarioLogado", JSON.stringify(usuario));
    window.location.href = PAGINA_INICIAL;

  } catch (erro) {
    console.error("Erro no login:", erro);
    alert("Erro ao realizar login.");
  }
}