import { GoogleGenAI, Type } from "@google/genai";
import type { CaseDetails, Evaluation, TrialStep, TrialContinuation } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const caseSchema = {
  type: Type.OBJECT,
  properties: {
    titulo: { type: Type.STRING, description: 'Título del caso.' },
    resumen: { type: Type.STRING, description: 'Resumen completo del caso.' },
    area: { type: Type.STRING, description: 'Área del derecho (ej. Civil, Penal, Laboral).' },
    partes: {
      type: Type.ARRAY,
      description: 'Personas involucradas en el caso.',
      items: {
        type: Type.OBJECT,
        properties: {
          nombre: { type: Type.STRING },
          rol: { type: Type.STRING, description: 'Ej: Demandante, Acusado, Testigo clave.' }
        },
        required: ['nombre', 'rol']
      }
    },
    evidencia: {
      type: Type.ARRAY,
      description: 'Lista de la evidencia disponible al inicio.',
      items: { type: Type.STRING }
    },
    objetivoJugador: { type: Type.STRING, description: 'La meta principal del jugador.' },
    dificultad: { type: Type.STRING, description: 'Nivel de dificultad: "Introductorio", "Intermedio", o "Avanzado".' },
    esCivil: { type: Type.BOOLEAN, description: 'True si el procedimiento es principalmente escrito (Civil, Familia), False si es oral (Penal, Laboral).' },
    glossary: {
        type: Type.ARRAY,
        description: 'Lista de 5 a 7 términos legales clave en este caso, con definiciones basadas en la ley chilena.',
        items: {
            type: Type.OBJECT,
            properties: {
                termino: { type: Type.STRING },
                definicion: { type: Type.STRING },
                fuente: { type: Type.STRING, description: 'Opcional. Cita legal chilena relevante (ej. Art. 1445 del Código Civil).' }
            },
            required: ['termino', 'definicion']
        }
    }
  },
  required: ['titulo', 'resumen', 'area', 'partes', 'evidencia', 'objetivoJugador', 'dificultad', 'esCivil', 'glossary']
};

export const generateCase = async (area: string, isCivil: boolean, difficulty: 'Introductorio' | 'Intermedio' | 'Avanzado'): Promise<CaseDetails> => {
    const prompt = `Actúa como un experto en Derecho Procesal Chileno. Genera un caso legal ficticio pero realista para un estudiante de derecho en el área de '${area}'.
    La dificultad del caso debe ser: '${difficulty}'.
    El procedimiento es ${isCivil ? 'escrito (como en Derecho Civil/Familia)' : 'oral (como en Derecho Penal/Laboral)'}.
    Incluye un título, resumen, partes, evidencia, y el objetivo del jugador.
    Crucial: Genera también un glosario de 5-7 términos legales fundamentales para entender este caso, con definiciones claras y concisas basadas en la ley chilena, citando la fuente legal si es posible.
    La respuesta DEBE ser un objeto JSON válido.`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: caseSchema,
            }
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as CaseDetails;

    } catch (error) {
        console.error("Error generating case with Gemini:", error);
        throw new Error("Failed to generate a case from the AI service.");
    }
};

const trialContinuationSchema = {
  type: Type.OBJECT,
  properties: {
    narrativa: { type: Type.STRING, description: 'La descripción de lo que sucede en el juicio como resultado de la acción del jugador.' },
    opciones: {
      type: Type.ARRAY,
      description: 'Para juicios orales, 3 nuevas opciones de acción. Para juicios escritos, un array vacío.',
      items: { type: Type.STRING }
    },
    juegoTerminado: {
      type: Type.BOOLEAN,
      description: 'Indica si el juicio ha llegado a una conclusión natural con esta acción.'
    },
    stageFeedback: {
        type: Type.OBJECT,
        description: 'Retroalimentación constructiva sobre la última acción del jugador.',
        properties: {
            analisis: { type: Type.STRING, description: 'Análisis breve de la acción.' },
            citaLegal: { type: Type.STRING, description: 'Opcional. Cita legal chilena relevante que apoya el análisis.' }
        },
        required: ['analisis']
    }
  },
  required: ['narrativa', 'opciones', 'juegoTerminado', 'stageFeedback']
};

export const advanceTrial = async (caseDetails: CaseDetails, history: TrialStep[], playerInput: string): Promise<TrialContinuation> => {
    const procedureType = caseDetails.esCivil ? 'escrito' : 'oral';
    const lastAction = caseDetails.esCivil 
        ? `El jugador ha presentado el siguiente escrito: "${playerInput}"`
        : `El jugador ha decidido: "${playerInput}"`;

    const prompt = `Eres un simulador de juicio basado en el Derecho Chileno, actuando como Juez y contraparte.
El juicio es de tipo ${procedureType}.
Contexto del caso: ${caseDetails.resumen}
Objetivo del jugador: ${caseDetails.objetivoJugador}
Historial de decisiones del jugador: ${JSON.stringify(history)}.
La última acción del jugador fue: ${lastAction}.

1.  **Evalúa la acción:** Proporciona una retroalimentación breve y directa sobre la última acción del jugador (stageFeedback), indicando si fue una buena estrategia y citando alguna norma legal chilena si aplica.
2.  **Avanza la narrativa:** Describe el siguiente evento en el juicio de forma realista y dramática, siguiendo el procedimiento chileno correspondiente.
3.  **Define el siguiente paso:**
    *   Si el juicio es **oral**, presenta 3 nuevas opciones claras y concisas para el jugador.
    *   Si el juicio es **escrito**, la narrativa debe indicar qué se espera a continuación (ej. "La contraparte ha sido notificada y tiene un plazo para responder."). Las opciones deben ser un array vacío.
4.  **Concluye si es necesario:** Determina si el juicio termina aquí.

La respuesta DEBE ser un objeto JSON válido.`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: trialContinuationSchema,
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as TrialContinuation;

    } catch (error) {
        console.error("Error advancing trial with Gemini:", error);
        throw new Error("Failed to advance trial from the AI service.");
    }
};

const evaluationSchema = {
    type: Type.OBJECT,
    properties: {
        puntaje: { type: Type.NUMBER, description: 'Puntaje de 0 a 100.' },
        analisis: { type: Type.STRING, description: 'Análisis general del desempeño.' },
        fortalezas: { type: Type.STRING },
        debilidades: { type: Type.STRING },
        consejos: { type: Type.STRING, description: 'Consejos para mejorar.' }
    },
    required: ['puntaje', 'analisis', 'fortalezas', 'debilidades', 'consejos']
};


export const evaluatePerformance = async (history: TrialStep[], objective: string): Promise<Evaluation> => {
    const prompt = `Actúa como un catedrático de Derecho Procesal de una prestigiosa universidad chilena. Un estudiante ha completado un juicio simulado.
Historial de decisiones tomadas: ${JSON.stringify(history)}.
Objetivo del caso: "${objective}".

Evalúa el desempeño del estudiante. Proporciona un puntaje de 0 a 100, un análisis de sus fortalezas y debilidades, y consejos concretos para mejorar, citando artículos pertinentes de los Códigos chilenos cuando sea apropiado. La respuesta DEBE ser un objeto JSON válido.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
             config: {
                responseMimeType: 'application/json',
                responseSchema: evaluationSchema,
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as Evaluation;

    } catch (error) {
        console.error("Error evaluating performance with Gemini:", error);
        throw new Error("Failed to evaluate performance from the AI service.");
    }
};
