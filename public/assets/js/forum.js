// Fórum da comunidade.
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
  alert(`Você precisa estar logado para ${acao}.`);
  return false;
}

// Usa data-attributes para evitar IDs string quebrando onclick inline
function forumBindEventos(contexto) {
  contexto.querySelectorAll("[data-forum-action]").forEach(el => {
    el.addEventListener("click", e => {
      e.preventDefault();
      const action  = el.dataset.forumAction;
      const topicId = el.dataset.topicId;
      const postId  = el.dataset.postId || null;

      if (action === "entrar")             forumAbrirTopico(topicId);
      if (action === "apagar-topico")      forumApagarTopico(topicId);
      if (action === "toggle-comentarios") forumToggleComentarios(postId);
      if (action === "apagar-post")        forumApagarPost(topicId, postId);
      if (action === "responder")          forumAdicionarComentario(topicId, postId);
    });
  });

  contexto.querySelectorAll("[data-comentario-input]").forEach(input => {
    input.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        forumAdicionarComentario(input.dataset.topicId, input.dataset.comentarioInput);
      }
    });
  });
}

// ── Entrada principal ─────────────────────────

async function abrirForum() {
  const mainContent = document.querySelector(".content");
  if (!mainContent) return;

  mainContent.innerHTML = `
    <div style="padding: 4px 0 20px;">
      <h2 style="font-size: 18px; font-weight: 700; color: #fff; margin-bottom: 20px;">
        💬 Fórum da Comunidade
      </h2>
      <div style="background:#161819;border:1px solid #2a2d30;border-radius:10px;
                  padding:20px;margin-bottom:24px;display:flex;flex-direction:column;gap:12px;">
        <input type="text" id="forumTituloInput" placeholder="Título do tópico" maxlength="120"
          style="background:#1e2022;border:1px solid #2a2d30;border-radius:6px;color:#fff;
                 font-size:14px;padding:10px 12px;outline:none;"
          onfocus="this.style.borderColor='#ff5c1a'" onblur="this.style.borderColor='#2a2d30'"/>
        <textarea id="forumDescricaoInput" placeholder="Descreva o assunto do tópico..." rows="3" maxlength="2000"
          style="background:#1e2022;border:1px solid #2a2d30;border-radius:6px;color:#fff;
                 font-size:14px;padding:10px 12px;outline:none;resize:none;font-family:inherit;"
          onfocus="this.style.borderColor='#ff5c1a'" onblur="this.style.borderColor='#2a2d30'"></textarea>
        <button id="btnCriarTopico"
          style="align-self:flex-end;background:#ff5c1a;color:#fff;border:none;border-radius:8px;
                 padding:9px 22px;font-size:14px;font-weight:600;cursor:pointer;"
          onmouseover="this.style.background='#e04a10'" onmouseout="this.style.background='#ff5c1a'">
          Criar Tópico</button>
      </div>
      <div id="forumListaTopicos"></div>
    </div>
  `;

  document.getElementById("btnCriarTopico").addEventListener("click", forumCriarTopico);
  await forumCarregarTopicos();
}

// ── Carregar tópicos ──────────────────────────

