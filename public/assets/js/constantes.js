// Valores e cores usados em várias telas. Mude aqui, e não em cada arquivo.
// Os nomes de status e gravidade precisam ser idênticos aos do servidor (server/server.js).

const STATUS = {
  PENDENTE: "Pendente",
  EM_VERIFICACAO: "Em Verificação",
  RESOLVIDA: "Resolvida",
  ALARME_FALSO: "Alarme Falso",
};

// Status em que o foco ainda está ativo (aparece no mapa).
const STATUS_ATIVOS = [STATUS.PENDENTE, STATUS.EM_VERIFICACAO];

const GRAVIDADES = ["Baixa", "Média", "Alta", "Crítica"];

const COR_GRAVIDADE = {
  Baixa: "#facc15",
  Média: "#ff8c42",
  Alta: "#ff5c1a",
  Crítica: "#ff3b3b",
};

// Cor do pino no mapa (amarelo para baixa, para não confundir com "resolvida").
const COR_PINO = {
  Baixa: "#ffcc00",
  Média: "#ff8c42",
  Alta: "#ff5c1a",
  Crítica: "#ff3b3b",
};

const COR_STATUS = {
  [STATUS.PENDENTE]: { bg: "#0a1a2a", cor: "#4db8ff", borda: "#1a3a5a", icone: "⏳" },
  [STATUS.EM_VERIFICACAO]: { bg: "#35250d", cor: "#e88e44", borda: "#c68c46", icone: "🔎" },
  [STATUS.RESOLVIDA]: { bg: "#0f200f", cor: "#29d17c", borda: "#1a4a1a", icone: "✔" },
  [STATUS.ALARME_FALSO]: { bg: "#2a2a00", cor: "#d4d400", borda: "#4a4a00", icone: "⚠" },
};

// Aceita variações antigas ("Em verificação", espaços sobrando) e devolve o nome oficial.
function normalizarStatus(valor) {
  const v = String(valor || "").trim().toLowerCase();
  return Object.values(STATUS).find((s) => s.toLowerCase() === v) || STATUS.PENDENTE;
}

function corDoStatus(valor) {
  return COR_STATUS[normalizarStatus(valor)];
}

function corDaGravidade(valor) {
  return COR_GRAVIDADE[valor] || COR_GRAVIDADE["Média"];
}

// Classes CSS (definidas em style.css) para cada status e gravidade.
const CLASSE_STATUS = {
  [STATUS.PENDENTE]: "st-pendente",
  [STATUS.EM_VERIFICACAO]: "st-verificacao",
  [STATUS.RESOLVIDA]: "st-resolvida",
  [STATUS.ALARME_FALSO]: "st-falso",
};

const CLASSE_GRAVIDADE = {
  Baixa: "grav-baixa",
  Média: "grav-media",
  Alta: "grav-alta",
  Crítica: "grav-critica",
};

function classeStatus(valor) {
  return CLASSE_STATUS[normalizarStatus(valor)];
}

function classeGravidade(valor) {
  return CLASSE_GRAVIDADE[valor] || CLASSE_GRAVIDADE["Média"];
}

function isAtiva(denuncia) {
  return STATUS_ATIVOS.includes(normalizarStatus(denuncia.status));
}

// Data de hoje no fuso do navegador, no formato AAAA-MM-DD.
// (toISOString() usa UTC e erra o dia depois das 21h no Brasil.)
function hojeLocal(data = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${data.getFullYear()}-${p(data.getMonth() + 1)}-${p(data.getDate())}`;
}
