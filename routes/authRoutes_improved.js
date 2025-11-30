const express = require('express');
const { supabase, supabaseAdmin } = require('../services/supabaseClient');
const { verifyToken, verifyRole } = require('../middleware/auth');

const router = express.Router();

// ===== MEDECIN =====

// Connexion Médecin
router.post('/medecin/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis.' });
  }

  try {
    // Vérifier dans la table utilisateur avec id_utilisateur_medecin = 1 (médecin)
    const { data: dbUser, error: dbError } = await supabase
      .from('utilisateur')
      .select('*')
      .eq('email', email)
      .eq('id_utilisateur_medecin', 1)
      .single();

    if (dbUser && dbUser.mdp === password) {
      // Connexion réussie via table utilisateur
      return res.status(200).json({
        success: true,
        message: 'Connexion médecin réussie',
        user: {
          id: dbUser.id,
          email: dbUser.email,
          nom: dbUser.nom,
          prenom: dbUser.prenom,
          role: 'medecin',
          profile: dbUser,
        },
      });
    }

    return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
  } catch (err) {
    console.error('Erreur login médecin', err);
    res.status(500).json({ error: 'Connexion impossible pour le moment.' });
  }
});

// ===== ADMIN =====

// Connexion Admin
router.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis.' });
  }

  try {
    // Vérifier dans la table utilisateur avec id_utilisateur_medecin = 3
    const { data: dbUser, error: dbError } = await supabase
      .from('utilisateur')
      .select('*')
      .eq('email', email)
      .eq('id_utilisateur_medecin', 3)
      .single();

    if (dbUser && dbUser.mdp === password) {
      // Connexion réussie via table utilisateur
      return res.status(200).json({
        success: true,
        message: 'Connexion admin réussie',
        user: {
          id: dbUser.id,
          email: dbUser.email,
          nom: dbUser.nom,
          prenom: dbUser.prenom,
          role: 'admin',
          profile: dbUser,
        },
      });
    }

    return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
  } catch (err) {
    console.error('Erreur login admin', err);
    res.status(500).json({ error: 'Connexion impossible pour le moment.' });
  }
});

// ===== PATIENT =====

// Inscription Patient
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

  if (password.length < 6) {
    return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères.' });
  }

  try {
    // Créer l'utilisateur
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

    // Créer le profil patient
    await supabase
      .from('patient_profiles')
      .upsert(
        {
          auth_id: data.user.id,
          email,
          full_name: full_name || null,
          phone,
          secu_number,
          address,
          birth_date,
          height_cm,
          created_at: new Date().toISOString(),
        },
        { onConflict: 'auth_id' }
      );

    res.status(201).json({
      success: true,
      message: 'Patient créé avec succès',
      userId: data.user.id,
    });
  } catch (err) {
    console.error('Erreur inscription patient', err);
    res.status(500).json({ error: 'Inscription impossible pour le moment.' });
  }
});

// Connexion Patient
router.post('/patient/login', async (req, res) => {
  const { email, password, securite_sociale } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis.' });
  }

  try {
    // Vérifier d'abord dans la table utilisateur
    const { data: dbUser, error: dbError } = await supabase
      .from('utilisateur')
      .select('*')
      .eq('email', email)
      .single();

    if (dbUser && dbUser.mdp === password) {
      // Vérifier le numéro de sécurité sociale si fourni
      if (securite_sociale && dbUser.securite_sociale != securite_sociale) {
        return res.status(401).json({ error: 'Numéro de sécurité sociale incorrect' });
      }

      // Connexion réussie via table utilisateur
      return res.status(200).json({
        success: true,
        message: 'Connexion réussie',
        user: {
          id: dbUser.id,
          email: dbUser.email,
          nom: dbUser.nom,
          prenom: dbUser.prenom,
          role: 'patient',
          profile: dbUser,
        },
      });
    }

    // Si pas trouvé dans utilisateur, essayer Supabase Auth
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error && data.user) {
        const { data: profile } = await supabase
          .from('patient_profiles')
          .select('*')
          .eq('email', email)
          .single();

        return res.status(200).json({
          success: true,
          message: 'Connexion réussie',
          session: {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_in: data.session.expires_in,
          },
          user: {
            id: data.user.id,
            email: data.user.email,
            role: 'patient',
            profile: profile || null,
          },
        });
      }
    } catch (authError) {
      console.log('Auth Supabase échoué');
    }

    return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
  } catch (err) {
    console.error('Erreur login patient', err);
    res.status(500).json({ error: 'Connexion impossible pour le moment.' });
  }
});

