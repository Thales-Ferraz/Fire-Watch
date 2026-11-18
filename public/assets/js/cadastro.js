document.addEventListener("DOMContentLoaded", () => {
  const tipoUsuario = document.getElementById("tipo");
  const camposOrgao = document.getElementById("camposOrgao");
  const form = document.getElementById("formCadastro");

  if (tipoUsuario && camposOrgao) {
    tipoUsuario.addEventListener("change", () => {
      camposOrgao.style.display =
        tipoUsuario.value === "orgao" ? "block" : "none";
    });

    camposOrgao.style.display =
      tipoUsuario.value === "orgao" ? "block" : "none";
  }

  if (form) {
    form.addEventListener("submit", cadastrarUsuario);
  }
});

async function cadastrarUsuario(event) {
  event.preventDefault();

  const nome = document.getElementById("nome").value.trim();
  const email = document.getElementById("email").value.trim();
  const login = document.getElementById("login").value.trim();
  const senha = document.getElementById("senha").value;
  const senha2 = document.getElementById("senha2").value;
  const tipo = document.getElementById("tipo").value;
  const botao = event.target.querySelector("button[type=submit]");

  if (!nome || !email || !login || !senha || !senha2 || !tipo) {
    alert("Preencha todos os campos obrigatórios.");
    return;
  }

  if (senha.length < 6) {
    alert("A senha precisa ter pelo menos 6 caracteres.");
    return;
  }

  if (senha !== senha2) {
    alert("As senhas não conferem.");
    return;
  }

  const novoUsuario = { nome, email, login, senha, tipo };

  // se for órgão, exige campos extras
  if (tipo === "orgao") {
    const orgao = document.getElementById("orgao").value.trim();
    const cargo = document.getElementById("cargo").value.trim();
    const matricula = document.getElementById("matricula").value.trim();
    const emailInstitucional = document.getElementById("emailInstitucional").value.trim();

    if (!orgao || !cargo || !matricula || !emailInstitucional) {
      alert("Preencha todos os campos do órgão público.");
      return;
    }

    Object.assign(novoUsuario, { orgao, cargo, matricula, emailInstitucional });
  }

  if (botao) botao.disabled = true;
  try {
    // Login/e-mail repetidos, validações e o status inicial são decididos pelo servidor.
    const { usuario } = await apiFetch("/auth/cadastro", {
      method: "POST",
      body: novoUsuario,
    });

    alert(
      usuario.status === "pendente"
        ? "Cadastro realizado! Seu acesso de órgão público será liberado após aprovação de um administrador."
        : "Cadastro realizado com sucesso!"
    );
    window.location.href = "login.html";
  } catch (erro) {
    console.error("Erro no cadastro:", erro);
    alert(erro.message);
  } finally {
    if (botao) botao.disabled = false;
  }
}
