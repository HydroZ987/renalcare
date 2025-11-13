//running ther server with this command: npm run dev
require('dotenv').config();

const path = require('path');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Dossier HTML
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes HTML
const htmlRoot = path.join(publicDir, 'html');
const serveHtml = (relativePath) => (req, res) =>
  res.sendFile(path.join(htmlRoot, relativePath));

const htmlRoutes = [
  { paths: ['/'], file: 'index.html' },
  { paths: ['/admin'], file: 'admin/admin-dashboard-complet.html' },
  { paths: ['/admin/login'], file: 'admin/admin-login.html' },
  { paths: ['/medecin/dashboard'], file: 'Medecin/medecin-dashboard-complet.html' },
  { paths: ['/medecin/login'], file: 'Medecin/medecin-login.html' },
  { paths: ['/patient/dashboard'], file: 'Patient/patient-dashboard.html' },
  { paths: ['/patient/login'], file: 'Patient/patient-login.html' },
  { paths: ['/patient/register'], file: 'Patient/patient-inscription.html' },
  {
    paths: ['/contact', '/patient/contact', '/medecin/contact'],
    file: 'contact-infirmier.html',
  },
  {
    paths: ['/medecin/mdp_oubli', '/patient/mdp_oubli'],
    file: 'mot-de-passe-oublie.html',
  },
  { paths: ['/patient/treatment'], file: 'Patient/treatment.html' },
  { paths: ['/patient/document'], file: 'Patient/document.html' },
  { paths: ['/patient/messagerie'], file: 'Patient/messagerie.html' },
  { paths: ['/patient/questionnaire'], file: 'Patient/questionnaire.html' },
  { paths: ['/patient/rendez-vous'], file: 'Patient/rendez-vous.html' },
  { paths: ['/patient/resultat'], file: 'Patient/resultat.html' },
];

htmlRoutes.forEach(({ paths, file }) => {
  paths.forEach((routePath) => app.get(routePath, serveHtml(file)));
});


// Routes API
const patientRoutes = require('./routes/patientRoutes');
const authRoutes = require('./routes/authRoutes');

app.use('/api/patients', patientRoutes);
app.use('/api/auth', authRoutes);

// 404 fallback
app.use((req, res) => {
  if (req.accepts('html')) {
    return res.status(404).sendFile(path.join(publicDir, '/html/error404.html'));
  }
  res.status(404).json({ error: 'Not found' });
});

app.listen(port, () => console.log(`Serveur démarré sur http://localhost:${port}`));
