const API_URL = "https://fire-watch.onrender.com/usuarios";

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

  if (!nome || !email || !login || !senha || !senha2 || !tipo) {
    alert("Preencha todos os campos obrigatórios.");
    return;
  }

  if (senha !== senha2) {
    alert("As senhas não conferem.");
    return;
  }

  try {
    // verifica login repetido
    const respostaLogin = await fetch(`${API_URL}?login=${encodeURIComponent(login)}`);
    const usuariosMesmoLogin = await respostaLogin.json();

    if (usuariosMesmoLogin.length > 0) {
      alert("Já existe um usuário com esse login.");
      return;
    }

    // verifica email repetido
    const respostaEmail = await fetch(`${API_URL}?email=${encodeURIComponent(email)}`);
    const usuariosMesmoEmail = await respostaEmail.json();

    if (usuariosMesmoEmail.length > 0) {
      alert("Já existe um usuário com esse e-mail.");
      return;
    }

    const novoUsuario = {
      nome,
      email,
      login,
      senha,
      tipo,
      status: "aprovado",   // TODO MUNDO já entra aprovado
      primeiroLogin: true
    };

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

      novoUsuario.orgao = orgao;
      novoUsuario.cargo = cargo;
      novoUsuario.matricula = matricula;
      novoUsuario.emailInstitucional = emailInstitucional;
    }

    const resposta = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(novoUsuario)
    });

    if (!resposta.ok) {
      throw new Error("Erro ao salvar usuário.");
    }

    alert("Cadastro realizado com sucesso!");
    window.location.href = "login.html";

  } catch (erro) {
    console.error("Erro no cadastro:", erro);
    alert("Erro ao cadastrar usuário.");
  }
}