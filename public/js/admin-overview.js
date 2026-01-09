
// admin-overview.js - Gestion de la vue d'ensemble pour le dashboard admin

document.addEventListener('DOMContentLoaded', () => {
    // Charger les stats si on est sur la page overview
    if (document.getElementById('page-overview')) {
        loadStats();
    }

    // Empêcher l'accès sans session admin
        // Empêcher l'accès sans session admin et bloquer le retour arrière
        enforceAdminSession();
        preventBackNavigation('admin');

    // Écouter les changements d'onglets pour recharger si nécessaire
    const overviewTabBtn = document.querySelector('[onclick="navigateTo(\'overview\')"]');
    if (overviewTabBtn) {
        overviewTabBtn.addEventListener('click', loadStats);
    }

    // Précharger les logs si on est déjà sur l'onglet logs (rare)
    const logsPage = document.getElementById('page-logs');
    if (logsPage && logsPage.classList.contains('active')) {
        loadLogs();
    }

    // Précharger le support si l'onglet est actif
    const supportPage = document.getElementById('page-support');
    if (supportPage && supportPage.classList.contains('active')) {
        loadSupportTickets();
    }

    // Charger les notifications dès l'arrivée
    loadNotifications();
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

// Vérifie la session admin, sinon redirige vers l'accueil
function enforceAdminSession() {
    const role = localStorage.getItem('user_role');
    const name = localStorage.getItem('user_name');
    if (!name || role !== 'admin') {
        window.location.replace('/');
    }
}

// Empêche de revenir au dashboard via le bouton retour si non authentifié
function preventBackNavigation(expectedRole) {
    history.replaceState(null, '', location.href);
    const guard = () => {
        const role = localStorage.getItem('user_role');
        if (role !== expectedRole) {
            window.location.replace('/');
        }
    };
    window.addEventListener('popstate', guard);
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            guard();
        }
    });
}

function updateStatDisplay(stats) {
    // Mise à jour des compteurs avec animation
    animateValue('stat-total', stats.total);
    animateValue('stat-patients', stats.patients);
    animateValue('stat-medecins', stats.medecins);
    animateValue('stat-pending', stats.pending);
    animateValue('stat-notifications', stats.notifications ?? 0);
    
    // Mise à jour du bouton d'accès rapide
    const pendingBtn = document.getElementById('btn-quick-pending');
    if (pendingBtn) {
        pendingBtn.textContent = `⏳ Valider les comptes (${stats.pending})`;
    }

    updateActivityList(stats.recentActivity);
}

function updateActivityList(activities) {
    const container = document.getElementById('activity-list');
    if (!container) return;

    if (!activities || activities.length === 0) {
        container.innerHTML = `
            <div class="activity-item">
                <div class="activity-content">
                    <div class="activity-details">Aucune activité récente</div>
                </div>
            </div>`;
        return;
    }

    container.innerHTML = activities.map(req => `
        <div class="activity-item">
            <div class="activity-icon">👤</div>
            <div class="activity-content">
                <div class="activity-title">Nouvelle demande d'inscription</div>
                <div class="activity-details">${req.type === 'medecin' ? 'Médecin' : 'Patient'}: ${req.prenom} ${req.nom}</div>
                <div class="activity-time">En attente</div>
            </div>
        </div>
    `).join('');
}

// Notifications / alertes
async function loadNotifications() {
    try {
        const res = await fetch('/api/admin/notifications');
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Erreur notifications');

        renderNotifications(data.notifications || []);
        updateBell(data.unread || 0);
    } catch (err) {
        console.error('Notifications admin:', err);
        renderNotifications([]);
        updateBell(0);
    }
}

function updateBell(count) {
    const badge = document.getElementById('notif-badge');
    if (badge) {
        badge.textContent = count;
    }
}

function renderNotifications(items) {
    const container = document.getElementById('notifications-list');
    if (!container) return;

    if (!items.length) {
        container.innerHTML = `<div class="notification-item"><div class="activity-icon">ℹ️</div><div class="activity-content"><div class="activity-title">Aucune alerte</div><div class="activity-details">Vous êtes à jour</div><div class="activity-time">—</div></div></div>`;
        return;
    }

    container.innerHTML = items.map((n) => `
        <div class="notification-item ${n.unread ? 'unread' : ''}">
            <div class="activity-icon">${n.icon || '🔔'}</div>
            <div class="activity-content">
                <div class="activity-title">${escapeHtml(n.title)}</div>
                <div class="activity-details">${escapeHtml(n.detail || '')}</div>
                <div class="activity-time">${escapeHtml(n.time || '')}</div>
            </div>
        </div>
    `).join('');
}

