import { GoogleGenAI } from '@google/genai';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const form = formidable({});
  
  try {
    const [fields, files] = await form.parse(req);
    const audioFile = files.audio?.[0];

    if (!audioFile) {
      return res.status(400).json({ error: 'No se subió ningún archivo de audio' });
    }

    const buffer = fs.readFileSync(audioFile.filepath);
    const base64Audio = buffer.toString('base64');

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            mimeType: 'audio/wav',
            data: base64Audio
          }
        },
        `Analiza detalladamente este audio en formato WAV.
        Extrae los datos clave y genera un reporte estructurado en formato Markdown con las siguientes secciones:
        1. Resumen Ejecutivo
        2. Datos e Información Clave Extraída
        3. Compromisos / Acuerdos
        4. Acciones Recomendadas`
      ]
    });

    return res.status(200).json({ reporte: response.text });
  } catch (error) {
    return res.status(500).json({ error: 'Error procesando el audio: ' + error.message });
  }
}
