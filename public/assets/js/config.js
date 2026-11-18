// Configuração única do front-end. Carregue este arquivo antes dos outros scripts.

// Endereço da API:
// - aberto pelo próprio servidor (npm run dev → http://localhost:3000) ou no Render: mesma origem;
// - aberto por outro servidor local (ex.: Live Server na porta 5500) ou direto do disco: localhost:3000;
// - qualquer outro lugar: o servidor publicado no Render.
const API_URL = (() => {
  const { protocol, hostname, port, origin } = window.location;
  const local = hostname === "localhost" || hostname === "127.0.0.1";
  if (protocol === "file:" || (local && port !== "3000")) return "http://localhost:3000/api";
  if (local || hostname === "fire-watch.onrender.com") return origin + "/api";
  return "https://fire-watch.onrender.com/api";
})();

// Token público do Mapbox (pk.*). Ele fica visível no navegador por natureza,
// por isso deve estar restrito às URLs do site no painel do Mapbox
// (Account → Tokens → URL restrictions).
const MAPBOX_TOKEN =
  "pk.eyJ1IjoidGhhbGVzMDEwMiIsImEiOiJjbXF1ejl0ZmYweGhiMnlweHNsOXQ5MDh1In0.6HTif46NMbTzBDk5upg9TQ";
