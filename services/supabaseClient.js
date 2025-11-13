// const { createClient } = require('@supabase/supabase-js');

// const requiredEnv = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];
// const missing = requiredEnv.filter((key) => !process.env[key]);

// if (missing.length > 0) {
//   throw new Error(
//     `Configuration Supabase incomplète. Variables manquantes: ${missing.join(
//       ', ',
//     )}. Copiez .env.example et renseignez vos clés Supabase.`,
//   );
// }

// const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
//   auth: {
//     autoRefreshToken: false,
//     persistSession: false,
//   },
// });

// module.exports = { supabase, supabaseAdmin };
