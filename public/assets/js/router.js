// Rotas por "#": cada tela tem seu endereço (ex.: firewatch.html#/forum),
// então o F5 mantém a tela atual e o botão "voltar" do navegador funciona.
// Carregue este arquivo por último: ele chama as funções das outras telas.

const ROTAS = {
  dashboard: {
    titulo: "Monitoramento",
    sub: "Canal transparente de dados e focos ativos de incêndio em tempo real",
    abrir: () => abrirDashboard(),
  },
  historico: {
    titulo: "Minhas denúncias",
    sub: "As denúncias que você registrou",
    abrir: () => abrirHistorico(),
  },
  forum: {
    titulo: "Fórum",
    sub: "Converse com a comunidade sobre focos na sua região",
    abrir: (id) => (id ? forumAbrirTopico(id) : abrirForum()),
  },
  catalogo: {
    titulo: "Prevenção",
    sub: "Informação para prevenir e agir diante de queimadas",
    abrir: (categoria) => (categoria ? abrirArtigoWiki(categoria) : abrirCatalogo()),
  },
  gerenciar: {
    titulo: "Gerenciar Denúncias",
    sub: "Atualize o status das denúncias recebidas",
    abrir: () => abrirGerenciarDenuncias(),
    permitido: () => isOrgao(),
    semPermissao: "Esta área é exclusiva para órgãos públicos aprovados.",
  },
  aprovar: {
    titulo: "Aprovar Órgãos",
    sub: "Cadastros de órgãos públicos aguardando aprovação",
    abrir: () => abrirAprovacaoOrgaos(),
    permitido: () => isAdmin(),
    semPermissao: "Esta área é exclusiva para administradores.",
  },
};

// "#/forum/abc" -> { nome: "forum", param: "abc" }
function lerRota() {
  const [nome, ...resto] = window.location.hash.replace(/^#\/?/, "").split("/");
  return {
    nome: ROTAS[nome] ? nome : "dashboard",
    param: resto.length && resto[0] ? decodeURIComponent(resto.join("/")) : null,
  };
}

// Usado pelas telas para saber se o usuário ainda está nelas depois de um carregamento.
function rotaAtual() {
  return lerRota().nome;
}

let primeiraNavegacao = true;

function navegar() {
  const { nome, param } = lerRota();
  const rota = ROTAS[nome];

  // Menu: marca o item da tela atual
  document.querySelectorAll(".nav-item[data-rota]").forEach((link) => {
    const ativo = link.dataset.rota === nome;
    link.classList.toggle("active", ativo);
    if (ativo) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });

  // Cabeçalho e título da aba
  const titulo = document.querySelector(".header-title");
  const sub = document.querySelector(".header-sub");
  if (titulo) titulo.textContent = rota.titulo;
  if (sub) sub.textContent = rota.sub;
  document.title = `${rota.titulo} · FireWatch`;

  fecharMenu();

  const content = document.querySelector(".content");
  if (!content) return;
  content.scrollTop = 0;

  if (rota.permitido && !rota.permitido()) {
    content.innerHTML = `<div class="estado-vazio">${icone("escudo", "ico-xl")}<p>${escapeHTML(rota.semPermissao)}</p></div>`;
  } else {
    rota.abrir(param);
  }

  // Leva o foco para o conteúdo novo (ajuda quem usa teclado/leitor de tela),
  // menos na primeira carga da página.
  if (!primeiraNavegacao) content.focus({ preventScroll: true });
  primeiraNavegacao = false;
}

// ── Menu lateral no celular ─────────────────

function abrirMenu() {
  document.body.classList.add("menu-aberto");
  document.querySelector(".btn-menu")?.setAttribute("aria-expanded", "true");
  document.querySelector(".sidebar .nav-item")?.focus();
}

function fecharMenu() {
  if (!document.body.classList.contains("menu-aberto")) return;
  document.body.classList.remove("menu-aberto");
  const botao = document.querySelector(".btn-menu");
  botao?.setAttribute("aria-expanded", "false");
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && document.body.classList.contains("menu-aberto")) {
    fecharMenu();
    document.querySelector(".btn-menu")?.focus();
  }
});

// Clicar no link da tela em que já está recarrega a tela (o "hashchange" não dispara).
document.addEventListener("click", (e) => {
  const link = e.target.closest('a[href^="#/"]');
  if (link && link.getAttribute("href") === window.location.hash) {
    e.preventDefault();
    navegar();
  }
});

window.addEventListener("hashchange", navegar);
document.addEventListener("DOMContentLoaded", navegar);
