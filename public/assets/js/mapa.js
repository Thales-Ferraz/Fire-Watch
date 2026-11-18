// assets/js/mapa.js

// Escancara a função para o sistema global conseguir acionar
window.refazerMapaNoDashboard = function() {
    mapboxgl.accessToken = MAPBOX_TOKEN; // definido em config.js

    // Se o elemento do mapa não estiver na tela (caso esteja no histórico ou catálogo), cancela
    if (!document.getElementById('map')) return;

    const map = new mapboxgl.Map({
        container: 'map',
        center: [-43.9352, -19.9208], // Foco em MG
        style: 'mapbox://styles/thales0102/cmquzj5pc000g01s75juxfxbe', 
        zoom: 6 
    });

    map.on('style.load', async () => {
        try {
            const denuncias = await apiFetch("/denuncias");

            denuncias.forEach(denuncia => {
                if (denuncia.status === "Pendente" || denuncia.status === "Em Verificação") {
                    const lng = parseFloat(denuncia.longitude);
                    const lat = parseFloat(denuncia.latitude);

                    if (isNaN(lng) || isNaN(lat)) return;

                    let corPino = '#ff5c1a';
                    if (denuncia.gravidade === 'Crítica') corPino = '#ff3b3b';
                    if (denuncia.gravidade === 'Baixa') corPino = '#ffcc00';

                    new mapboxgl.Marker({ color: corPino })
                        .setLngLat([lng, lat])
                        .setPopup(new mapboxgl.Popup({ offset: [0, -15] }).setHTML(`<h3>🔥 ${escapeHTML(denuncia.local)}</h3>`))
                        .addTo(map);
                }
            });
        } catch (erro) {
            console.error("Erro ao plotar pins:", erro);
        }
    });
};

// Quando a página abre do zero pela primeira vez, executa automaticamente
document.addEventListener("DOMContentLoaded", () => {
    window.refazerMapaNoDashboard();
    atualizarCards();
    renderGraficoPorEstado();
});