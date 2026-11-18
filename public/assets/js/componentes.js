// Componentes de tela compartilhados: card de denúncia e lista com filtros/paginação.
// Usados pelo Histórico (historico.js) e por Gerenciar Denúncias (gerencia.js).

// HTML de um card de denúncia. "acoes" é um HTML extra (botões) colocado no fim do card.
function cardDenuncia(d, { acoes = "" } = {}) {
  const foto = urlFoto(d.foto);
  const status = normalizarStatus(d.status);
  const grav = classeGravidade(d.gravidade);

  return `
    <article class="card denuncia-card ${grav}" data-id="${escapeHTML(d.id)}">
      ${foto ? `<img class="denuncia-foto" src="${foto}" alt="Foto enviada na denúncia" loading="lazy" onerror="this.remove()" />` : ""}
      <div class="denuncia-topo">
        <span class="selo-grav">${escapeHTML(d.gravidade)}</span>
        <span class="status ${classeStatus(status)}">${escapeHTML(status)}</span>
      </div>
      <h3 class="denuncia-local">${icone("pino", "ico-sm")} ${escapeHTML(d.local)}</h3>
      ${d.descricao ? `<p class="denuncia-desc">${escapeHTML(d.descricao)}</p>` : ""}
      <div class="denuncia-meta">
        <span class="meta-item">${icone("calendario", "ico-sm")} <span class="num">${escapeHTML(formatarData(d.data))}</span></span>
        ${d.horario ? `<span class="meta-item">${icone("relogio", "ico-sm")} <span class="num">${escapeHTML(d.horario)}</span></span>` : ""}
      </div>
      ${acoes}
    </article>`;
}

// "2026-11-18" -> "18/11/2026"
function formatarData(iso) {
  const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : String(iso || "");
}

// Filtros de cada lista ficam guardados aqui, para não se perderem
// quando a lista é redesenhada (ex.: depois de mudar um status).
const filtrosDasListas = {};

