// routes/contactRoutes.js
const express = require('express');
const router = express.Router();

const { addRequest } = require('../services/pendingRequestsStore');
const { sendContactNotification } = require('../services/mailService');

// POST /api/contact
router.post('/', async (req, res) => {
  try {
    const { prenom, nom, email, telephone, type, sujet, message } = req.body;

    if (!prenom || !nom || !email || !type || !sujet || !message) {
      return res
        .status(400)
        .json({ success: false, error: 'Champs obligatoires manquants.' });
    }

    // créer l’objet de demande
    const request = addRequest({
      prenom,
      nom,
      email,
      telephone,
      type,   // 'patient' ou 'medecin'
      sujet,
      message,
    });

    // envoyer un mail à l’admin
    await sendContactNotification(request);

    return res.json({
      success: true,
      message: 'Formulaire envoyé, un infirmier vous répondra rapidement.',
    });
  } catch (err) {
    console.error('[CONTACT] Erreur lors de l’envoi du formulaire :', err);
    return res
      .status(500)
      .json({ success: false, error: "Erreur serveur : " + err.message });
  }
});

module.exports = router;
