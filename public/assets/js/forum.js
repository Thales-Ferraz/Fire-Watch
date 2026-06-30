const FORUM_API = "https://fire-watch.onrender.com/topicos";
 
// ── Utilitários ──────────────────────────────
 
function forumGetUsuario() {
  try {
    return JSON.parse(sessionStorage.getItem("usuarioLogado")) || null;
  } catch {
    return null;
  }
}
 
function forumDataAgora() {
  return new Date().toLocaleString("pt-BR");
}
 
async function forumBuscarTopico(idTopico) {
  const r = await fetch(`${FORUM_API}/${idTopico}`);
  if (!r.ok) throw new Error("Tópico não encontrado.");
  return r.json();
}
 
async function forumSalvarTopico(idTopico, dados) {
  const r = await fetch(`${FORUM_API}/${idTopico}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
  if (!r.ok) throw new Error("Erro ao salvar tópico.");
  return r.json();
}
 
// Usa data-attributes para evitar IDs string quebrando onclick inline
function forumBindEventos(contexto) {
  contexto.querySelectorAll("[data-forum-action]").forEach(el => {
    el.addEventListener("click", e => {
      e.preventDefault();
      const action  = el.dataset.forumAction;
      const topicId = el.dataset.topicId;
      const postId  = el.dataset.postId ? Number(el.dataset.postId) : null;
 
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
        forumAdicionarComentario(input.dataset.topicId, Number(input.dataset.comentarioInput));
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
          onfocus="this.style.borderColor=\'#ff5c1a\'" onblur="this.style.borderColor=\'#2a2d30\'"/>
        <textarea id="forumDescricaoInput" placeholder="Descreva o assunto do tópico..." rows="3"
          style="background:#1e2022;border:1px solid #2a2d30;border-radius:6px;color:#fff;
                 font-size:14px;padding:10px 12px;outline:none;resize:none;font-family:inherit;"
          onfocus="this.style.borderColor=\'#ff5c1a\'" onblur="this.style.borderColor=\'#2a2d30\'"></textarea>
        <button id="btnCriarTopico"
          style="align-self:flex-end;background:#ff5c1a;color:#fff;border:none;border-radius:8px;
                 padding:9px 22px;font-size:14px;font-weight:600;cursor:pointer;"
          onmouseover="this.style.background=\'#e04a10\'" onmouseout="this.style.background=\'#ff5c1a\'">
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
    const r = await fetch(FORUM_API);
    if (!r.ok) throw new Error();
    const topicos = await r.json();
 
    if (!topicos.length) {
      lista.innerHTML = `<div style="text-align:center;padding:48px 0;color:#45494d;font-size:14px;">
        Nenhum tópico criado ainda. Seja o primeiro!</div>`;
      return;
    }
 
    lista.innerHTML = topicos.slice().reverse().map(t => {
      const qtd = Array.isArray(t.posts) ? t.posts.length : 0;
      return `
        <div style="background:#161819;border:1px solid #2a2d30;border-radius:10px;
                    padding:18px 20px;margin-bottom:14px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;
                      gap:12px;margin-bottom:10px;">
            <span style="font-size:15px;font-weight:600;color:#ff8c42;">📁 ${t.titulo}</span>
            <span style="font-size:12px;color:#45494d;white-space:nowrap;">${t.dataCriacao}</span>
          </div>
          <p style="font-size:13px;color:#8a9099;line-height:1.5;margin-bottom:14px;">${t.descricao}</p>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
            <span style="font-size:11px;background:#1e2022;color:#45494d;padding:4px 8px;
                         border-radius:4px;border:1px solid #2a2d30;">
              💬 ${qtd} post${qtd !== 1 ? "s" : ""}
            </span>
            <div style="display:flex;gap:8px;">
              <button data-forum-action="entrar" data-topic-id="${t.id}"
                style="background:#2a1200;color:#ff5c1a;border:1px solid #6b2000;border-radius:6px;
                       padding:7px 16px;font-size:12px;font-weight:600;cursor:pointer;"
                onmouseover="this.style.background=\'#3a1a00\'" onmouseout="this.style.background=\'#2a1200\'">
                Entrar</button>
                ${(() => {
                    const u = forumGetUsuario();
                    const nomeUsuario = u ? (u.nome || u.login) : null;
                    if (!nomeUsuario || t.autor !== nomeUsuario) return "";
                        return `
                            <button data-forum-action="apagar-topico" data-topic-id="${t.id}"
                            style="background:#1e2022;color:#8a9099;border:1px solid #2a2d30;border-radius:6px;
                            padding:7px 14px;font-size:12px;font-weight:600;cursor:pointer;"
                            onmouseover="this.style.background='#2a0000';this.style.color='#ff3b3b';this.style.borderColor='#ff3b3b'"
                            onmouseout="this.style.background='#1e2022';this.style.color='#8a9099';this.style.borderColor='#2a2d30'">
                            Apagar</button>
                            `;
                })()}
            </div>
          </div>
        </div>`;
    }).join("");
 
    forumBindEventos(lista);
 
  } catch (e) {
    console.error(e);
    lista.innerHTML = `<p style="color:#ff3b3b;text-align:center;padding:20px;">
      ⚠️ Erro ao carregar tópicos. Verifique se o servidor está rodando.</p>`;
  }
}
 
// ── Criar tópico ──────────────────────────────
 
async function forumCriarTopico() {
  const titulo    = document.getElementById("forumTituloInput")?.value.trim();
  const descricao = document.getElementById("forumDescricaoInput")?.value.trim();
  if (!titulo || !descricao) { alert("Preencha o título e a descrição."); return; }
 
  const usuario = forumGetUsuario();
  if (!usuario) { alert("Você precisa estar logado para criar um tópico."); return; }
 
  try {
    const r = await fetch(FORUM_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo, descricao,
        dataCriacao: forumDataAgora(),
        autor: usuario.nome || usuario.login,
        posts: []
      })
    });
    if (!r.ok) throw new Error();
    document.getElementById("forumTituloInput").value    = "";
    document.getElementById("forumDescricaoInput").value = "";
    await forumCarregarTopicos();
  } catch {
    alert("Erro ao criar tópico. Verifique se o servidor está rodando.");
  }
}
 
// ── Apagar tópico ─────────────────────────────
 
async function forumApagarTopico(idTopico) {
  if (!confirm("Deseja realmente apagar este tópico?")) return;
  try {
    const r = await fetch(`${FORUM_API}/${idTopico}`, { method: "DELETE" });
    if (!r.ok) throw new Error();
    await forumCarregarTopicos();
  } catch {
    alert("Erro ao apagar tópico.");
  }
}
 
// ── Abrir tópico ──────────────────────────────
 
async function forumAbrirTopico(idTopico) {
  const mainContent = document.querySelector(".content");
  if (!mainContent) return;
 
  try {
    const topico = await forumBuscarTopico(idTopico);
 
    mainContent.innerHTML = `
      <div style="padding:4px 0 20px;">
        <button id="btnVoltarForum"
          style="background:transparent;border:1px solid #2a2d30;color:#c4c8cd;
                 padding:6px 12px;border-radius:6px;cursor:pointer;font-size:13px;margin-bottom:20px;"
          onmouseover="this.style.borderColor=\'#ff5c1a\';this.style.color=\'#ff5c1a\'"
          onmouseout="this.style.borderColor=\'#2a2d30\';this.style.color=\'#c4c8cd\'">
          ← Voltar ao Fórum</button>
 
        <div style="background:#161819;border:1px solid #2a2d30;border-radius:10px;
                    padding:20px;margin-bottom:24px;">
          <h2 style="color:#ff8c42;font-size:18px;margin-bottom:8px;">📁 ${topico.titulo}</h2>
          <p style="color:#8a9099;font-size:13px;margin-bottom:4px;">${topico.descricao}</p>
          <span style="font-size:11px;color:#45494d;">Criado em: ${topico.dataCriacao}</span>
        </div>
 
        <h3 style="font-size:14px;color:#c4c8cd;margin-bottom:12px;font-weight:600;">Novo Post</h3>
        <div style="background:#161819;border:1px solid #2a2d30;border-radius:10px;
                    padding:20px;margin-bottom:24px;display:flex;flex-direction:column;gap:12px;">
          <textarea id="forumNovoPostMensagem" placeholder="Escreva sua publicação..." rows="4"
            style="background:#1e2022;border:1px solid #2a2d30;border-radius:6px;color:#fff;
                   font-size:14px;padding:10px 12px;outline:none;resize:none;font-family:inherit;"
            onfocus="this.style.borderColor=\'#ff5c1a\'" onblur="this.style.borderColor=\'#2a2d30\'"></textarea>
          <button id="btnPublicar"
            style="align-self:flex-end;background:#ff5c1a;color:#fff;border:none;border-radius:8px;
                   padding:9px 22px;font-size:14px;font-weight:600;cursor:pointer;"
            onmouseover="this.style.background=\'#e04a10\'" onmouseout="this.style.background=\'#ff5c1a\'">
            Publicar</button>
        </div>
 
        <h3 style="font-size:14px;color:#c4c8cd;margin-bottom:12px;font-weight:600;">Posts do Tópico</h3>
        <div id="forumListaPosts"></div>
      </div>
    `;
 
    document.getElementById("btnVoltarForum").addEventListener("click", abrirForum);
    document.getElementById("btnPublicar").addEventListener("click", () => forumCriarPost(idTopico));
    forumRenderPosts(idTopico, topico.posts || []);
 
  } catch (e) {
    console.error(e);
    mainContent.innerHTML = `
      <p style="color:#ff3b3b;padding:20px;">⚠️ Tópico não encontrado.
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
    listaPosts.innerHTML = `<p style="color:#45494d;font-size:14px;padding:8px 0;">
      Nenhum post criado ainda.</p>`;
    return;
  }
 
  listaPosts.innerHTML = posts.map(post => {
    const comentariosHTML = (post.comentarios || []).map(c => `
      <div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:10px;">
        <div style="width:28px;height:28px;border-radius:50%;background:#2a2d30;display:flex;
                    align-items:center;justify-content:center;font-size:11px;font-weight:700;
                    color:#c4c8cd;flex-shrink:0;">${(c.autor || "?")[0].toUpperCase()}</div>
        <div style="background:#1e2022;border-radius:8px;padding:8px 12px;flex:1;">
          <div style="font-size:12px;font-weight:600;color:#ff5c1a;margin-bottom:3px;">${c.autor}</div>
          <div style="font-size:13px;color:#8a9099;line-height:1.45;">${c.texto}</div>
        </div>
      </div>`).join("");
 
    return `
      <div style="background:#161819;border:1px solid #2a2d30;border-radius:10px;
                  padding:18px 20px;margin-bottom:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <span style="font-size:14px;font-weight:600;color:#ff8c42;">${post.autor}</span>
          <span style="font-size:12px;color:#45494d;">${post.data}</span>
        </div>
        <p style="font-size:14px;color:#c4c8cd;line-height:1.55;margin-bottom:14px;">${post.mensagem}</p>
        <div style="display:flex;gap:8px;margin-bottom:12px;">
          <button data-forum-action="toggle-comentarios" data-topic-id="${idTopico}" data-post-id="${post.id}"
            style="background:none;border:1px solid #2a2d30;color:#8a9099;border-radius:6px;
                   padding:6px 14px;font-size:12px;font-weight:600;cursor:pointer;"
            onmouseover="this.style.color=\'#ff5c1a\';this.style.borderColor=\'#ff5c1a\'"
            onmouseout="this.style.color=\'#8a9099\';this.style.borderColor=\'#2a2d30\'">
            Ver respostas (${(post.comentarios || []).length})</button>
          ${(() => {
            const u = forumGetUsuario();
            const nomeUsuario = u ? (u.nome || u.login) : null;
            if (!nomeUsuario || post.autor !== nomeUsuario) return "";
                return `
                    <button data-forum-action="apagar-post" data-topic-id="${idTopico}" data-post-id="${post.id}"
                        style="background:none;border:1px solid #2a2d30;color:#8a9099;border-radius:6px;
                        padding:6px 14px;font-size:12px;font-weight:600;cursor:pointer;"
                        onmouseover="this.style.color='#ff3b3b';this.style.borderColor='#ff3b3b'"
                        onmouseout="this.style.color='#8a9099';this.style.borderColor='#2a2d30'">
                        Apagar</button>
                         `;
            })()}
        </div>
        <div id="comentarios-${post.id}"
          style="display:none;border-top:1px solid #2a2d30;padding-top:14px;">
          ${comentariosHTML}
          <div style="display:flex;gap:8px;margin-top:10px;">
            <input type="text"
              data-comentario-input="${post.id}" data-topic-id="${idTopico}"
              placeholder="Responder publicação..."
              style="flex:1;background:#1e2022;border:1px solid #2a2d30;border-radius:6px;
                     color:#fff;font-size:13px;padding:8px 12px;outline:none;font-family:inherit;"
              onfocus="this.style.borderColor=\'#ff5c1a\'" onblur="this.style.borderColor=\'#2a2d30\'"/>
            <button data-forum-action="responder" data-topic-id="${idTopico}" data-post-id="${post.id}"
              style="background:#2a1200;color:#ff5c1a;border:1px solid #6b2000;border-radius:6px;
                     padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;"
              onmouseover="this.style.background=\'#3a1a00\'" onmouseout="this.style.background=\'#2a1200\'">
              Responder</button>
          </div>
        </div>
      </div>`;
  }).join("");
 
  forumBindEventos(listaPosts);
}
 