// Support / SAV
async function loadSupportTickets() {
    const list = document.getElementById('support-list');
    const badge = document.getElementById('support-count');
    if (!list) return;

    list.innerHTML = `<div class="activity-item"><div class="activity-content"><div class="activity-title">Chargement...</div><div class="activity-details">Lecture des tickets support</div></div></div>`;

    try {
        const res = await fetch('/api/admin/support-requests');
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Erreur support');

        const requests = data.requests || [];
        if (badge) badge.textContent = requests.length;

        if (!requests.length) {
            list.innerHTML = `<div class="activity-item"><div class="activity-content"><div class="activity-title">Aucun ticket</div><div class="activity-details">Aucune remontée utilisateur pour l'instant</div></div></div>`;
            return;
        }

        const colorBySujet = (s) => {
            switch (s) {
                case 'inscription':
                    return { color: '#2980b9', emoji: '🟦', label: 'Inscription' };
                case 'question':
                case 'question_generale':
                case 'question_générale':
                    return { color: '#27ae60', emoji: '🟢', label: 'Question générale' };
                case 'question_medicale':
                    return { color: '#8e44ad', emoji: '🟣', label: 'Question médicale' };
                case 'probleme_connexion':
                    return { color: '#e74c3c', emoji: '🔴', label: 'Connexion' };
                case 'modification_compte':
                    return { color: '#f39c12', emoji: '🟡', label: 'Compte' };
                default:
                    return { color: '#7f8c8d', emoji: '⚪', label: 'Autre' };
            }
        };

        list.innerHTML = requests
            .slice()
            .reverse()
            .map((r) => {
                const meta = colorBySujet(r.sujet);
                const created = r.createdAt ? new Date(r.createdAt).toLocaleString('fr-FR') : 'Récemment';
                return `
                <div class="activity-item" style="border-left-color: ${meta.color};">
                    <div class="activity-icon" style="background: ${meta.color};">${meta.emoji}</div>
                    <div class="activity-content">
                        <div class="activity-title">${escapeHtml(meta.label)} - ${escapeHtml(r.prenom || '')} ${escapeHtml(r.nom || '')}</div>
                        <div class="activity-details">${escapeHtml(r.message || '')}</div>
                        <div class="activity-time">${escapeHtml(created)} • ${escapeHtml(r.email || '')}${r.telephone ? ' • ' + escapeHtml(r.telephone) : ''}</div>
                    </div>
                </div>`;
            })
            .join('');
    } catch (err) {
        console.error('Support:', err);
        list.innerHTML = `<div class="activity-item"><div class="activity-content"><div class="activity-title">Erreur</div><div class="activity-details">${escapeHtml(err.message)}</div></div></div>`;
    }
}

// Chargement des logs applicatifs
async function loadLogs() {
    const list = document.getElementById('logs-list');
    if (!list) return;

    list.innerHTML = `<div class="log-item"><span class="log-time">Chargement...</span><span class="log-level info">INFO</span><span>Lecture des logs</span></div>`;

    try {
        const res = await fetch('/api/admin/logs?limit=200');
        const data = await res.json();

        if (!data.success) {
            throw new Error(data.error || 'Erreur de lecture des logs');
        }

        const logs = data.logs || [];
        if (!logs.length) {
            list.innerHTML = `<div class="log-item"><span class="log-time">—</span><span class="log-level info">INFO</span><span>Aucun log disponible</span></div>`;
            return;
        }

        list.innerHTML = logs.map((entry) => formatLogItem(entry.line)).join('');
        const meta = document.getElementById('logs-meta');
        if (meta) {
            meta.textContent = `Affichage ${logs.length} lignes (max 200)`;
        }
    } catch (err) {
        console.error('Logs admin:', err);
        list.innerHTML = `<div class="log-item"><span class="log-time">Erreur</span><span class="log-level error">ERROR</span><span>${err.message}</span></div>`;
    }
}

function formatLogItem(line) {
    // Tentative de parsing rudimentaire [timestamp] LEVEL message
    const match = line.match(/^(\[[^\]]+\])?\s*(INFO|ERROR|WARN|WARNING|DEBUG)?\s*-?\s*(.*)$/i);
    const time = match && match[1] ? match[1] : '';
    const levelRaw = match && match[2] ? match[2].toUpperCase() : '';
    const message = match ? match[3] : line;

    const levelClass = levelRaw === 'ERROR' ? 'error'
        : (levelRaw === 'WARN' || levelRaw === 'WARNING') ? 'warning'
        : 'info';

    const levelLabel = levelRaw || 'INFO';
    const timeLabel = time || '[log]';

    return `<div class="log-item"><span class="log-time">${timeLabel}</span><span class="log-level ${levelClass}">${levelLabel}</span><span>${escapeHtml(message)}</span></div>`;
}

function escapeHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
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
