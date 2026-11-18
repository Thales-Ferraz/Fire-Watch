// Fórum da comunidade.
// Rotas: #/forum (lista de tópicos) e #/forum/<id> (um tópico).
// Todo texto vindo de usuários passa por escapeHTML() antes de ir para o HTML.
// O autor de tópicos/posts/comentários é definido pelo servidor (a partir do token),
// e só o autor (ou um administrador) pode apagar o que escreveu.

// ── Utilitários ──────────────────────────────

function forumPodeApagar(item) {
  const u = getUsuarioLogado();
  return !!u && (isAdmin() || (item.autorId && item.autorId === u.id));
}

function forumExigirLogin(acao) {
  if (isLogado()) return true;
  toast(`Entre na sua conta para ${acao}.`, "erro");
  return false;
}

function forumPlural(n, palavra) {
  return `${n} ${palavra}${n !== 1 ? "s" : ""}`;
}

// ── Lista de tópicos ──────────────────────────

async function abrirForum() {
  const mainContent = document.querySelector(".content");
  if (!mainContent) return;

  mainContent.innerHTML = `
    <h2 class="titulo-pagina">Fórum da comunidade</h2>
    <p class="pagina-intro">Troque informações sobre focos de incêndio na sua região.</p>
    ${isLogado() ? `
    <form class="card forum-form" id="forumFormTopico">
      <label class="sr-only" for="forumTituloInput">Título do tópico</label>
      <input type="text" id="forumTituloInput" class="campo" placeholder="Título do tópico" maxlength="120" required />
      <label class="sr-only" for="forumDescricaoInput">Descrição do tópico</label>
      <textarea id="forumDescricaoInput" class="campo" placeholder="Descreva o assunto do tópico..." rows="3" maxlength="2000" required></textarea>
      <button type="submit" class="btn btn-primario">Criar Tópico</button>
    </form>` : `
    <p class="card forum-form">
      <span><a href="login.html">Entre na sua conta</a> para criar tópicos e participar das conversas.</span>
    </p>`}
    <div id="forumListaTopicos"><p class="carregando">Carregando tópicos…</p></div>
  `;

  document.getElementById("forumFormTopico")?.addEventListener("submit", forumCriarTopico);
  await forumCarregarTopicos();
}

async function forumCarregarTopicos() {
  const lista = document.getElementById("forumListaTopicos");
  if (!lista) return;

  try {
    const topicos = await apiFetch("/topicos");
    if (!document.getElementById("forumListaTopicos")) return; // trocou de tela

    if (!topicos.length) {
      lista.innerHTML = `<p class="estado-vazio">Nenhum tópico criado ainda. Seja o primeiro!</p>`;
      return;
    }

    lista.innerHTML = topicos.slice().reverse().map((t) => {
      const qtd = Array.isArray(t.posts) ? t.posts.length : 0;
      const id = escapeHTML(t.id);
      return `
        <article class="card forum-item">
          <div class="forum-item-topo">
            <h3 class="forum-titulo">${escapeHTML(t.titulo)}</h3>
            <span class="forum-data">${escapeHTML(t.dataCriacao)}</span>
          </div>
          <p class="forum-texto">${escapeHTML(t.descricao)}</p>
          <div class="forum-rodape">
            <span class="forum-autor"><span class="avatar" aria-hidden="true">${escapeHTML((t.autor || "?")[0].toUpperCase())}</span> ${escapeHTML(t.autor)} <span class="chip">${icone("topico", "ico-sm")} <span class="num">${qtd}</span> ${qtd === 1 ? "post" : "posts"}</span></span>
            <div class="forum-acoes">
              <a class="btn btn-secundario btn-sm" href="#/forum/${encodeURIComponent(t.id)}">Abrir ${icone("proximo")}</a>
              ${forumPodeApagar(t) ? `
                <button type="button" class="btn btn-fantasma btn-sm" data-apagar-topico="${id}">Apagar</button>` : ""}
            </div>
          </div>
        </article>`;
    }).join("");

    lista.querySelectorAll("[data-apagar-topico]").forEach((b) =>
      b.addEventListener("click", () => forumApagarTopico(b.dataset.apagarTopico, b))
    );
  } catch (e) {
    console.error(e);
    lista.innerHTML = `<p class="estado-erro">Erro ao carregar tópicos: ${escapeHTML(e.message)}</p>`;
  }
}