async function forumCarregarTopicos() {
  const lista = document.getElementById("forumListaTopicos");
  if (!lista) return;

  try {
    const topicos = await apiFetch("/topicos");

    if (!topicos.length) {
      lista.innerHTML = `<div style="text-align:center;padding:48px 0;color:#8a9099;font-size:14px;">
        Nenhum tópico criado ainda. Seja o primeiro!</div>`;
      return;
    }

    lista.innerHTML = topicos.slice().reverse().map(t => {
      const qtd = Array.isArray(t.posts) ? t.posts.length : 0;
      const id = escapeHTML(t.id);
      return `
        <div style="background:#161819;border:1px solid #2a2d30;border-radius:10px;
                    padding:18px 20px;margin-bottom:14px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;
                      gap:12px;margin-bottom:10px;">
            <span style="font-size:15px;font-weight:600;color:#ff8c42;">📁 ${escapeHTML(t.titulo)}</span>
            <span style="font-size:12px;color:#8a9099;white-space:nowrap;">${escapeHTML(t.dataCriacao)}</span>
          </div>
          <p style="font-size:13px;color:#8a9099;line-height:1.5;margin-bottom:14px;">${escapeHTML(t.descricao)}</p>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
            <span style="font-size:11px;background:#1e2022;color:#8a9099;padding:4px 8px;
                         border-radius:4px;border:1px solid #2a2d30;">
              💬 ${qtd} post${qtd !== 1 ? "s" : ""} · por ${escapeHTML(t.autor)}
            </span>
            <div style="display:flex;gap:8px;">
              <button data-forum-action="entrar" data-topic-id="${id}"
                style="background:#2a1200;color:#ff5c1a;border:1px solid #6b2000;border-radius:6px;
                       padding:7px 16px;font-size:12px;font-weight:600;cursor:pointer;"
                onmouseover="this.style.background='#3a1a00'" onmouseout="this.style.background='#2a1200'">
                Entrar</button>
              ${forumPodeApagar(t) ? `
                <button data-forum-action="apagar-topico" data-topic-id="${id}"
                  style="background:#1e2022;color:#8a9099;border:1px solid #2a2d30;border-radius:6px;
                         padding:7px 14px;font-size:12px;font-weight:600;cursor:pointer;"
                  onmouseover="this.style.background='#2a0000';this.style.color='#ff3b3b';this.style.borderColor='#ff3b3b'"
                  onmouseout="this.style.background='#1e2022';this.style.color='#8a9099';this.style.borderColor='#2a2d30'">
                  Apagar</button>` : ""}
            </div>
          </div>
        </div>`;
    }).join("");

    forumBindEventos(lista);

  } catch (e) {
    console.error(e);
    lista.innerHTML = `<p style="color:#ff3b3b;text-align:center;padding:20px;">
      ⚠️ Erro ao carregar tópicos: ${escapeHTML(e.message)}</p>`;
  }
}

// ── Criar tópico ──────────────────────────────

async function forumCriarTopico() {
  const titulo    = document.getElementById("forumTituloInput")?.value.trim();
  const descricao = document.getElementById("forumDescricaoInput")?.value.trim();
  if (!titulo || !descricao) { alert("Preencha o título e a descrição."); return; }
  if (!forumExigirLogin("criar um tópico")) return;

  try {
    await apiFetch("/topicos", { method: "POST", body: { titulo, descricao } });
    document.getElementById("forumTituloInput").value    = "";
    document.getElementById("forumDescricaoInput").value = "";
    await forumCarregarTopicos();
  } catch (e) {
    alert(e.message);
  }
}

// ── Apagar tópico ─────────────────────────────

async function forumApagarTopico(idTopico) {
  if (!confirm("Deseja realmente apagar este tópico?")) return;
  try {
    await apiFetch(`/topicos/${encodeURIComponent(idTopico)}`, { method: "DELETE" });
    await forumCarregarTopicos();
  } catch (e) {
    alert(e.message);
  }
}

// ── Abrir tópico ──────────────────────────────

