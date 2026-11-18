// Backend do FireWatch: API REST + arquivos estáticos de public/.
//
// Regras de segurança principais:
// - senhas guardadas com bcrypt e nunca devolvidas pela API;
// - login por POST, devolve um JWT que o front manda no header Authorization;
// - permissões checadas aqui no servidor (o front só esconde botões).

const path = require("path");
const crypto = require("crypto");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db, salvar, novoId, DB_PATH } = require("./db");

const PORT = Number(process.env.PORT) || 3000;
const PRODUCAO = process.env.NODE_ENV === "production";

let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (PRODUCAO) {
    console.error("Defina a variável de ambiente JWT_SECRET em produção.");
    process.exit(1);
  }
  JWT_SECRET = crypto.randomBytes(32).toString("hex");
  console.warn("[aviso] JWT_SECRET não definido: usando um segredo temporário (logins caem ao reiniciar).");
}

const STATUS = ["Pendente", "Em Verificação", "Resolvida", "Alarme Falso"];
const GRAVIDADES = ["Baixa", "Média", "Alta", "Crítica"];

const app = express();

const origens = (process.env.CORS_ORIGIN || "").split(",").map((s) => s.trim()).filter(Boolean);
app.use(cors(origens.length ? { origin: origens } : undefined));
app.use(express.json({ limit: "4mb" }));

// ── Utilitários ─────────────────────────────────────────

class ErroHttp extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.status = status;
  }
}

const erro = (status, mensagem) => new ErroHttp(status, mensagem);

function texto(valor, campo, { min = 1, max = 200, obrigatorio = true } = {}) {
  const v = typeof valor === "string" ? valor.trim() : "";
  if (!v) {
    if (obrigatorio) throw erro(400, `O campo "${campo}" é obrigatório.`);
    return "";
  }
  if (v.length < min) throw erro(400, `O campo "${campo}" precisa ter pelo menos ${min} caracteres.`);
  if (v.length > max) throw erro(400, `O campo "${campo}" pode ter no máximo ${max} caracteres.`);
  return v;
}

function email(valor, campo) {
  const v = texto(valor, campo, { max: 120 }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) throw erro(400, `"${campo}" inválido.`);
  return v;
}

