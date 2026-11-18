// Persistência simples em arquivo JSON, com escrita atômica.
// O arquivo de dados NÃO é versionado (ver .gitignore); na primeira
// execução ele é criado a partir de server/db.seed.json.

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "data", "db.json");
const SEED_PATH = path.join(__dirname, "db.seed.json");
// Fotos das denúncias ficam numa pasta ao lado do arquivo de dados.
const UPLOADS_DIR = path.join(path.dirname(DB_PATH), "uploads");

const STATUS = ["Pendente", "Em Verificação", "Resolvida", "Alarme Falso"];

let dados = null;

function novoId() {
  return crypto.randomBytes(8).toString("base64url");
}

// Aceita variações antigas ("Em verificação", espaços) e devolve o nome oficial.
function normalizarStatus(valor) {
  const v = String(valor || "").trim().toLowerCase();
  return STATUS.find((s) => s.toLowerCase() === v) || null;
}

// Assinaturas ("magic bytes") de cada formato aceito.
function tipoDaImagem(buf) {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.length > 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  return null;
}

// Recebe uma foto em data URL (base64), confere se é mesmo uma imagem,
// grava em arquivo e devolve o caminho público (ex.: "/uploads/abc.jpg").
// Lança erro com .status = 400/413 se for inválida.
function salvarFoto(dataUrl) {
  const m = typeof dataUrl === "string" && dataUrl.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/);
  const falha = (status, msg) => Object.assign(new Error(msg), { status });
  if (!m) throw falha(400, "Foto inválida.");
  const buf = Buffer.from(m[2], "base64");
  if (buf.length > 2 * 1024 * 1024) throw falha(413, "Foto muito grande (máximo 2 MB).");
  const ext = tipoDaImagem(buf);
  if (!ext) throw falha(400, "O arquivo enviado não é uma imagem JPEG, PNG ou WEBP.");
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  const nome = `${novoId()}.${ext}`;
  fs.writeFileSync(path.join(UPLOADS_DIR, nome), buf);
  return `/uploads/${nome}`;
}

function apagarFoto(caminho) {
  const m = typeof caminho === "string" && caminho.match(/^\/uploads\/([A-Za-z0-9_-]+\.(jpg|png|webp))$/);
  if (!m) return;
  fs.rm(path.join(UPLOADS_DIR, m[1]), { force: true }, () => {});
}

function carregar() {
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.copyFileSync(SEED_PATH, DB_PATH);
    console.log(`[db] Banco criado a partir do seed em ${DB_PATH}`);
  }
  dados = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
  dados.usuarios ||= [];
  dados.denuncias ||= [];
  dados.topicos ||= [];
  let mudou = migrar();

  // Garante que existe um administrador (dados antigos não tinham a flag "admin").
  if (!dados.usuarios.some((u) => u.admin)) {
    const admin = dados.usuarios.find((u) => u.login === "admin");
    if (admin) {
      admin.admin = true;
      mudou = true;
      console.log('[db] Usuário "admin" marcado como administrador.');
    }
  }

  // Se ADMIN_SENHA estiver definida, ela passa a ser a senha do administrador.
  // Útil para trocar uma senha que já vazou.
  if (process.env.ADMIN_SENHA) {
    const admin = dados.usuarios.find((u) => u.admin);
    if (admin && !bcrypt.compareSync(process.env.ADMIN_SENHA, admin.senhaHash || "")) {
      admin.senhaHash = bcrypt.hashSync(process.env.ADMIN_SENHA, 10);
      mudou = true;
      console.log("[db] Senha do administrador atualizada a partir de ADMIN_SENHA.");
    }
  }

  if (mudou) salvar();
  return dados;
}

// Converte dados no formato antigo (json-server) para o formato novo:
// - senha em texto puro -> senhaHash (bcrypt)
// - tópicos/posts/comentários sem autorId -> tenta achar o autor pelo nome
function migrar() {
  let mudou = false;

  for (const u of dados.usuarios) {
    if (typeof u.senha === "string") {
      u.senhaHash = bcrypt.hashSync(u.senha, 10);
      delete u.senha;
      mudou = true;
    }
    if (!u.id) {
      u.id = novoId();
      mudou = true;
    }
  }

  const idPorNome = (nome) => {
    const u = dados.usuarios.find((x) => x.nome === nome || x.login === nome);
    return u ? u.id : null;
  };

  for (const t of dados.topicos) {
    if (t.autorId === undefined) {
      t.autorId = idPorNome(t.autor);
      mudou = true;
    }
    t.posts ||= [];
    for (const p of t.posts) {
      if (p.autorId === undefined) {
        p.autorId = idPorNome(p.autor);
        mudou = true;
      }
      if (typeof p.id !== "string") {
        p.id = String(p.id ?? novoId());
        mudou = true;
      }
      p.comentarios ||= [];
      for (const c of p.comentarios) {
        if (c.autorId === undefined) {
          c.autorId = idPorNome(c.autor);
          mudou = true;
        }
        if (!c.id) {
          c.id = novoId();
          mudou = true;
        }
      }
    }
  }

  for (const d of dados.denuncias) {
    // Status com grafia antiga/diferente -> nome oficial.
    const s = normalizarStatus(d.status) || "Pendente";
    if (d.status !== s) {
      d.status = s;
      mudou = true;
    }
    // Fotos em base64 dentro do JSON -> arquivos em uploads/.
    if (typeof d.foto === "string" && d.foto.startsWith("data:")) {
      try {
        d.foto = salvarFoto(d.foto);
      } catch {
        d.foto = null;
      }
      mudou = true;
    }
  }

  if (mudou) console.log("[db] Dados antigos migrados para o novo formato.");
  return mudou;
}

function salvar() {
  const tmp = DB_PATH + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(dados, null, 2));
  fs.renameSync(tmp, DB_PATH);
}

function db() {
  return dados || carregar();
}

module.exports = { db, salvar, novoId, DB_PATH, UPLOADS_DIR, STATUS, normalizarStatus, salvarFoto, apagarFoto };