// ===== MEDECIN =====

// Inscription Médecin
router.post('/medecin/register', async (req, res) => {
  const {
    email,
    password,
    full_name,
    specialite,
    phone,
    adresse,
    numero_licence,
  } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères.' });
  }

  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: {
        role: 'medecin',
      },
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    await supabase
      .from('medecin_profiles')
      .upsert(
        {
          auth_id: data.user.id,
          email,
          full_name,
          specialite,
          phone,
          adresse,
          numero_licence,
          created_at: new Date().toISOString(),
        },
        { onConflict: 'auth_id' }
      );

    res.status(201).json({
      success: true,
      message: 'Médecin créé avec succès',
      userId: data.user.id,
    });
  } catch (err) {
    console.error('Erreur inscription médecin', err);
    res.status(500).json({ error: 'Inscription impossible pour le moment.' });
  }
});

// Connexion Médecin
router.post('/medecin/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis.' });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const { data: profile } = await supabase
      .from('medecin_profiles')
      .select('*')
      .eq('auth_id', data.user.id)
      .single();

    res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in,
      },
      user: {
        id: data.user.id,
        email: data.user.email,
        role: 'medecin',
        profile: profile || null,
      },
    });
  } catch (err) {
    console.error('Erreur login médecin', err);
    res.status(500).json({ error: 'Connexion impossible pour le moment.' });
  }
});

// ===== ADMIN =====

// Connexion Admin
router.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis.' });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Vérifier que l'utilisateur est admin
    if (data.user.user_metadata?.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in,
      },
      user: {
        id: data.user.id,
        email: data.user.email,
        role: 'admin',
      },
    });
  } catch (err) {
    console.error('Erreur login admin', err);
    res.status(500).json({ error: 'Connexion impossible pour le moment.' });
  }
});

// ===== ROUTES PROTÉGÉES =====

// Renouveler le token
router.post('/refresh-token', async (req, res) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    return res.status(400).json({ error: 'Refresh token requis' });
  }

  try {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token,
    });

    if (error) {
      return res.status(401).json({ error: 'Token invalide' });
    }

    res.json({
      success: true,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in,
      },
    });
  } catch (err) {
    console.error('Erreur renouvellement token', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer l'utilisateur connecté
router.get('/me', verifyToken, async (req, res) => {
  try {
    const userRole = req.user.user_metadata?.role;
    let profile = null;

    if (userRole === 'patient') {
      const { data } = await supabase
        .from('patient_profiles')
        .select('*')
        .eq('auth_id', req.user.id)
        .single();
      profile = data;
    } else if (userRole === 'medecin') {
      const { data } = await supabase
        .from('medecin_profiles')
        .select('*')
        .eq('auth_id', req.user.id)
        .single();
      profile = data;
    }

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        role: userRole,
        profile,
      },
    });
  } catch (err) {
    console.error('Erreur récupération utilisateur', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Déconnexion
router.post('/logout', verifyToken, async (req, res) => {
  try {
    await supabase.auth.signOut();
    res.json({ success: true, message: 'Déconnexion réussie' });
  } catch (err) {
    console.error('Erreur déconnexion', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ===== ROUTE POUR AFFICHER LES UTILISATEURS =====

// Récupérer tous les utilisateurs
router.get('/utilisateurs', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('utilisateur')
      .select('*');

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      success: true,
      count: data.length,
      utilisateurs: data,
    });
  } catch (err) {
    console.error('Erreur récupération utilisateurs', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