function agoraBR() {
  return new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

// Remove campos sensíveis antes de mandar um usuário para o front.
function usuarioPublico(u) {
  const { senhaHash, senha, ...resto } = u;
  return resto;
}

const isAdmin = (u) => !!u && u.admin === true;
const isOrgao = (u) => !!u && u.tipo === "orgao" && u.status === "aprovado";

function gerarToken(u) {
  return jwt.sign({ sub: u.id }, JWT_SECRET, { expiresIn: "8h" });
}

// Lê o token (se houver). Recarrega o usuário do banco a cada requisição,
// assim mudanças de status/permissão valem na hora.
function lerUsuario(req) {
  const h = req.headers.authorization || "";
  if (!h.startsWith("Bearer ")) return null;
  try {
    const { sub } = jwt.verify(h.slice(7), JWT_SECRET);
    const u = db().usuarios.find((x) => x.id === sub);
    if (!u || u.status === "rejeitado") return null;
    return u;
  } catch {
    return null;
  }
}

function autenticado(req, res, next) {
  req.usuario = lerUsuario(req);
  if (!req.usuario) return next(erro(401, "Faça login para continuar."));
  next();
}

function opcional(req, res, next) {
  req.usuario = lerUsuario(req);
  next();
}

function somenteOrgao(req, res, next) {
  if (!isOrgao(req.usuario)) return next(erro(403, "Apenas órgãos públicos aprovados podem fazer isso."));
  next();
}

function somenteAdmin(req, res, next) {
  if (!isAdmin(req.usuario)) return next(erro(403, "Apenas administradores podem fazer isso."));
  next();
}

// Esconde quem fez a denúncia para quem não é órgão nem o próprio autor.
function denunciaPublica(d, u) {
  if (isOrgao(u) || (u && d.usuarioId === u.id)) return d;
  const { usuarioId, usuario, ...resto } = d;
  return resto;
}

// ── Autenticação ────────────────────────────────────────

const api = express.Router();

// Limite simples de tentativas de login por IP (10 a cada 15 min).
const tentativas = new Map();
function limiteLogin(req, res, next) {
  const agora = Date.now();
  const janela = 15 * 60 * 1000;
  const ip = req.ip;
  const lista = (tentativas.get(ip) || []).filter((t) => agora - t < janela);
  if (lista.length >= 10) return next(erro(429, "Muitas tentativas. Aguarde alguns minutos."));
  lista.push(agora);
  tentativas.set(ip, lista);
  next();
}

api.post("/auth/cadastro", async (req, res) => {
  const b = req.body || {};
  const nome = texto(b.nome, "Nome", { max: 100 });
  const mail = email(b.email, "E-mail");
  const login = texto(b.login, "Usuário", { min: 3, max: 30 });
  if (!/^[a-zA-Z0-9._-]+$/.test(login)) throw erro(400, "O usuário só pode ter letras, números, ponto, hífen e sublinhado.");
  if (typeof b.senha !== "string" || b.senha.length < 6) throw erro(400, "A senha precisa ter pelo menos 6 caracteres.");
  if (b.senha.length > 72) throw erro(400, "A senha pode ter no máximo 72 caracteres.");
  const tipo = b.tipo === "orgao" ? "orgao" : "civil";

  const dados = db();
  if (dados.usuarios.some((u) => u.login.toLowerCase() === login.toLowerCase())) {
    throw erro(409, "Já existe um usuário com esse login.");
  }
  if (dados.usuarios.some((u) => (u.email || "").toLowerCase() === mail)) {
    throw erro(409, "Já existe um usuário com esse e-mail.");
  }

  const novo = {
    id: novoId(),
    nome,
    email: mail,
    login,
    senhaHash: await bcrypt.hash(b.senha, 10),
    tipo,
    // Cidadão entra direto; órgão precisa ser aprovado por um administrador.
    status: tipo === "orgao" ? "pendente" : "aprovado",
    primeiroLogin: true,
  };

  if (tipo === "orgao") {
    novo.orgao = texto(b.orgao, "Nome do Órgão", { max: 120 });
    novo.cargo = texto(b.cargo, "Cargo", { max: 80 });
    novo.matricula = texto(b.matricula, "Matrícula", { max: 40 });
    novo.emailInstitucional = email(b.emailInstitucional, "E-mail Institucional");
  }

  dados.usuarios.push(novo);
  salvar();
  res.status(201).json({ usuario: usuarioPublico(novo) });
});

api.post("/auth/login", limiteLogin, async (req, res) => {
  const { login, senha } = req.body || {};
  if (typeof login !== "string" || typeof senha !== "string" || !login || !senha) {
    throw erro(400, "Informe usuário e senha.");
  }
  const u = db().usuarios.find((x) => x.login.toLowerCase() === login.trim().toLowerCase());
  // Mesmo erro para usuário inexistente e senha errada (não revela quais logins existem).
  const ok = u && u.senhaHash && (await bcrypt.compare(senha, u.senhaHash));
  if (!ok) throw erro(401, "Usuário ou senha incorretos.");
  if (u.status === "rejeitado") throw erro(403, "Seu cadastro foi recusado. Entre em contato com o administrador.");

  if (u.primeiroLogin) {
    u.primeiroLogin = false;
    salvar();
  }
  res.json({ token: gerarToken(u), usuario: usuarioPublico(u) });
});

api.get("/auth/me", autenticado, (req, res) => {
  res.json({ usuario: usuarioPublico(req.usuario) });
});

// ── Administração (aprovação de órgãos) ─────────────────

api.get("/admin/usuarios", autenticado, somenteAdmin, (req, res) => {
  const { status } = req.query;
  const lista = db().usuarios.filter((u) => !status || u.status === status);
  res.json(lista.map(usuarioPublico));
});

api.patch("/admin/usuarios/:id", autenticado, somenteAdmin, (req, res) => {
  const { status } = req.body || {};
  if (!["aprovado", "rejeitado", "pendente"].includes(status)) throw erro(400, "Status inválido.");
  const u = db().usuarios.find((x) => x.id === req.params.id);
  if (!u) throw erro(404, "Usuário não encontrado.");
  if (u.id === req.usuario.id) throw erro(400, "Você não pode alterar o próprio status.");
  u.status = status;
  salvar();
  res.json(usuarioPublico(u));
});

// ── Denúncias ───────────────────────────────────────────

api.get("/denuncias", opcional, (req, res) => {
  let lista = db().denuncias;
  if (req.query.minhas !== undefined) {
    if (!req.usuario) throw erro(401, "Faça login para ver seu histórico.");
    lista = lista.filter((d) => d.usuarioId === req.usuario.id);
  }
  res.json(lista.map((d) => denunciaPublica(d, req.usuario)));
});

api.post("/denuncias", autenticado, (req, res) => {
  const b = req.body || {};
  const local = texto(b.local, "Local", { max: 300 });
  const latitude = Number(b.latitude);
  const longitude = Number(b.longitude);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
      !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw erro(400, "Localização inválida. Selecione um endereço na lista.");
  }
  if (typeof b.data !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(b.data) || isNaN(Date.parse(b.data))) {
    throw erro(400, "Data inválida.");
  }
  const gravidade = GRAVIDADES.includes(b.gravidade) ? b.gravidade : "Baixa";
  const descricao = texto(b.descricao, "Descrição", { max: 2000, obrigatorio: false });
  const horario = typeof b.horario === "string" && /^\d{2}:\d{2}$/.test(b.horario) ? b.horario : null;

  let foto = null;
  if (b.foto) {
    if (typeof b.foto !== "string" || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(b.foto)) {
      throw erro(400, "Foto inválida.");
    }
    if (b.foto.length > 3_000_000) throw erro(413, "Foto muito grande.");
    foto = b.foto;
  }

  const nova = {
    id: novoId(),
    local,
    data: b.data,
    horario,
    gravidade,
    descricao,
    foto,
    status: "Pendente",
    usuarioId: req.usuario.id,
    usuario: req.usuario.login,
    longitude,
    latitude,
  };
  db().denuncias.push(nova);
  salvar();
  res.status(201).json(nova);
});

