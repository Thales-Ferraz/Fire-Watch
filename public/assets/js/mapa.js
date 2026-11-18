// Mapa de focos ativos (Mapbox). Chamado pelo dashboard com as denúncias já carregadas.

let mapaAtual = null;

function renderMapa(denunciasAtivas) {
  const container = document.getElementById("map");
  if (!container || !window.mapboxgl) return;

  // Ao reabrir o dashboard, o mapa antigo é descartado antes de criar outro.
  if (mapaAtual) {
    mapaAtual.remove();
    mapaAtual = null;
  }

  mapboxgl.accessToken = MAPBOX_TOKEN; // definido em config.js

  const map = new mapboxgl.Map({
    container,
    center: [-43.9352, -19.9208], // Foco em MG
    style: "mapbox://styles/thales0102/cmquzj5pc000g01s75juxfxbe",
    zoom: 6,
  });
  mapaAtual = map;

  // Marcadores são elementos HTML: podem ser adicionados antes do estilo terminar de carregar.
  denunciasAtivas.forEach((d) => {
    const lng = parseFloat(d.longitude);
    const lat = parseFloat(d.latitude);
    if (isNaN(lng) || isNaN(lat)) return;

    const popup = new mapboxgl.Popup({ offset: [0, -15] }).setHTML(`
      <div class="popup-mapa">
        <strong>${escapeHTML(d.local)}</strong><br>
        Gravidade: ${escapeHTML(d.gravidade)}<br>
        Status: ${escapeHTML(normalizarStatus(d.status))}<br>
        ${escapeHTML(d.data)}${d.horario ? " · " + escapeHTML(d.horario) : ""}
      </div>`);

    new mapboxgl.Marker({ color: COR_PINO[d.gravidade] || COR_PINO["Média"] })
      .setLngLat([lng, lat])
      .setPopup(popup)
      .addTo(map);
  });
}
