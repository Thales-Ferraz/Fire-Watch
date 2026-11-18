// Tela do administrador: aprovar ou recusar cadastros de órgãos públicos.

async function abrirAprovacaoOrgaos() {
  const mainContent = document.querySelector(".content");
  if (!mainContent) return;

  mainContent.innerHTML = `
    <div class="incidents-box">
      <div class="incidents-header">Aprovar Órgãos <span>carregando…</span></div>
    </div>`;

  try {
    const pendentes = await apiFetch("/admin/usuarios?status=pendente");
    renderAprovacaoOrgaos(pendentes);
  } catch (erro) {
    mainContent.innerHTML = `<p style="color:#ff3b3b;text-align:center;padding:20px;">⚠️ ${escapeHTML(erro.message)}</p>`;
  }
}

function renderAprovacaoOrgaos(usuarios) {
  const mainContent = document.querySelector(".content");
  if (!mainContent) return;

  const linhas = usuarios.length
    ? usuarios.map((u) => `
        <div style="background:#161819;border:1px solid #2a2d30;border-radius:10px;padding:16px;
                    display:flex;flex-direction:column;gap:6px;">
          <strong style="color:#fff;font-size:15px;">${escapeHTML(u.nome)}</strong>
          <span style="color:#8a9099;font-size:13px;">Login: ${escapeHTML(u.login)} · ${escapeHTML(u.email)}</span>
          <span style="color:#8a9099;font-size:13px;">
            ${escapeHTML(u.orgao)} — ${escapeHTML(u.cargo)} · Matrícula ${escapeHTML(u.matricula)}
          </span>
          <span style="color:#8a9099;font-size:13px;">E-mail institucional: ${escapeHTML(u.emailInstitucional)}</span>
          <div style="display:flex;gap:8px;margin-top:8px;">
            <button data-acao="aprovado" data-id="${escapeHTML(u.id)}"
              style="flex:1;padding:8px;border-radius:6px;background:#0f200f;color:#29d17c;
                     border:1px solid #1a4a1a;font-weight:600;cursor:pointer;">✔ Aprovar</button>
            <button data-acao="rejeitado" data-id="${escapeHTML(u.id)}"
              style="flex:1;padding:8px;border-radius:6px;background:#2a0000;color:#ff3b3b;
                     border:1px solid #5a0000;font-weight:600;cursor:pointer;">✖ Recusar</button>
          </div>
        </div>`).join("")
    : `<div style="padding:32px;text-align:center;color:#8a9099;font-size:14px;">
         Nenhum cadastro de órgão aguardando aprovação.</div>`;

  mainContent.innerHTML = `
    <div class="incidents-box">
      <div class="incidents-header">
        Aprovar Órgãos
        <span>${usuarios.length} pendente${usuarios.length !== 1 ? "s" : ""}</span>
      </div>
      <div style="padding:16px;display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px;">
        ${linhas}
      </div>
    </div>`;

  mainContent.querySelectorAll("button[data-acao]").forEach((botao) => {
    botao.addEventListener("click", () => definirStatusUsuario(botao.dataset.id, botao.dataset.acao));
  });
}

async function definirStatusUsuario(id, status) {
  const texto = status === "aprovado" ? "aprovar" : "recusar";
  if (!confirm(`Deseja ${texto} este cadastro?`)) return;
  try {
    await apiFetch(`/admin/usuarios/${encodeURIComponent(id)}`, { method: "PATCH", body: { status } });
    abrirAprovacaoOrgaos();
  } catch (erro) {
    alert(erro.message);
  }
}