async function forumAbrirTopico(idTopico) {
  const mainContent = document.querySelector(".content");
  if (!mainContent) return;

  try {
    const topico = await apiFetch(`/topicos/${encodeURIComponent(idTopico)}`);

    mainContent.innerHTML = `
      <div style="padding:4px 0 20px;">
        <button id="btnVoltarForum"
          style="background:transparent;border:1px solid #2a2d30;color:#c4c8cd;
                 padding:6px 12px;border-radius:6px;cursor:pointer;font-size:13px;margin-bottom:20px;"
          onmouseover="this.style.borderColor='#ff5c1a';this.style.color='#ff5c1a'"
          onmouseout="this.style.borderColor='#2a2d30';this.style.color='#c4c8cd'">
          ← Voltar ao Fórum</button>

        <div style="background:#161819;border:1px solid #2a2d30;border-radius:10px;
                    padding:20px;margin-bottom:24px;">
          <h2 style="color:#ff8c42;font-size:18px;margin-bottom:8px;">📁 ${escapeHTML(topico.titulo)}</h2>
          <p style="color:#8a9099;font-size:13px;margin-bottom:4px;">${escapeHTML(topico.descricao)}</p>
          <span style="font-size:11px;color:#8a9099;">
            Criado em: ${escapeHTML(topico.dataCriacao)} por ${escapeHTML(topico.autor)}</span>
        </div>

        <h3 style="font-size:14px;color:#c4c8cd;margin-bottom:12px;font-weight:600;">Novo Post</h3>
        <div style="background:#161819;border:1px solid #2a2d30;border-radius:10px;
                    padding:20px;margin-bottom:24px;display:flex;flex-direction:column;gap:12px;">
          <textarea id="forumNovoPostMensagem" placeholder="Escreva sua publicação..." rows="4" maxlength="2000"
            style="background:#1e2022;border:1px solid #2a2d30;border-radius:6px;color:#fff;
                   font-size:14px;padding:10px 12px;outline:none;resize:none;font-family:inherit;"
            onfocus="this.style.borderColor='#ff5c1a'" onblur="this.style.borderColor='#2a2d30'"></textarea>
          <button id="btnPublicar"
            style="align-self:flex-end;background:#ff5c1a;color:#fff;border:none;border-radius:8px;
                   padding:9px 22px;font-size:14px;font-weight:600;cursor:pointer;"
            onmouseover="this.style.background='#e04a10'" onmouseout="this.style.background='#ff5c1a'">
            Publicar</button>
        </div>

        <h3 style="font-size:14px;color:#c4c8cd;margin-bottom:12px;font-weight:600;">Posts do Tópico</h3>
        <div id="forumListaPosts"></div>
      </div>
    `;

    document.getElementById("btnVoltarForum").addEventListener("click", abrirForum);
    document.getElementById("btnPublicar").addEventListener("click", () => forumCriarPost(topico.id));
    forumRenderPosts(topico.id, topico.posts || []);

  } catch (e) {
    console.error(e);
    mainContent.innerHTML = `
      <p style="color:#ff3b3b;padding:20px;">⚠️ ${escapeHTML(e.message)}
        <button id="btnVoltarErro" style="background:none;border:none;color:#ff5c1a;
                cursor:pointer;font-size:14px;">Voltar</button></p>`;
    document.getElementById("btnVoltarErro").addEventListener("click", abrirForum);
  }
}

// ── Renderizar posts ──────────────────────────

function forumRenderPosts(idTopico, posts) {
  const listaPosts = document.getElementById("forumListaPosts");
  if (!listaPosts) return;

  if (!posts || !posts.length) {
    listaPosts.innerHTML = `<p style="color:#8a9099;font-size:14px;padding:8px 0;">
      Nenhum post criado ainda.</p>`;
    return;
  }

  const tId = escapeHTML(idTopico);

  listaPosts.innerHTML = posts.map(post => {
    const pId = escapeHTML(post.id);
    const comentariosHTML = (post.comentarios || []).map(c => `
      <div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:10px;">
        <div style="width:28px;height:28px;border-radius:50%;background:#2a2d30;display:flex;
                    align-items:center;justify-content:center;font-size:11px;font-weight:700;
                    color:#c4c8cd;flex-shrink:0;">${escapeHTML((c.autor || "?")[0].toUpperCase())}</div>
        <div style="background:#1e2022;border-radius:8px;padding:8px 12px;flex:1;">
          <div style="font-size:12px;font-weight:600;color:#ff5c1a;margin-bottom:3px;">${escapeHTML(c.autor)}</div>
          <div style="font-size:13px;color:#8a9099;line-height:1.45;">${escapeHTML(c.texto)}</div>
        </div>
      </div>`).join("");

    return `
      <div style="background:#161819;border:1px solid #2a2d30;border-radius:10px;
                  padding:18px 20px;margin-bottom:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <span style="font-size:14px;font-weight:600;color:#ff8c42;">${escapeHTML(post.autor)}</span>
          <span style="font-size:12px;color:#8a9099;">${escapeHTML(post.data)}</span>
        </div>
        <p style="font-size:14px;color:#c4c8cd;line-height:1.55;margin-bottom:14px;white-space:pre-wrap;">${escapeHTML(post.mensagem)}</p>
        <div style="display:flex;gap:8px;margin-bottom:12px;">
          <button data-forum-action="toggle-comentarios" data-topic-id="${tId}" data-post-id="${pId}"
            style="background:none;border:1px solid #2a2d30;color:#8a9099;border-radius:6px;
                   padding:6px 14px;font-size:12px;font-weight:600;cursor:pointer;"
            onmouseover="this.style.color='#ff5c1a';this.style.borderColor='#ff5c1a'"
            onmouseout="this.style.color='#8a9099';this.style.borderColor='#2a2d30'">
            Ver respostas (${(post.comentarios || []).length})</button>
          ${forumPodeApagar(post) ? `
            <button data-forum-action="apagar-post" data-topic-id="${tId}" data-post-id="${pId}"
              style="background:none;border:1px solid #2a2d30;color:#8a9099;border-radius:6px;
                     padding:6px 14px;font-size:12px;font-weight:600;cursor:pointer;"
              onmouseover="this.style.color='#ff3b3b';this.style.borderColor='#ff3b3b'"
              onmouseout="this.style.color='#8a9099';this.style.borderColor='#2a2d30'">
              Apagar</button>` : ""}
        </div>
        <div data-comentarios-de="${pId}"
          style="display:none;border-top:1px solid #2a2d30;padding-top:14px;">
          ${comentariosHTML}
          <div style="display:flex;gap:8px;margin-top:10px;">
            <input type="text" maxlength="1000"
              data-comentario-input="${pId}" data-topic-id="${tId}"
              placeholder="Responder publicação..."
              style="flex:1;background:#1e2022;border:1px solid #2a2d30;border-radius:6px;
                     color:#fff;font-size:13px;padding:8px 12px;outline:none;font-family:inherit;"
              onfocus="this.style.borderColor='#ff5c1a'" onblur="this.style.borderColor='#2a2d30'"/>
            <button data-forum-action="responder" data-topic-id="${tId}" data-post-id="${pId}"
              style="background:#2a1200;color:#ff5c1a;border:1px solid #6b2000;border-radius:6px;
                     padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;"
              onmouseover="this.style.background='#3a1a00'" onmouseout="this.style.background='#2a1200'">
              Responder</button>
          </div>
        </div>
      </div>`;
  }).join("");

  forumBindEventos(listaPosts);
}

