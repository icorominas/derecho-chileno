import { GoogleGenAI, Type } from "@google/genai";
import type { CaseDetails, Evaluation, TrialStep, TrialContinuation, DemandEvaluation } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const caseSchema = {
  type: Type.OBJECT,
  properties: {
    titulo: { type: Type.STRING, description: 'Título del caso.' },
    resumen: { type: Type.STRING, description: 'Resumen completo del caso para referencia interna.' },
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
    objetivoJugador: { type: Type.STRING, description: 'La meta general del jugador (ej: "Lograr la máxima indemnización para tu cliente").' },
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
    },
    entrevistaCliente: { type: Type.STRING, description: 'Diálogo o monólogo detallado del cliente explicando su situación. Esto es lo primero que el jugador verá.' },
    objetivosDemanda: { type: Type.STRING, description: 'String conciso listando los puntos y peticiones clave que una demanda exitosa debería incluir. Para evaluación interna, no mostrar al jugador.' },
  },
  required: ['titulo', 'resumen', 'area', 'partes', 'evidencia', 'objetivoJugador', 'dificultad', 'esCivil', 'glossary', 'entrevistaCliente', 'objetivosDemanda']
};

export const generateCase = async (area: string, isCivil: boolean, difficulty: 'Introductorio' | 'Intermedio' | 'Avanzado'): Promise<CaseDetails> => {
    const prompt = `Actúa como un experto en Derecho Procesal Chileno. Genera un caso legal ficticio para un estudiante, comenzando desde la primera entrevista con el cliente.
    El área es '${area}', la dificultad es '${difficulty}', y el procedimiento es ${isCivil ? 'escrito' : 'oral'}.
    La respuesta DEBE ser un objeto JSON válido y contener:
    1. 'titulo', 'resumen', 'area', 'partes', 'evidencia', 'dificultad', 'esCivil', 'glossary'.
    2. 'entrevistaCliente': Un diálogo o monólogo detallado donde el cliente explica su situación, los hechos y qué quiere lograr. Esto es lo primero que verá el estudiante.
    3. 'objetivosDemanda': Un string conciso con los puntos clave (petitum) que una demanda exitosa debería incluir para este caso. Este campo es para evaluación interna y no se muestra al jugador.
    4. El 'objetivoJugador' debe ser una meta general para el jugador (ej. 'Lograr la máxima indemnización para tu cliente').`;
    
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

const demandEvaluationSchema = {
    type: Type.OBJECT,
    properties: {
        esAdmisible: { type: Type.BOOLEAN, description: '¿La demanda cumple los requisitos mínimos para ser admitida a trámite?' },
        analisis: { type: Type.STRING, description: 'Breve retroalimentación sobre la calidad de la demanda, explicando por qué es o no admisible.' },
        narrativaSiguiente: { type: Type.STRING, description: 'Si es admisible, la resolución del tribunal y el siguiente paso. Si no, la resolución de inadmisibilidad.' }
    },
    required: ['esAdmisible', 'analisis', 'narrativaSiguiente']
};


export const startTrialAfterDemand = async (caseDetails: CaseDetails, demandText: string): Promise<DemandEvaluation> => {
    const prompt = `Actúas como un Juez de un tribunal chileno. Un estudiante de derecho (el jugador) ha presentado una demanda basada en el siguiente caso:
- Resumen del caso: ${caseDetails.resumen}
- Objetivos que la demanda debía cumplir: ${caseDetails.objetivosDemanda}

El texto de la demanda presentada por el estudiante es:
"${demandText}"

Tu tarea:
1.  **Analiza la demanda**: Compara el texto del estudiante con los objetivos que debía cumplir. ¿Es clara, bien fundamentada, incluye las peticiones correctas?
2.  **Decide la admisibilidad**: Basado en tu análisis, determina si la demanda es 'admisible' para continuar el juicio.
3.  **Genera la respuesta JSON**:
    -   'analisis': Proporciona una breve retroalimentación sobre la calidad de la demanda.
    -   'esAdmisible': boolean.
    -   'narrativaSiguiente': Si es admisible, escribe la resolución del tribunal admitiendo la demanda y narrando el siguiente paso procesal (ej. "El tribunal resuelve: 'Téngase por interpuesta la demanda. Notifíquese a la contraparte para que conteste dentro del plazo legal.'"). Si no es admisible, esta narrativa debe explicar por qué fue rechazada (ej. "El tribunal resuelve: 'Inadmisible la demanda por no cumplir con los requisitos del Art. 254 del Código de Procedimiento Civil...'").

La respuesta DEBE ser un objeto JSON válido.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: demandEvaluationSchema,
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as DemandEvaluation;

    } catch (error) {
        console.error("Error evaluating demand with Gemini:", error);
        throw new Error("Failed to evaluate demand from the AI service.");
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

    const prompt = `Actúas como un Director de Juego experto para una simulación de juicio ultra-realista, basada en el sistema legal de Chile. Tu rol es triple: eres el Juez, la contraparte y el narrador.

**FUNDAMENTO LEGAL OBLIGATORIO:** Tus respuestas DEBEN estar fundamentadas en los principios y procedimientos de la legislación chilena. Dependiendo del caso, consulta mentalmente el Código Civil, Código Penal, Código de Procedimiento Civil y Código del Trabajo de Chile.

**CONTEXTO DEL CASO:**
- Resumen: ${caseDetails.resumen}
- Área Legal: ${caseDetails.area}
- Procedimiento: ${procedureType}
- Objetivo del jugador: ${caseDetails.objetivoJugador}
- Historial hasta ahora: ${JSON.stringify(history)}

**ÚLTIMA ACCIÓN DEL JUGADOR:**
${lastAction}

**TU TAREA (en 3 partes):**

1.  **REACCIÓN DE LA CONTRAPARTE:** Describe la reacción del abogado de la contraparte a la acción del jugador. ¿Se opone? ¿Presenta una contra-argumentación? ¿Queda en una posición débil? Su diálogo debe ser astuto, profesional y creíble.

2.  **DECISIÓN DEL JUEZ:** Como Juez, responde a la situación. Esto puede incluir admitir o rechazar una petición, llamar al orden, hacer una pregunta a alguna de las partes, o dictar una resolución interlocutoria. El Juez debe sonar imparcial, autoritario y basar sus decisiones en la ley.

3.  **NARRADOR Y SIGUIENTE PASO:**
    *   Combina las reacciones de la contraparte y las decisiones del Juez en una **única \`narrativa\` cohesiva y dramática**. Formatea el texto claramente, usando prefijos como "**Juez:**", "**Contraparte:**" o "**Narrador:**" para indicar quién habla o qué sucede.
    *   Proporciona \`stageFeedback\` como un profesor de derecho, analizando la jugada del estudiante y citando legislación chilena relevante si es posible.
    *   Determina si el juicio termina (\`juegoTerminado\`).
    *   Si el juicio es **oral**, proporciona 3 nuevas \`opciones\` de acción para el jugador. Si es **escrito**, la narrativa debe indicar el siguiente paso procesal y las \`opciones\` deben ser un array vacío.

La respuesta DEBE ser un objeto JSON válido con el formato solicitado.`;
    
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
