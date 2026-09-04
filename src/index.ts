import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT ?? 1234;

// Start server (Vercel no ejecuta esto, usa api/index.mjs)
if(process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    console.log(`💾 Supabase: ${process.env.SUPABASE_URL}`);
  });
}
