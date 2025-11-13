const express = require('express');
const router = express.Router();

// GET médecin info
router.get('/me', (req, res) => res.json({ success: true, data: { name: 'Médecin Test' } }));

// GET stats, patients
router.get('/:id/stats', (req, res) => res.json({ success: true, stats: {} }));
router.get('/:id/patients', (req, res) => res.json({ success: true, patients: [] }));

// GET patient suivi, traitements, analyses, alertes
router.get('/patients/:id/suivi', (req, res) => res.json({ success: true, suivi: [] }));
router.get('/patients/:id/traitements', (req, res) => res.json({ success: true, traitements: [] }));
router.get('/patients/:id/analyses', (req, res) => res.json({ success: true, analyses: [] }));
router.get('/patients/:id/alertes', (req, res) => res.json({ success: true, alertes: [] }));

// POST routes
router.post('/activate', (req, res) => {
    console.log(req.body);
    res.json({ success: true, message: 'Médecin activé' });
});

router.post('/suivi/:id/note-medecin', (req, res) => {
    console.log(req.body);
    res.json({ success: true, message: `Note ajoutée pour patient ${req.params.id}` });
});

router.post('/patients/:id/traitements', (req, res) => {
    console.log(req.body);
    res.json({ success: true, message: `Traitement ajouté pour patient ${req.params.id}` });
});

module.exports = router;
