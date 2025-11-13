const express = require('express');
const { supabase, supabaseAdmin } = require('../services/supabaseClient');

const router = express.Router();

router.post('/patient/register', async (req, res) => {
  const {
    email,
    password,
    phone,
    secu_number,
    address,
    birth_date,
    height_cm,
    full_name,
  } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis.' });
  }

  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: {
        role: 'patient',
        phone,
      },
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    await supabaseAdmin.from('patient_profiles').upsert(
      {
        auth_id: data.user.id,
        email,
        full_name: full_name || null,
        phone,
        secu_number,
        address,
        birth_date,
        height_cm,
      },
      { onConflict: 'auth_id' },
    );

    res.json({ success: true, userId: data.user.id });
  } catch (err) {
    console.error('Erreur inscription patient', err);
    res.status(500).json({ error: 'Inscription impossible pour le moment.' });
  }
});

router.post('/patient/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis.' });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    const { data: profile } = await supabase
      .from('patient_profiles')
      .select('*')
      .eq('auth_id', data.user.id)
      .single();

    res.json({
      success: true,
      session: data.session,
      profile,
    });
  } catch (err) {
    console.error('Erreur login patient', err);
    res.status(500).json({ error: 'Connexion impossible pour le moment.' });
  }
});

router.post('/logout', async (req, res) => {
  try {
    await supabase.auth.signOut();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Impossible de déconnecter la session.' });
  }
});

module.exports = router;