// Desenha, dentro de .content, uma lista de denúncias com busca, filtros e paginação.
//   chave:     identifica a lista ("historico", "gerencia") para lembrar os filtros
//   titulo:    texto do cabeçalho
//   denuncias: array de denúncias
//   acoes(d):  HTML dos botões de cada card (opcional)
//   aoAcao(acao, id, botao): chamado no clique de um botão com data-acao
//   vazio:     texto quando não há nenhuma denúncia
function montarListaDenuncias({ chave, titulo, denuncias, acoes = () => "", aoAcao = () => {}, vazio, porPagina = 12 }) {
  const mainContent = document.querySelector(".content");
  if (!mainContent) return;

  const f = (filtrosDasListas[chave] ||= { busca: "", status: "", gravidade: "", ordem: "recentes", pagina: 1 });

  const opcoes = (lista, atual, rotuloTodos) =>
    `<option value="">${rotuloTodos}</option>` +
    lista.map((v) => `<option value="${escapeHTML(v)}" ${v === atual ? "selected" : ""}>${escapeHTML(v)}</option>`).join("");

  mainContent.innerHTML = `
    <section class="painel">
      <div class="painel-cabecalho">
        <h2>${escapeHTML(titulo)}</h2>
        <span data-contador></span>
      </div>
      <div class="painel-corpo">
        ${denuncias.length ? `
        <div class="filtros" role="search">
          <label class="sr-only" for="filtroBusca-${chave}">Buscar</label>
          <span class="campo-busca">
            ${icone("busca")}
            <input type="search" id="filtroBusca-${chave}" class="campo" data-filtro="busca"
                   placeholder="Buscar por local ou descrição" value="${escapeHTML(f.busca)}" />
          </span>
          <label class="sr-only" for="filtroStatus-${chave}">Status</label>
          <select id="filtroStatus-${chave}" class="campo" data-filtro="status">
            ${opcoes(Object.values(STATUS), f.status, "Todos os status")}
          </select>
          <label class="sr-only" for="filtroGrav-${chave}">Gravidade</label>
          <select id="filtroGrav-${chave}" class="campo" data-filtro="gravidade">
            ${opcoes(GRAVIDADES, f.gravidade, "Todas as gravidades")}
          </select>
          <label class="sr-only" for="filtroOrdem-${chave}">Ordenar por</label>
          <select id="filtroOrdem-${chave}" class="campo" data-filtro="ordem">
            <option value="recentes" ${f.ordem === "recentes" ? "selected" : ""}>Mais recentes</option>
            <option value="antigas" ${f.ordem === "antigas" ? "selected" : ""}>Mais antigas</option>
            <option value="gravidade" ${f.ordem === "gravidade" ? "selected" : ""}>Mais graves</option>
          </select>
        </div>` : ""}
        <div class="grade-cards" data-grade></div>
        <nav class="paginacao" aria-label="Paginação" data-paginacao></nav>
      </div>
    </section>`;

  const grade = mainContent.querySelector("[data-grade]");
  const paginacao = mainContent.querySelector("[data-paginacao]");
  const contador = mainContent.querySelector("[data-contador]");

  function filtrar() {
    const termo = f.busca.trim().toLowerCase();
    const lista = denuncias.filter((d) =>
      (!f.status || normalizarStatus(d.status) === f.status) &&
      (!f.gravidade || d.gravidade === f.gravidade) &&
      (!termo || `${d.local} ${d.descricao || ""}`.toLowerCase().includes(termo))
    );
    const chaveData = (d) => `${d.data || ""} ${d.horario || ""}`;
    if (f.ordem === "antigas") lista.sort((a, b) => chaveData(a).localeCompare(chaveData(b)));
    else if (f.ordem === "gravidade") {
      lista.sort((a, b) => GRAVIDADES.indexOf(b.gravidade) - GRAVIDADES.indexOf(a.gravidade) || chaveData(b).localeCompare(chaveData(a)));
    } else lista.sort((a, b) => chaveData(b).localeCompare(chaveData(a)));
    return lista;
  }

  function desenhar() {
    const lista = filtrar();
    const paginas = Math.max(1, Math.ceil(lista.length / porPagina));
    f.pagina = Math.min(Math.max(1, f.pagina), paginas);
    const pagina = lista.slice((f.pagina - 1) * porPagina, f.pagina * porPagina);

    contador.textContent = lista.length === denuncias.length
      ? `${denuncias.length} registro${denuncias.length !== 1 ? "s" : ""}`
      : `${lista.length} de ${denuncias.length} registros`;

    if (!denuncias.length) {
      grade.innerHTML = `<p class="estado-vazio grade-cheia">${escapeHTML(vazio)}</p>`;
    } else if (!lista.length) {
      grade.innerHTML = `<p class="estado-vazio grade-cheia">Nenhuma denúncia encontrada com esses filtros.</p>`;
    } else {
      grade.innerHTML = pagina.map((d) => cardDenuncia(d, { acoes: acoes(d) })).join("");
    }

    paginacao.innerHTML = paginas > 1 ? `
      <button type="button" class="btn btn-fantasma btn-sm" data-pagina="${f.pagina - 1}" ${f.pagina === 1 ? "disabled" : ""}>${icone("anterior")} Anterior</button>
      <span class="num">${f.pagina} / ${paginas}</span>
      <button type="button" class="btn btn-fantasma btn-sm" data-pagina="${f.pagina + 1}" ${f.pagina === paginas ? "disabled" : ""}>Próxima ${icone("proximo")}</button>` : "";
  }

  mainContent.querySelectorAll("[data-filtro]").forEach((campo) => {
    campo.addEventListener(campo.tagName === "INPUT" ? "input" : "change", () => {
      f[campo.dataset.filtro] = campo.value;
      f.pagina = 1;
      desenhar();
    });
  });

  paginacao.addEventListener("click", (e) => {
    const b = e.target.closest("[data-pagina]");
    if (!b) return;
    f.pagina = Number(b.dataset.pagina);
    desenhar();
    mainContent.scrollTop = 0;
  });

  grade.addEventListener("click", (e) => {
    const b = e.target.closest("[data-acao]");
    if (b && !b.disabled) aoAcao(b.dataset.acao, b.closest("[data-id]")?.dataset.id, b);
  });

  desenhar();
}