function forumAreaComentarios(postId) {
  return [...document.querySelectorAll("[data-comentarios-de]")]
    .find(el => el.dataset.comentariosDe === String(postId));
}

// ── Toggle comentários ────────────────────────

function forumToggleComentarios(postId) {
  const area = forumAreaComentarios(postId);
  if (!area) return;
  area.style.display = area.style.display === "none" ? "block" : "none";
}

// ── Criar post ────────────────────────────────

async function forumCriarPost(idTopico) {
  const mensagem = document.getElementById("forumNovoPostMensagem")?.value.trim();
  if (!mensagem) { alert("Escreva uma mensagem antes de publicar."); return; }
  if (!forumExigirLogin("publicar")) return;

  try {
    const topico = await apiFetch(`/topicos/${encodeURIComponent(idTopico)}/posts`, {
      method: "POST",
      body: { mensagem },
    });
    document.getElementById("forumNovoPostMensagem").value = "";
    forumRenderPosts(topico.id, topico.posts);
  } catch (e) {
    console.error(e);
    alert(e.message);
  }
}

// ── Adicionar comentário ──────────────────────

async function forumAdicionarComentario(idTopico, postId) {
  const input = [...document.querySelectorAll("[data-comentario-input]")]
    .find(el => el.dataset.comentarioInput === String(postId));
  const texto = input?.value.trim();
  if (!texto) { alert("Digite um comentário."); return; }
  if (!forumExigirLogin("responder")) return;

  try {
    const topico = await apiFetch(
      `/topicos/${encodeURIComponent(idTopico)}/posts/${encodeURIComponent(postId)}/comentarios`,
      { method: "POST", body: { texto } }
    );
    forumRenderPosts(topico.id, topico.posts);
    const area = forumAreaComentarios(postId);
    if (area) area.style.display = "block";
  } catch (e) {
    console.error(e);
    alert(e.message);
  }
}

// ── Apagar post ───────────────────────────────

async function forumApagarPost(idTopico, postId) {
  if (!confirm("Deseja apagar este post?")) return;
  try {
    const topico = await apiFetch(
      `/topicos/${encodeURIComponent(idTopico)}/posts/${encodeURIComponent(postId)}`,
      { method: "DELETE" }
    );
    forumRenderPosts(topico.id, topico.posts);
  } catch (e) {
    console.error(e);
    alert(e.message);
  }
}
