function setNav(el) {
  document
    .querySelectorAll(".nav-item")
    .forEach((i) => i.classList.remove("active"));
  if (el.classList.contains("nav-item")) el.classList.add("active");
}

// Funções para controle do Modal
async function abrirModal() {
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

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Se o usuário digitou mas não clicou em uma sugestão válida da lista do Mapbox
    if (!longitudeSelecionada || !latitudeSelecionada) {
        alert("Por favor, selecione uma localização válida na lista de sugestões do mapa.");
        return;
    }

    if (!isLogado()) {
      alert("Faça login para enviar uma denúncia.");
      return;
    }

    const gravidadeSelecionada = document.querySelector('input[name="gravidade"]:checked');

    /* FOTO */
    let fotoBase64 = null;
const fotoInput = document.getElementById("foto");
if (fotoInput && fotoInput.files[0]) {
  fotoBase64 = await new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxSize = 800;
        let width = img.width;
        let height = img.height;

        // Redimensiona mantendo proporção
        if (width > height && width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        } else if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }

        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);

        // Comprime para JPEG com 70% de qualidade
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
    };

    reader.readAsDataURL(fotoInput.files[0]);
  });
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
      window.location.reload(); // Recarrega a página para atualizar o mapa principal
    } catch (erro) {
      console.error(erro);
      alert(erro.message);
    }
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
