const express = require('express');
const router = express.Router();

// GET demandes, utilisateurs
router.get('/demandes', (req, res) => res.json({ success: true, demandes: [] }));
router.get('/utilisateurs', (req, res) => res.json({ success: true, utilisateurs: [] }));

// PUT / PATCH routes
router.put('/demandes/:id', (req, res) => {
    console.log(req.body);
    res.json({ success: true, message: `Demande ${req.params.id} mise à jour` });
});

router.patch('/utilisateurs/:id/status', (req, res) => {
    console.log(req.body);
    res.json({ success: true, message: `Statut utilisateur ${req.params.id} modifié` });
});

module.exports = router;
