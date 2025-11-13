const express = require('express');
const { supabaseAdmin } = require('../services/supabaseClient');

const router = express.Router();

router.get('/:id/profile', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('patient_profiles')
      .select('*')
      .eq('auth_id', req.params.id)
      .single();

    if (error) {
      return res.status(404).json({ error: error.message });
    }

    res.json({ success: true, profile: data });
  } catch (err) {
    res.status(500).json({ error: 'Impossible de récupérer le profil patient.' });
  }
});

router.post('/:id/questionnaires', async (req, res) => {
  const patientId = req.params.id;
  const {
    completed_at,
    answers,
    age,
    height_cm,
    weight_kg,
    phone,
    secu_number,
    address,
    metadata,
  } = req.body;

  try {
    const { data, error } = await supabaseAdmin.from('patient_questionnaires').insert({
      patient_id: patientId,
      completed_at: completed_at || new Date().toISOString(),
      answers,
      age,
      height_cm,
      weight_kg,
      phone,
      secu_number,
      address,
      metadata,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, entry: data[0] });
  } catch (err) {
    res.status(500).json({ error: 'Impossible d’enregistrer le questionnaire.' });
  }
});

router.get('/:id/questionnaires', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('patient_questionnaires')
      .select('*')
      .eq('patient_id', req.params.id)
      .order('completed_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, questionnaires: data });
  } catch (err) {
    res.status(500).json({ error: 'Impossible de récupérer les questionnaires.' });
  }
});

module.exports = router;
