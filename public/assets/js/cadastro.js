const CAMPOS_ORGAO = ["orgao", "cargo", "matricula", "emailInstitucional"];

document.addEventListener("DOMContentLoaded", () => {
  const tipoUsuario = document.getElementById("tipo");
  const camposOrgao = document.getElementById("camposOrgao");
  const form = document.getElementById("formCadastro");

  // Mostra os campos do órgão só quando o tipo é "Órgão Público"
  // (e só então eles passam a ser obrigatórios).
  const atualizarCamposOrgao = () => {
    const orgao = tipoUsuario.value === "orgao";
    camposOrgao.hidden = !orgao;
    CAMPOS_ORGAO.forEach((id) => (document.getElementById(id).required = orgao));
  };

  if (tipoUsuario && camposOrgao) {
    tipoUsuario.addEventListener("change", atualizarCamposOrgao);
    atualizarCamposOrgao();
  }

  form?.addEventListener("submit", cadastrarUsuario);
});

async function cadastrarUsuario(event) {
  event.preventDefault();

  const valor = (id) => document.getElementById(id).value.trim();
  const nome = valor("nome");
  const email = valor("email");
  const login = valor("login");
  const senha = document.getElementById("senha").value;
  const senha2 = document.getElementById("senha2").value;
  const tipo = document.getElementById("tipo").value;
  const botao = event.target.querySelector("button[type=submit]");

  if (!nome || !email || !login || !senha || !senha2 || !tipo) {
    toast("Preencha todos os campos obrigatórios.", "erro");
    return;
  }
  if (senha.length < 6) {
    toast("A senha precisa ter pelo menos 6 caracteres.", "erro");
    document.getElementById("senha").focus();
    return;
  }
  if (senha !== senha2) {
    toast("As senhas não conferem.", "erro");
    document.getElementById("senha2").focus();
    return;
  }

  const novoUsuario = { nome, email, login, senha, tipo };

  if (tipo === "orgao") {
    const dadosOrgao = Object.fromEntries(CAMPOS_ORGAO.map((id) => [id, valor(id)]));
    if (Object.values(dadosOrgao).some((v) => !v)) {
      toast("Preencha todos os campos do órgão público.", "erro");
      return;
    }
    Object.assign(novoUsuario, dadosOrgao);
  }

  try {
    // Login/e-mail repetidos, validações e o status inicial são decididos pelo servidor.
    const { usuario } = await comBotaoOcupado(botao, "Cadastrando…", () =>
      apiFetch("/auth/cadastro", { method: "POST", body: novoUsuario })
    );

    toastDepois(
      usuario.status === "pendente"
        ? "Cadastro feito! Seu acesso de órgão público será liberado após aprovação de um administrador."
        : "Cadastro feito! Agora é só entrar.",
      "sucesso"
    );
    window.location.href = "login.html";
  } catch (erro) {
    console.error("Erro no cadastro:", erro);
    toast(erro.message, "erro");
  }
}
