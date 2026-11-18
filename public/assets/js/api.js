// Acesso à API e utilitários compartilhados. Depende de config.js e auth.js.

class ApiErro extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.status = status;
  }
}

// Faz uma requisição à API, mandando o token quando o usuário está logado.
// Devolve o JSON da resposta (ou null) e lança ApiErro com a mensagem do servidor.
async function apiFetch(caminho, { method = "GET", body } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let resposta;
  try {
    resposta = await fetch(API_URL + caminho, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiErro(0, "Não foi possível conectar ao servidor. Tente novamente em instantes.");
  }

  let dados = null;
  const tipo = resposta.headers.get("Content-Type") || "";
  if (resposta.status !== 204 && tipo.includes("application/json")) {
    dados = await resposta.json().catch(() => null);
  }

  if (!resposta.ok) {
    // Token vencido ou inválido: encerra a sessão local.
    if (resposta.status === 401 && token) limparSessao();
    throw new ApiErro(resposta.status, (dados && dados.erro) || `Erro ${resposta.status}`);
  }
  return dados;
}

// Escapa texto antes de colocar dentro de HTML (evita XSS).
// Use em TODO dado que veio do usuário/servidor e vai para innerHTML.
function escapeHTML(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Só aceita imagens em data URL (formato que o próprio app gera).
function urlImagemSegura(valor) {
  return typeof valor === "string" && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(valor)
    ? valor
    : "";
}
