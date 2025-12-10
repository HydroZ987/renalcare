// services/pendingRequestsStore.js

let nextId = 1;

// Tableau en mémoire contenant toutes les demandes envoyées via le formulaire de contact
let pendingRequests = [];

/**
 * Ajoute une nouvelle demande en mémoire
 */
function addRequest(data) {
    const request = {
        id: nextId++,            // ID auto-incrémenté
        createdAt: new Date(),   // date d’envoi
        ...data                  // les données venant du formulaire
    };

    pendingRequests.push(request);
    return request;
}

/**
 * Récupère toutes les demandes en attente
 */
function getAll() {
    return pendingRequests;
}

/**
 * Récupère une demande par son ID
 */
function getById(id) {
    return pendingRequests.find(r => r.id === id);
}

/**
 * Supprime une demande (après validation ou refus)
 */
function remove(id) {
    pendingRequests = pendingRequests.filter(r => r.id !== id);
}

module.exports = {
    addRequest,
    getAll,
    getById,
    remove,
};