// Persistência simples em arquivo JSON, com escrita atômica.
// O arquivo de dados NÃO é versionado (ver .gitignore); na primeira
// execução ele é criado a partir de server/db.seed.json.

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "data", "db.json");
const SEED_PATH = path.join(__dirname, "db.seed.json");

let dados = null;

function novoId() {
  return crypto.randomBytes(8).toString("base64url");
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

module.exports = { db, salvar, novoId, DB_PATH };