async function forumCriarTopico(event) {
  event.preventDefault();
  const tituloEl = document.getElementById("forumTituloInput");
  const descEl = document.getElementById("forumDescricaoInput");
  const titulo = tituloEl.value.trim();
  const descricao = descEl.value.trim();
  if (!titulo || !descricao) { toast("Preencha o título e a descrição.", "erro"); return; }
  if (!forumExigirLogin("criar um tópico")) return;

  try {
    await comBotaoOcupado(event.target.querySelector("button[type=submit]"), "Criando…", () =>
      apiFetch("/topicos", { method: "POST", body: { titulo, descricao } })
    );
    tituloEl.value = "";
    descEl.value = "";
    toast("Tópico criado.", "sucesso");
    await forumCarregarTopicos();
  } catch (e) {
    toast(e.message, "erro");
  }
}

async function forumApagarTopico(idTopico, botao) {
  const ok = await confirmar("O tópico e todos os posts dele serão apagados.", {
    titulo: "Apagar tópico?", textoOk: "Apagar", perigo: true,
  });
  if (!ok) return;
  try {
    await comBotaoOcupado(botao, "Apagando…", () =>
      apiFetch(`/topicos/${encodeURIComponent(idTopico)}`, { method: "DELETE" })
    );
    toast("Tópico apagado.", "sucesso");
    await forumCarregarTopicos();
  } catch (e) {
    toast(e.message, "erro");
  }
}

// ── Um tópico ─────────────────────────────────

async function forumAbrirTopico(idTopico) {
  const mainContent = document.querySelector(".content");
  if (!mainContent) return;
  mainContent.innerHTML = `<p class="carregando">Carregando tópico…</p>`;

  try {
    const topico = await apiFetch(`/topicos/${encodeURIComponent(idTopico)}`);
    if (rotaAtual() !== "forum") return;

    mainContent.innerHTML = `
      <a class="btn btn-fantasma btn-sm voltar" href="#/forum">${icone("voltar")} Voltar ao fórum</a>

      <section class="card forum-topico-cabecalho">
        <h2>${escapeHTML(topico.titulo)}</h2>
        <p class="forum-texto">${escapeHTML(topico.descricao)}</p>
        <span class="forum-data">Criado em ${escapeHTML(topico.dataCriacao)} por ${escapeHTML(topico.autor)}</span>
      </section>

      ${isLogado() ? `
      <h3 class="forum-subtitulo">Novo Post</h3>
      <form class="card forum-form" id="forumFormPost">
        <label class="sr-only" for="forumNovoPostMensagem">Mensagem</label>
        <textarea id="forumNovoPostMensagem" class="campo" placeholder="Escreva sua publicação..." rows="4" maxlength="2000" required></textarea>
        <button type="submit" class="btn btn-primario">Publicar</button>
      </form>` : `
      <p class="card forum-form"><span><a href="login.html">Entre na sua conta</a> para publicar.</span></p>`}

      <h3 class="forum-subtitulo">Posts do Tópico</h3>
      <div id="forumListaPosts"></div>
    `;

    document.getElementById("forumFormPost")?.addEventListener("submit", (e) => forumCriarPost(e, topico.id));
    forumRenderPosts(topico.id, topico.posts || []);
  } catch (e) {
    console.error(e);
    mainContent.innerHTML = `
      <a class="btn btn-fantasma btn-sm voltar" href="#/forum">${icone("voltar")} Voltar ao fórum</a>
      <p class="estado-erro">${escapeHTML(e.message)}</p>`;
  }
}