api.patch("/denuncias/:id/status", autenticado, somenteOrgao, (req, res) => {
  const { status } = req.body || {};
  if (!STATUS.includes(status)) throw erro(400, "Status inválido.");
  const d = db().denuncias.find((x) => x.id === req.params.id);
  if (!d) throw erro(404, "Denúncia não encontrada.");
  d.status = status;
  salvar();
  res.json(d);
});

api.delete("/denuncias/:id", autenticado, (req, res) => {
  const dados = db();
  const i = dados.denuncias.findIndex((x) => x.id === req.params.id);
  if (i === -1) throw erro(404, "Denúncia não encontrada.");
  const d = dados.denuncias[i];
  if (d.usuarioId !== req.usuario.id && !isAdmin(req.usuario)) {
    throw erro(403, "Você só pode excluir as suas próprias denúncias.");
  }
  dados.denuncias.splice(i, 1);
  salvar();
  res.status(204).end();
});

// ── Fórum ───────────────────────────────────────────────

function acharTopico(id) {
  const t = db().topicos.find((x) => x.id === id);
  if (!t) throw erro(404, "Tópico não encontrado.");
  t.posts ||= [];
  return t;
}

function acharPost(t, postId) {
  const p = t.posts.find((x) => x.id === postId);
  if (!p) throw erro(404, "Post não encontrado.");
  p.comentarios ||= [];
  return p;
}

function podeApagar(u, item) {
  return isAdmin(u) || (item.autorId && item.autorId === u.id);
}

api.get("/topicos", (req, res) => {
  res.json(db().topicos);
});

api.get("/topicos/:id", (req, res) => {
  res.json(acharTopico(req.params.id));
});

api.post("/topicos", autenticado, (req, res) => {
  const b = req.body || {};
  const topico = {
    id: novoId(),
    titulo: texto(b.titulo, "Título", { max: 120 }),
    descricao: texto(b.descricao, "Descrição", { max: 2000 }),
    dataCriacao: agoraBR(),
    autor: req.usuario.nome,
    autorId: req.usuario.id,
    posts: [],
  };
  db().topicos.push(topico);
  salvar();
  res.status(201).json(topico);
});

api.delete("/topicos/:id", autenticado, (req, res) => {
  const t = acharTopico(req.params.id);
  if (!podeApagar(req.usuario, t)) throw erro(403, "Você só pode apagar os seus tópicos.");
  const dados = db();
  dados.topicos = dados.topicos.filter((x) => x.id !== t.id);
  salvar();
  res.status(204).end();
});

api.post("/topicos/:id/posts", autenticado, (req, res) => {
  const t = acharTopico(req.params.id);
  t.posts.unshift({
    id: novoId(),
    autor: req.usuario.nome,
    autorId: req.usuario.id,
    mensagem: texto(req.body?.mensagem, "Mensagem", { max: 2000 }),
    data: agoraBR(),
    comentarios: [],
  });
  salvar();
  res.status(201).json(t);
});

api.delete("/topicos/:id/posts/:postId", autenticado, (req, res) => {
  const t = acharTopico(req.params.id);
  const p = acharPost(t, req.params.postId);
  if (!podeApagar(req.usuario, p)) throw erro(403, "Você só pode apagar os seus posts.");
  t.posts = t.posts.filter((x) => x.id !== p.id);
  salvar();
  res.json(t);
});

api.post("/topicos/:id/posts/:postId/comentarios", autenticado, (req, res) => {
  const t = acharTopico(req.params.id);
  const p = acharPost(t, req.params.postId);
  p.comentarios.push({
    id: novoId(),
    autor: req.usuario.nome,
    autorId: req.usuario.id,
    texto: texto(req.body?.texto, "Comentário", { max: 1000 }),
    data: agoraBR(),
  });
  salvar();
  res.status(201).json(t);
});

app.use("/api", api);
app.use("/api", (req, res) => res.status(404).json({ erro: "Rota não encontrada." }));

// ── Front-end estático ──────────────────────────────────

const PUBLIC_DIR = path.join(__dirname, "..", "public");
app.get("/", (req, res) => res.redirect("/firewatch.html"));
app.use(express.static(PUBLIC_DIR, { dotfiles: "ignore", index: false }));

// ── Tratamento de erros ─────────────────────────────────

app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") return res.status(400).json({ erro: "JSON inválido." });
  if (err.type === "entity.too.large") return res.status(413).json({ erro: "Conteúdo muito grande." });
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ erro: status >= 500 ? "Erro interno do servidor." : err.message });
});

db(); // carrega (e migra, se preciso) antes de aceitar requisições
app.listen(PORT, () => {
  console.log(`FireWatch rodando em http://localhost:${PORT}  (dados: ${DB_PATH})`);
});
