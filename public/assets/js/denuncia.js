// Formulário de nova denúncia, aberto num <dialog> (Esc fecha, o foco fica preso
// dentro do formulário e volta ao botão que abriu quando ele fecha).

let denunciaHtml = null; // denuncia.html fica em cache depois da 1ª vez

async function abrirModal() {
  if (!isLogado()) {
    const ir = await confirmar("Você precisa entrar na sua conta para fazer uma denúncia.", {
      titulo: "Entrar para denunciar",
      textoOk: "Ir para o login",
    });
    if (ir) window.location.href = "login.html";
    return;
  }

  const modal = document.getElementById("modalDenuncia");
  const conteudo = document.getElementById("conteudoModal");

  try {
    if (!denunciaHtml) {
      const resposta = await fetch("denuncia.html");
      if (!resposta.ok) throw new Error();
      denunciaHtml = await resposta.text();
    }
  } catch {
    toast("Não foi possível abrir o formulário. Tente novamente.", "erro");
    return;
  }

  conteudo.innerHTML = denunciaHtml;
  inicializarFormulario();
  if (!modal.open) modal.showModal();
  document.getElementById("data")?.focus();
}

function fecharModal() {
  const modal = document.getElementById("modalDenuncia");
  if (modal?.open) modal.close();
}

function inicializarFormulario() {
  const form = document.getElementById("formDenuncia");
  if (!form) return;

  const searchBox = document.getElementById("local-busca");
  searchBox.accessToken = MAPBOX_TOKEN; // token centralizado em config.js
  const ajudaLocal = document.getElementById("ajudaLocal");

  // A data do foco começa em "hoje" e não pode ser no futuro.
  const campoData = document.getElementById("data");
  campoData.max = hojeLocal();
  campoData.value = hojeLocal();

  // Coordenadas do endereço escolhido na lista do Mapbox
  let local = null;

  searchBox.addEventListener("retrieve", (event) => {
    const feature = event.detail.features[0];
    local = {
      nome: feature.properties.full_address || feature.properties.name,
      longitude: feature.geometry.coordinates[0],
      latitude: feature.geometry.coordinates[1],
    };
    ajudaLocal.innerHTML = `${icone("check", "ico-sm")} ${escapeHTML(local.nome)}`;
    ajudaLocal.classList.add("ok");
  });

  // Se apagar o endereço, a seleção anterior deixa de valer.
  searchBox.addEventListener("clear", () => {
    local = null;
    ajudaLocal.textContent = "Digite o endereço e escolha uma opção da lista.";
    ajudaLocal.classList.remove("ok");
  });

  // Mostra o nome da foto escolhida no campo de foto.
  const fotoInputCampo = document.getElementById("foto");
  const fotoNome = document.getElementById("fotoNome");
  fotoInputCampo.addEventListener("change", () => {
    const arquivo = fotoInputCampo.files[0];
    fotoNome.textContent = arquivo ? arquivo.name : "Toque para tirar ou escolher uma foto";
    fotoNome.closest(".campo-foto").classList.toggle("ok", !!arquivo);
  });

  const botaoEnviar = form.querySelector("button[type=submit]");
  let enviando = false;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (enviando) return; // evita denúncia duplicada com duplo clique

    if (!local) {
      toast("Escolha o local do foco na lista de sugestões.", "erro");
      searchBox.querySelector("input")?.focus();
      return;
    }
    if (!campoData.value || campoData.value > hojeLocal()) {
      toast("Informe uma data válida (não pode ser no futuro).", "erro");
      campoData.focus();
      return;
    }

    const gravidade = form.querySelector('input[name="gravidade"]:checked')?.value || "Baixa";
    const fotoInput = document.getElementById("foto");

    enviando = true;
    try {
      await comBotaoOcupado(botaoEnviar, "Enviando…", async () => {
        const foto = fotoInput.files[0] ? await comprimirFoto(fotoInput.files[0]) : null;

        // O autor e o status inicial ("Pendente") são definidos pelo servidor, a partir do token.
        await apiFetch("/denuncias", {
          method: "POST",
          body: {
            local: local.nome,
            data: campoData.value,
            horario: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
            gravidade,
            descricao: document.getElementById("descricao").value,
            foto,
            longitude: local.longitude,
            latitude: local.latitude,
          },
        });
      });

      fecharModal();
      toast("Denúncia enviada! Obrigado por ajudar.", "sucesso");
      // Atualiza a tela atual sem recarregar a página.
      if (rotaAtual() === "dashboard") atualizarDashboard();
      if (rotaAtual() === "historico") abrirHistorico();
    } catch (erro) {
      console.error(erro);
      toast(erro.message, "erro");
    } finally {
      enviando = false;
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

// Fecha o formulário ao clicar fora dele (no fundo escuro).
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("modalDenuncia");
  if (!modal) return;
  modal.addEventListener("click", (e) => {
    if (e.target === modal) fecharModal();
  });
});