// ── Toggle comentários ────────────────────────
 
function forumToggleComentarios(postId) {
  const area = document.getElementById(`comentarios-${postId}`);
  if (!area) return;
  area.style.display = area.style.display === "none" ? "block" : "none";
}
 
// ── Criar post ────────────────────────────────
 
async function forumCriarPost(idTopico) {
  const mensagem = document.getElementById("forumNovoPostMensagem")?.value.trim();
  if (!mensagem) { alert("Escreva uma mensagem antes de publicar."); return; }
 
  const usuario = forumGetUsuario();
  const autor   = usuario ? (usuario.nome || usuario.login) : "Visitante";
 
  try {
    const topico = await forumBuscarTopico(idTopico);
    const posts  = Array.isArray(topico.posts) ? topico.posts : [];
    posts.unshift({ id: Date.now(), autor, mensagem, data: forumDataAgora(), comentarios: [] });
    await forumSalvarTopico(idTopico, { posts });
    document.getElementById("forumNovoPostMensagem").value = "";
    forumRenderPosts(idTopico, posts);
  } catch (e) {
    console.error(e);
    alert("Erro ao criar post. Verifique se o servidor está rodando.");
  }
}
 
// ── Adicionar comentário ──────────────────────
 
async function forumAdicionarComentario(idTopico, postId) {
  const input = document.querySelector(`[data-comentario-input="${postId}"]`);
  const texto = input?.value.trim();
  if (!texto) { alert("Digite um comentário."); return; }
 
  const usuario = forumGetUsuario();
  const autor   = usuario ? (usuario.nome || usuario.login) : "Visitante";
 
  try {
    const topico = await forumBuscarTopico(idTopico);
    const posts  = Array.isArray(topico.posts) ? topico.posts : [];
    const post   = posts.find(p => p.id === postId);
    if (!post) { alert("Post não encontrado."); return; }
    if (!Array.isArray(post.comentarios)) post.comentarios = [];
    post.comentarios.push({ autor, texto });
    await forumSalvarTopico(idTopico, { posts });
    forumRenderPosts(idTopico, posts);
    const area = document.getElementById(`comentarios-${postId}`);
    if (area) area.style.display = "block";
  } catch (e) {
    console.error(e);
    alert("Erro ao adicionar comentário.");
  }
}
 
// ── Apagar post ───────────────────────────────
 
async function forumApagarPost(idTopico, postId) {
  if (!confirm("Deseja apagar este post?")) return;
  try {
    const topico = await forumBuscarTopico(idTopico);
    const posts  = (Array.isArray(topico.posts) ? topico.posts : []).filter(p => p.id !== postId);
    await forumSalvarTopico(idTopico, { posts });
    forumRenderPosts(idTopico, posts);
  } catch (e) {
    console.error(e);
    alert("Erro ao apagar post.");
  }
}