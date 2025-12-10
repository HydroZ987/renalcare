// routes/registrationRoutes.js
const express = require('express');
const router = express.Router();

const { sendOtpEmail } = require('../services/mailService');

const otpStore = new Map();
// structure : email -> { code, expiresAt, role }

/**
 * POST /api/register/send-code
 * body: { email, role }  // role = 'patient' ou 'medecin'
 */
router.post('/send-code', async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, error: 'Email manquant.' });
    }

    const userRole = role === 'medecin' ? 'medecin' : 'patient';

    // code à 6 chiffres
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 min

    otpStore.set(email, { code, expiresAt, role: userRole });

    console.log(`[REGISTER] OTP ${code} généré pour ${email} (${userRole})`);

    await sendOtpEmail(email, code, userRole);

    return res.json({ success: true });
  } catch (err) {
    console.error('[REGISTER] Erreur send-code :', err);
    return res
      .status(500)
      .json({ success: false, error: "Erreur lors de l'envoi du code." });
  }
});

/**
 * POST /api/register/verify-code
 * body: { email, code }
 */
router.post('/verify-code', (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res
      .status(400)
      .json({ success: false, error: 'Email ou code manquant.' });
  }

  const entry = otpStore.get(email);
  if (!entry) {
    return res
      .status(400)
      .json({ success: false, error: 'Aucun code trouvé pour cet email.' });
  }

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(email);
    return res
      .status(400)
      .json({ success: false, error: 'Code expiré, veuillez en demander un nouveau.' });
  }

  if (entry.code !== code) {
    return res
      .status(400)
      .json({ success: false, error: 'Code incorrect.' });
  }

  // OK : code bon
  console.log(`[REGISTER] OTP validé pour ${email}`);
  return res.json({ success: true, role: entry.role });
});

module.exports = router;
