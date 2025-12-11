
// admin-overview.js - Gestion de la vue d'ensemble pour le dashboard admin

document.addEventListener('DOMContentLoaded', () => {
    // Charger les stats si on est sur la page overview
    if (document.getElementById('page-overview')) {
        loadStats();
    }

    // Écouter les changements d'onglets pour recharger si nécessaire
    const overviewTabBtn = document.querySelector('[onclick="navigateTo(\'overview\')"]');
    if (overviewTabBtn) {
        overviewTabBtn.addEventListener('click', loadStats);
    }
});

async function loadStats() {
    try {
        const res = await fetch('/api/admin/stats');
        const data = await res.json();

        if (data.success) {
            updateStatDisplay(data.stats);
        }
    } catch (err) {
        console.error('Erreur chargement stats:', err);
    }
}

function updateStatDisplay(stats) {
    // Mise à jour des compteurs avec animation
    animateValue('stat-total', stats.total);
    animateValue('stat-patients', stats.patients);
    animateValue('stat-medecins', stats.medecins);
    animateValue('stat-pending', stats.pending);
    
    // Mise à jour du bouton d'accès rapide
    const pendingBtn = document.getElementById('btn-quick-pending');
    if (pendingBtn) {
        pendingBtn.textContent = `⏳ Valider les comptes (${stats.pending})`;
    }
}

function animateValue(id, end) {
    const obj = document.getElementById(id);
    if (!obj) return;
    
    const start = parseInt(obj.textContent) || 0;
    if (start === end) return;

    const duration = 1000;
    const range = end - start;
    let startTime = null;

    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        obj.textContent = Math.floor(progress * range + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    }
    window.requestAnimationFrame(step);
}
