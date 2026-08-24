export default function handler(req, res) {
  // Este endpoint devuelve la clave de entorno de Vercel de forma interna
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return res.status(500).json({ error: 'La API Key no está configurada en Vercel.' });
  }
  res.status(200).json({ key: key });
}
