function setNav(el) {
  document
    .querySelectorAll(".nav-item")
    .forEach((i) => i.classList.remove("active"));
  if (el.classList.contains("nav-item")) el.classList.add("active");
}

// Funções para controle do Modal
async function abrirModal() {
  if (!isLogado()) {
    if (confirm("Você precisa entrar na sua conta para fazer uma denúncia. Ir para o login?")) {
      window.location.href = "login.html";
    }
    return;
  }

  const modal = document.getElementById("modalDenuncia");
  const conteudo = document.getElementById("conteudoModal");

  const resposta = await fetch("denuncia.html");
  const html = await resposta.text();

  conteudo.innerHTML = html;
  modal.classList.add("active");

  inicializarFormulario();
}

function fecharModal() {
  document.getElementById("modalDenuncia").classList.remove("active");
}

// Lógica de envio do formulário integrada

function inicializarFormulario() {
  const form = document.getElementById("formDenuncia");
  if (!form) return;

  const searchBox = document.getElementById("local-busca");
  searchBox.accessToken = MAPBOX_TOKEN; // token centralizado em config.js

  // A data do foco começa em "hoje" e não pode ser no futuro.
  const campoData = document.getElementById("data");
  campoData.max = hojeLocal();
  campoData.value = hojeLocal();

  // Variáveis para guardar as coordenadas que o Mapbox encontrar na lista
  let longitudeSelecionada = null;
  let latitudeSelecionada = null;
  let nomeLocalSelecionado = "";

  // Evento disparado AUTOMATICAMENTE quando o usuário clica em uma sugestão da lista
  searchBox.addEventListener('retrieve', (event) => {
      const feature = event.detail.features[0];
      
      // Captura o nome certinho do lugar e as coordenadas geográficas reais
      nomeLocalSelecionado = feature.properties.full_address || feature.properties.name;
      longitudeSelecionada = feature.geometry.coordinates[0];
      latitudeSelecionada = feature.geometry.coordinates[1];
      
      console.log("Local selecionado com sucesso:", nomeLocalSelecionado, longitudeSelecionada, latitudeSelecionada);
  });

  const botaoEnviar = form.querySelector("button[type=submit]");
  const textoBotao = botaoEnviar ? botaoEnviar.textContent : "";
  let enviando = false;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (enviando) return; // evita denúncia duplicada com duplo clique

    // Se o usuário digitou mas não clicou em uma sugestão válida da lista do Mapbox
    if (!longitudeSelecionada || !latitudeSelecionada) {
        alert("Por favor, selecione uma localização válida na lista de sugestões do mapa.");
        return;
    }

    if (!isLogado()) {
      alert("Faça login para enviar uma denúncia.");
      return;
    }

    if (!campoData.value || campoData.value > hojeLocal()) {
      alert("Informe uma data válida (não pode ser no futuro).");
      return;
    }

    const gravidadeSelecionada = document.querySelector('input[name="gravidade"]:checked');

    enviando = true;
    if (botaoEnviar) {
      botaoEnviar.disabled = true;
      botaoEnviar.textContent = "Enviando…";
    }

    /* FOTO */
    let fotoBase64 = null;
    const fotoInput = document.getElementById("foto");
    if (fotoInput && fotoInput.files[0]) {
      try {
        fotoBase64 = await comprimirFoto(fotoInput.files[0]);
      } catch (erro) {
        alert(erro.message);
        enviando = false;
        if (botaoEnviar) {
          botaoEnviar.disabled = false;
          botaoEnviar.textContent = textoBotao;
        }
        return;
      }
    }


    // O autor e o status inicial ("Pendente") são definidos pelo servidor, a partir do token.
    const dados = {
      local: nomeLocalSelecionado,
      data: document.getElementById("data").value,
      horario: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      gravidade: gravidadeSelecionada ? gravidadeSelecionada.value : "Baixa",
      descricao: document.getElementById("descricao").value,
      foto: fotoBase64,
      longitude: longitudeSelecionada,
      latitude: latitudeSelecionada
    };

    try {
      await apiFetch("/denuncias", { method: "POST", body: dados });
      alert("Denúncia cadastrada com sucesso!");
      form.reset();
      fecharModal();
      // Atualiza só os dados do dashboard (se estiver aberto), sem recarregar a página.
      atualizarDashboard();
    } catch (erro) {
      console.error(erro);
      alert(erro.message);
    } finally {
      enviando = false;
      if (botaoEnviar) {
        botaoEnviar.disabled = false;
        botaoEnviar.textContent = textoBotao;
      }
    }
  });
}

// Reduz a foto para no máximo 800px e converte para JPEG (qualidade 70%).
// Rejeita se o arquivo não for uma imagem que o navegador consiga abrir.
function comprimirFoto(arquivo) {
  return new Promise((resolve, reject) => {
    if (!arquivo.type.startsWith("image/")) {
      reject(new Error("O arquivo escolhido não é uma imagem."));
      return;
    }
    const url = URL.createObjectURL(arquivo);
    const img = new Image();
    img.onload = () => {
      const maxSize = 800;
      const escala = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * escala);
      canvas.height = Math.round(img.height * escala);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível ler a imagem escolhida."));
    };
    img.src = url;
  });
}

// Fecha o modal ao clicar fora dele (registrado uma única vez).
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("modalDenuncia");
  if (!modal) return;
  modal.addEventListener("click", (e) => {
    if (e.target === modal) fecharModal();
  });
});
