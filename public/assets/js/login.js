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
  const botao = event.target.querySelector("button[type=submit]");

  if (!login || !senha) {
    alert("Preencha login e senha.");
    return;
  }

  if (botao) botao.disabled = true;
  try {
    // A senha vai no corpo da requisição (POST), nunca na URL.
    const { token, usuario } = await apiFetch("/auth/login", {
      method: "POST",
      body: { login, senha },
    });

    salvarSessao(token, usuario);

    if (usuario.tipo === "orgao" && usuario.status === "pendente") {
      alert("Seu cadastro de órgão público ainda está aguardando aprovação. Até lá, você usa o sistema como cidadão.");
    }

    window.location.href = PAGINA_INICIAL;
  } catch (erro) {
    console.error("Erro no login:", erro);
    alert(erro.message);
  } finally {
    if (botao) botao.disabled = false;
  }
}
