const PAGINA_INICIAL = "firewatch.html";

document.addEventListener("DOMContentLoaded", () => {
  // Quem já está logado não precisa ver o login.
  if (isLogado()) {
    window.location.replace(PAGINA_INICIAL);
    return;
  }
  document.getElementById("formLogin")?.addEventListener("submit", realizarLogin);
});

async function realizarLogin(event) {
  event.preventDefault();

  const login = document.getElementById("username").value.trim();
  const senha = document.getElementById("password").value;
  const botao = event.target.querySelector("button[type=submit]");

  if (!login || !senha) {
    toast("Preencha usuário e senha.", "erro");
    return;
  }

  try {
    // A senha vai no corpo da requisição (POST), nunca na URL.
    const { token, usuario } = await comBotaoOcupado(botao, "Entrando…", () =>
      apiFetch("/auth/login", { method: "POST", body: { login, senha } })
    );

    salvarSessao(token, usuario);

    if (usuario.tipo === "orgao" && usuario.status === "pendente") {
      toastDepois("Seu cadastro de órgão público ainda aguarda aprovação. Até lá, você usa o sistema como cidadão.", "info");
    } else {
      toastDepois(`Bem-vindo(a), ${usuario.nome}!`, "sucesso");
    }

    window.location.href = PAGINA_INICIAL;
  } catch (erro) {
    console.error("Erro no login:", erro);
    toast(erro.message, "erro");
    document.getElementById("password").select();
  }
}
