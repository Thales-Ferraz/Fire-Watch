// Componentes de interface usados em todas as páginas:
// avisos (toasts) no lugar de alert() e diálogo de confirmação no lugar de confirm().
// Depende de api.js (escapeHTML) e de base.css.

// ── Avisos ──────────────────────────────────

function containerToasts() {
  let c = document.getElementById("toasts");
  if (!c) {
    c = document.createElement("div");
    c.id = "toasts";
    c.className = "toasts";
    c.setAttribute("role", "status");
    c.setAttribute("aria-live", "polite");
    document.body.appendChild(c);
  }
  return c;
}

// tipo: "sucesso" | "erro" | "info"
function toast(mensagem, tipo = "info", duracao = 4500) {
  const el = document.createElement("div");
  el.className = `toast toast-${tipo}`;
  if (tipo === "erro") el.setAttribute("role", "alert");
  el.innerHTML = `
    <span class="toast-icone">${icone(tipo === "sucesso" ? "check" : tipo === "erro" ? "alerta" : "info")}</span>
    <span class="toast-texto">${escapeHTML(mensagem)}</span>
    <button type="button" class="btn-icone" aria-label="Fechar aviso">${icone("fechar", "ico-sm")}</button>`;

  const fechar = () => {
    el.classList.add("saindo");
    setTimeout(() => el.remove(), 200);
  };
  el.querySelector("button").addEventListener("click", fechar);
  containerToasts().appendChild(el);
  if (duracao) setTimeout(fechar, duracao);
}

// Guarda um aviso para mostrar na PRÓXIMA página (ex.: "cadastro feito" → tela de login).
function toastDepois(mensagem, tipo = "info") {
  try {
    sessionStorage.setItem("fw_aviso", JSON.stringify({ mensagem, tipo }));
  } catch {
    // sem sessionStorage o aviso só não aparece
  }
}

document.addEventListener("DOMContentLoaded", () => {
  try {
    const aviso = JSON.parse(sessionStorage.getItem("fw_aviso"));
    sessionStorage.removeItem("fw_aviso");
    if (aviso) toast(aviso.mensagem, aviso.tipo, 7000);
  } catch {
    // ignora aviso inválido
  }
});

// ── Confirmação ─────────────────────────────

// Abre um diálogo e devolve uma Promise<boolean> (true = confirmou).
// Uso: if (!(await confirmar("Excluir esta denúncia?", { perigo: true }))) return;
function confirmar(mensagem, { titulo = "Confirmar", textoOk = "Confirmar", perigo = false } = {}) {
  return new Promise((resolve) => {
    const dialogo = document.createElement("dialog");
    dialogo.className = "dialogo";
    dialogo.setAttribute("aria-labelledby", "dialogoTitulo");
    dialogo.innerHTML = `
      <h2 class="dialogo-titulo" id="dialogoTitulo">${escapeHTML(titulo)}</h2>
      <p class="dialogo-texto">${escapeHTML(mensagem)}</p>
      <div class="dialogo-acoes">
        <button type="button" class="btn btn-fantasma" data-resposta="nao">Cancelar</button>
        <button type="button" class="btn ${perigo ? "btn-perigo" : "btn-primario"}" data-resposta="sim">
          ${escapeHTML(textoOk)}</button>
      </div>`;

    let resposta = false;
    dialogo.addEventListener("click", (e) => {
      const botao = e.target.closest("[data-resposta]");
      if (botao) {
        resposta = botao.dataset.resposta === "sim";
        dialogo.close();
      } else if (e.target === dialogo) {
        dialogo.close(); // clique fora
      }
    });
    // Esc também fecha (evento "close"), respondendo "não".
    dialogo.addEventListener("close", () => {
      dialogo.remove();
      resolve(resposta);
    });

    document.body.appendChild(dialogo);
    dialogo.showModal();
    // Foco começa no "Cancelar": evita confirmar sem querer com Enter.
    dialogo.querySelector('[data-resposta="nao"]').focus();
  });
}

// ── Botão "carregando" ──────────────────────

// Desabilita o botão e troca o texto enquanto a função roda.
async function comBotaoOcupado(botao, textoOcupado, funcao) {
  if (!botao) return funcao();
  const original = botao.innerHTML;
  botao.disabled = true;
  botao.textContent = textoOcupado;
  try {
    return await funcao();
  } finally {
    botao.disabled = false;
    botao.innerHTML = original;
  }
}
