// routes/adminRoutes.js
const express = require('express');
const router = express.Router();

const pendingRequestsStore = require('../services/pendingRequestsStore');
const {
  sendValidationEmail,
  sendRefusalEmail,
} = require('../services/mailService');

/**
 * GET /api/admin/pending-requests
 * Renvoie toutes les demandes en attente (pour le tableau "Comptes en attente")
 */
router.get('/pending-requests', (req, res) => {
  try {
    const requests = pendingRequestsStore.getAll();
    res.json(requests);
  } catch (err) {
    console.error('Erreur /pending-requests:', err);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * POST /api/admin/validate-account
 * Valide une demande :
 *  - récupère la demande par id
 *  - envoie un email d’acceptation avec lien d’inscription
 *  - supprime la demande du store
 */
router.post('/validate-account', async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res
      .status(400)
      .json({ success: false, error: 'ID de demande manquant.' });
  }

  const request = pendingRequestsStore.getById(Number(id));
  if (!request) {
    return res
      .status(404)
      .json({ success: false, error: 'Demande introuvable.' });
  }

  try {
    await sendValidationEmail(request);
    pendingRequestsStore.remove(request.id);

    return res.json({ success: true });
  } catch (err) {
    console.error('Erreur validate-account:', err);
    return res
      .status(500)
      .json({ success: false, error: 'Erreur lors de la validation.' });
  }
});

/**
 * POST /api/admin/refuse-account
 * Refuse une demande :
 *  - récupère la demande par id
 *  - envoie un email de refus
 *  - supprime la demande du store
 */
router.post('/refuse-account', async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res
      .status(400)
      .json({ success: false, error: 'ID de demande manquant.' });
  }

  const request = pendingRequestsStore.getById(Number(id));
  if (!request) {
    return res
      .status(404)
      .json({ success: false, error: 'Demande introuvable.' });
  }

  try {
    await sendRefusalEmail(request);
    pendingRequestsStore.remove(request.id);

    return res.json({ success: true });
  } catch (err) {
    console.error('Erreur refuse-account:', err);
    return res
      .status(500)
      .json({ success: false, error: 'Erreur lors du refus.' });
  }
});

module.exports = router;
