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

  const form = formidable({
    maxFileSize: 50 * 1024 * 1024, // Permite archivos de hasta 50MB
  });
  
  try {
    const [fields, files] = await form.parse(req);
    const audioFile = files.audio?.[0];

    if (!audioFile) {
      return res.status(400).json({ error: 'No se subió ningún archivo de audio' });
    }

    const buffer = fs.readFileSync(audioFile.filepath);
    const base64Audio = buffer.toString('base64');

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = `Analiza detalladamente este audio de llamada de callcenter y extrae la información en un formato JSON estricto con la siguiente estructura exacta:
    {
      "participantes": {
        "asesor": "Nombre completo del asesor o asesora mencionado en la llamada",
        "cliente": "Nombre completo del cliente o titular mencionado en la llamada"
      },
      "metricas": {
        "tiempoTotal": "16:54 min",
        "tiempoHablado": "15:49 min",
        "porcHablado": "93.6%",
        "tiempoSilencio": "01:04 min",
        "porcSilencio": "6.4%",
        "segAsesor": 500,
        "segCliente": 449,
        "segSilencio": 65,
        "silencioAsesorSeg": 52.5,
        "silencioClienteSeg": 12.0
      },
      "lineas": "Identificación de líneas telefónicas, titulares, ofertas y trámites realizados.",
      "silencios": [
        {"num": 1, "inicia": "01:59", "iniciaSeg": 119, "termina": "02:04", "duracion": "5.0 seg", "responsable": "Cliente", "causa": "Búsqueda de número..."}
      ],
      "resumen": "Resumen narrativo claro de los acuerdos y gestiones de la llamada.",
      "transcripcion": [
        {"tiempo": "00:00 - 00:01", "hablante": "Asesora", "dialogo": "Aló, hola..."}
      ],
      "qa": "Sugerencias de mejora para el control de calidad (frases de espera, pausas CRM, etc.)"
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [
        {
          inlineData: {
            mimeType: 'audio/wav',
            data: base64Audio
          }
        },
        prompt
      ],
      config: {
        responseMimeType: 'application/json'
      }
    });

    const reporteJSON = JSON.parse(response.text);
    return res.status(200).json({ reporteJSON });
  } catch (error) {
    return res.status(500).json({ error: 'Error procesando el audio: ' + error.message });
  }
}