function forumRenderPosts(idTopico, posts) {
  const listaPosts = document.getElementById("forumListaPosts");
  if (!listaPosts) return;

  if (!posts || !posts.length) {
    listaPosts.innerHTML = `<p class="estado-vazio">Nenhum post criado ainda.</p>`;
    return;
  }

  listaPosts.innerHTML = posts.map((post) => {
    const pId = escapeHTML(post.id);
    const comentarios = post.comentarios || [];
    const comentariosHTML = comentarios.map((c) => `
      <div class="comentario">
        <div class="avatar" aria-hidden="true">${escapeHTML((c.autor || "?")[0].toUpperCase())}</div>
        <div class="comentario-corpo">
          <div class="comentario-autor">${escapeHTML(c.autor)}</div>
          <div class="comentario-texto">${escapeHTML(c.texto)}</div>
        </div>
      </div>`).join("");

    return `
      <article class="card forum-item" data-post="${pId}">
        <div class="forum-item-topo">
          <span class="forum-titulo">${escapeHTML(post.autor)}</span>
          <span class="forum-data">${escapeHTML(post.data)}</span>
        </div>
        <p class="forum-post-texto">${escapeHTML(post.mensagem)}</p>
        <div class="forum-acoes">
          <button type="button" class="btn btn-fantasma btn-sm" data-acao="toggle"
                  aria-expanded="false" aria-controls="comentarios-${pId}">
            ${icone("resposta")} Respostas (<span class="num">${comentarios.length}</span>)</button>
          ${forumPodeApagar(post) ? `
            <button type="button" class="btn btn-fantasma btn-sm" data-acao="apagar">Apagar</button>` : ""}
        </div>
        <div class="comentarios" id="comentarios-${pId}" hidden>
          ${comentariosHTML}
          ${isLogado() ? `
          <form class="comentario-novo" data-acao="responder">
            <label class="sr-only" for="resposta-${pId}">Responder publicação</label>
            <input type="text" id="resposta-${pId}" class="campo" maxlength="1000" placeholder="Responder publicação..." required />
            <button type="submit" class="btn btn-secundario btn-sm">Responder</button>
          </form>` : ""}
        </div>
      </article>`;
  }).join("");

  listaPosts.querySelectorAll("[data-post]").forEach((card) => {
    const postId = card.dataset.post;
    card.querySelector('[data-acao="toggle"]').addEventListener("click", (e) => forumToggleComentarios(card, e.currentTarget));
    card.querySelector('[data-acao="apagar"]')?.addEventListener("click", (e) => forumApagarPost(idTopico, postId, e.currentTarget));
    card.querySelector('form[data-acao="responder"]')?.addEventListener("submit", (e) => forumAdicionarComentario(e, idTopico, postId));
  });
}

function forumToggleComentarios(card, botao) {
  const area = card.querySelector(".comentarios");
  area.hidden = !area.hidden;
  botao.setAttribute("aria-expanded", String(!area.hidden));
}

function forumAbrirComentarios(postId) {
  const card = [...document.querySelectorAll("[data-post]")].find((c) => c.dataset.post === String(postId));
  if (!card) return;
  card.querySelector(".comentarios").hidden = false;
  card.querySelector('[data-acao="toggle"]').setAttribute("aria-expanded", "true");
}

async function forumCriarPost(event, idTopico) {
  event.preventDefault();
  const campo = document.getElementById("forumNovoPostMensagem");
  const mensagem = campo.value.trim();
  if (!mensagem) { toast("Escreva uma mensagem antes de publicar.", "erro"); return; }
  if (!forumExigirLogin("publicar")) return;

  try {
    const topico = await comBotaoOcupado(event.target.querySelector("button[type=submit]"), "Publicando…", () =>
      apiFetch(`/topicos/${encodeURIComponent(idTopico)}/posts`, { method: "POST", body: { mensagem } })
    );
    campo.value = "";
    forumRenderPosts(topico.id, topico.posts);
    toast("Post publicado.", "sucesso");
  } catch (e) {
    console.error(e);
    toast(e.message, "erro");
  }
}

async function forumAdicionarComentario(event, idTopico, postId) {
  event.preventDefault();
  const input = event.target.querySelector("input");
  const texto = input.value.trim();
  if (!texto) { toast("Digite um comentário.", "erro"); return; }
  if (!forumExigirLogin("responder")) return;

  try {
    const topico = await comBotaoOcupado(event.target.querySelector("button[type=submit]"), "Enviando…", () =>
      apiFetch(
        `/topicos/${encodeURIComponent(idTopico)}/posts/${encodeURIComponent(postId)}/comentarios`,
        { method: "POST", body: { texto } }
      )
    );
    forumRenderPosts(topico.id, topico.posts);
    forumAbrirComentarios(postId);
  } catch (e) {
    console.error(e);
    toast(e.message, "erro");
  }
}

async function forumApagarPost(idTopico, postId, botao) {
  const ok = await confirmar("O post e as respostas dele serão apagados.", {
    titulo: "Apagar post?", textoOk: "Apagar", perigo: true,
  });
  if (!ok) return;
  try {
    const topico = await comBotaoOcupado(botao, "Apagando…", () =>
      apiFetch(`/topicos/${encodeURIComponent(idTopico)}/posts/${encodeURIComponent(postId)}`, { method: "DELETE" })
    );
    forumRenderPosts(topico.id, topico.posts);
    toast("Post apagado.", "sucesso");
  } catch (e) {
    console.error(e);
    toast(e.message, "erro");
  }
}
