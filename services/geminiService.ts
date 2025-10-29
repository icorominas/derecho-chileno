import { GoogleGenAI, Type } from "@google/genai";
import type { CaseDetails, TrialEvent, CaseEvaluation } from '../types';

// Use environment variable for API key
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const caseGenerationSchema = {
    type: Type.OBJECT,
    properties: {
        titulo: { type: Type.STRING, description: 'Título creativo y conciso para el caso legal (ej. "El Testamento Olvidado").' },
        resumen: { type: Type.STRING, description: 'Breve resumen del caso, 1-2 frases.' },
        entrevistaCliente: { type: Type.STRING, description: 'Párrafo en primera persona del cliente explicando su situación al abogado.' },
        partes: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    nombre: { type: Type.STRING },
                    rol: { type: Type.STRING, description: 'Rol de la parte (ej: "Demandante (Tu Cliente)", "Demandado").' }
                },
                required: ['nombre', 'rol']
            }
        },
        hechosClave: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Lista de 3-5 hechos fundamentales y objetivos del caso.'
        },
        evidencia: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Lista de 2-4 pruebas clave disponibles para el jugador (ej. "Contrato firmado", "Correos electrónicos").'
        },
        argumentoContrario: { type: Type.STRING, description: 'El principal argumento o defensa que usará la contraparte.' },
        objetivoJugador: { type: Type.STRING, description: 'El objetivo principal que el jugador debe alcanzar para ganar el caso.' },
        juez: {
            type: Type.OBJECT,
            properties: {
                nombre: { type: Type.STRING, description: 'Nombre completo del juez (ej. "Juez Roberto Salazar").' },
                personalidad: { type: Type.STRING, description: 'Una breve descripción de la personalidad del juez (ej. "Estricto y apegado a la ley.", "Pragmático y busca acuerdos.").' }
            },
            required: ['nombre', 'personalidad']
        },
        glossary: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    termino: { type: Type.STRING },
                    definicion: { type: Type.STRING },
                    fuente: { type: Type.STRING, description: "Opcional. Fuente de la definición, ej. 'Art. 123 del Código Civil'." }
                },
                required: ['termino', 'definicion']
            },
            description: 'Lista de 3-5 términos legales clave relevantes para el caso y sus definiciones.'
        }
    },
    required: ['titulo', 'resumen', 'entrevistaCliente', 'partes', 'hechosClave', 'evidencia', 'argumentoContrario', 'objetivoJugador', 'juez', 'glossary']
};

export async function generateCase(area: string, isCivil: boolean, difficulty: string): Promise<CaseDetails> {
    const caseType = isCivil ? "un procedimiento escrito" : "un juicio oral";
    const prompt = `Genera un caso legal simulado de nivel de dificultad "${difficulty}" en el área de "${area}". El caso debe ser realista para un estudiante de derecho o joven abogado en un sistema legal de derecho continental (como el de Chile o España). El caso debe ser autoconclusivo y centrarse en la argumentación y estrategia legal. El procedimiento es ${caseType}.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: caseGenerationSchema,
                temperature: 0.9,
            },
        });

        const caseJsonString = response.text.trim();
        const generatedCase = JSON.parse(caseJsonString);

        return {
            ...generatedCase,
            id: crypto.randomUUID(),
            area,
            // Fix: Cannot find name 'esCivil'. Did you mean 'isCivil'?
            esCivil: isCivil,
            // Fix: Cannot find name 'dificultad'. Did you mean 'difficulty'?
            dificultad: difficulty,
        } as CaseDetails;

    } catch (error) {
        console.error("Error generating case:", error);
        throw new Error("No se pudo generar el caso. Por favor, intenta de nuevo.");
    }
}

const trialInteractionSchema = {
    type: Type.OBJECT,
    properties: {
        actor: { type: Type.STRING, description: 'Quién habla: JUEZ, DEMANDADO, o SISTEMA.' },
        texto: { type: Type.STRING, description: 'La respuesta o acción de la IA. Si es el juez, debe ser un diálogo judicial. Si es el demandado, su argumento. Si es una propuesta de acuerdo, una frase introductoria.' },
        esDecision: { type: Type.BOOLEAN, description: 'True si esta es la decisión final del juez que concluye el juicio.' },
        esPropuestaADR: { type: Type.BOOLEAN, description: 'True si la contraparte está proponiendo un método alternativo de resolución de conflictos (ADR).' },
        propuestaADR: {
            type: Type.OBJECT,
            properties: {
                tipo: { type: Type.STRING, description: 'El tipo de ADR propuesto (ej: "Transacción", "Mediación").' },
                terminos: { type: Type.STRING, description: 'Los términos concretos de la oferta (ej: "Pagar el 80% de lo demandado a cambio de terminar el juicio.").' }
            },
            description: 'Detalles de la propuesta de ADR. Solo presente si esPropuestaADR es true.'
        },
        opciones: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Opcional. Si el juez hace una pregunta directa, proporciona 2-3 opciones de respuesta breves para el jugador. De lo contrario, omitir.'
        }
    },
    required: ['actor', 'texto', 'esDecision']
};


export async function getNextTrialEvent(caseDetails: CaseDetails, trialHistory: TrialEvent[]): Promise<TrialEvent> {
    const lastPlayerEvent = trialHistory[trialHistory.length - 1];
    const prompt = `
Eres el Juez y la contraparte en una simulación de juicio.
**Contexto del Caso:**
- Título: ${caseDetails.titulo}
- Resumen: ${caseDetails.resumen}
- Área: ${caseDetails.area}
- Objetivo del Jugador: ${caseDetails.objetivoJugador}
- Argumento de la Contraparte: ${caseDetails.argumentoContrario}
- Juez: ${caseDetails.juez?.nombre}, personalidad: ${caseDetails.juez?.personalidad}

**Historial del Juicio (últimos eventos):**
${trialHistory.slice(-4).map(event => `${event.actor}: ${event.texto}`).join('\n')}

**Tu Tarea:**
Basado en el último turno del JUGADOR, actúa como el JUEZ o el abogado DEMANDADO.

1.  **Si el JUEZ debe hablar:** Responde de acuerdo a tu personalidad. Mantén el formalismo judicial.
2.  **Si el DEMANDADO debe hablar:** Presenta un contraargumento basado en tu defensa.
3.  **MECÁNICA ESPECIAL: MÉTODOS ALTERNATIVOS (ADR):** En algún punto estratégico del juicio (ej. si el jugador parece estancado, o después de un argumento clave), como DEMANDADO, puedes proponer un acuerdo.
    - Para hacerlo, activa 'esPropuestaADR: true'.
    - Formula una 'propuestaADR' con 'tipo' y 'terminos'. La oferta debe ser razonable pero favorable para tu lado. Por ejemplo, ofrecer un 70% de lo solicitado.
    - El 'texto' debe ser una introducción a la oferta, ej: "Señoría, con el fin de evitar un litigio prolongado, mi representado quisiera proponer una transacción."
4.  **Si el JUGADOR respondió a una propuesta de ADR:**
    - Si el jugador **RECHAZÓ**, como JUEZ, indica que el juicio continúa.
    - Si el jugador hizo una **CONTRAOFERTA**, como DEMANDADO, evalúala. Puedes ACEPTAR (resultando en esDecision: true, texto: "Aceptamos la contraoferta. Se llega a un acuerdo."), RECHAZAR, o hacer otra contraoferta.
5.  **Progresa el juicio:** Tu respuesta debe hacer avanzar la audiencia.
6.  **Conclusión:** Si el juicio llega a su fin natural, emite una decisión final como JUEZ (esDecision: true).

**Última acción del JUGADOR:**
${lastPlayerEvent.actor}: ${lastPlayerEvent.texto}

Genera la siguiente intervención en el juicio.
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: trialInteractionSchema,
                temperature: 0.7,
            },
        });
        const eventJsonString = response.text.trim();
        const nextEvent = JSON.parse(eventJsonString);
        return nextEvent as TrialEvent;

    } catch (error) {
        console.error("Error getting next trial event:", error);
        return {
            actor: 'SISTEMA',
            texto: 'Hubo un error al procesar la respuesta. Por favor, intenta reformular tu argumento o continúa.',
            esDecision: false,
        };
    }
}

const evaluationSchema = {
    type: Type.OBJECT,
    properties: {
        puntaje: { type: Type.INTEGER, description: 'Puntaje de 0 a 100 evaluando el desempeño del jugador.' },
        analisis: { type: Type.STRING, description: 'Un análisis general y conciso (1-2 frases) del desempeño del jugador, como si fuera un profesor de derecho.' },
        fortalezas: { type: Type.STRING, description: 'Una lista o párrafo detallando 2-3 puntos fuertes en la estrategia y argumentación del jugador.' },
        debilidades: { type: Type.STRING, description: 'Una lista o párrafo detallando 2-3 áreas de mejora o errores cometidos por el jugador.' },
        consejos: { type: Type.STRING, description: 'Un consejo práctico y accionable para que el jugador mejore en futuros casos.' }
    },
    required: ['puntaje', 'analisis', 'fortalezas', 'debilidades', 'consejos']
};


export async function evaluatePerformance(caseDetails: CaseDetails, trialHistory: TrialEvent[]): Promise<CaseEvaluation> {
    const playerActions = trialHistory.filter(e => e.actor === 'JUGADOR').map(e => e.texto).join('\n---\n');
    const finalEvent = trialHistory[trialHistory.length - 1];
    let finalRulingText: string;
    let evaluationContext: string;

    if (finalEvent.esPropuestaADR && (finalEvent.actor === 'JUGADOR' || finalEvent.actor === 'DEMANDADO')) {
        finalRulingText = `El caso se resolvió mediante un acuerdo con los siguientes términos: ${finalEvent.propuestaADR?.terminos || finalEvent.texto}`;
        evaluationContext = "Evalúa el desempeño del estudiante principalmente en su habilidad de negociación. ¿El acuerdo alcanzado fue beneficioso en comparación con su objetivo original? ¿Manejo bien las contraofertas?";
    } else {
        const finalRuling = trialHistory.find(e => e.esDecision);
        finalRulingText = finalRuling ? finalRuling.texto : "No hubo veredicto final.";
        evaluationContext = "Evalúa el desempeño del estudiante en el litigio. Considera la claridad de sus argumentos, su estrategia legal, y si logró su objetivo a través del juicio.";
    }


    const prompt = `
Eres un catedrático de derecho evaluando el desempeño de un estudiante en una simulación de juicio.

**Contexto del Caso:**
- Título: ${caseDetails.titulo}
- Área: ${caseDetails.area}
- Objetivo del Estudiante: ${caseDetails.objetivoJugador}
- Resultado Final: ${finalRulingText}

**Transcripción de las intervenciones del estudiante:**
${playerActions}

**Tu Tarea:**
${evaluationContext} Proporciona una evaluación completa y constructiva.
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro', // Using a more advanced model for better evaluation
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: evaluationSchema,
                temperature: 0.5,
            },
        });

        const evalJsonString = response.text.trim();
        const evaluation = JSON.parse(evalJsonString);

        return evaluation as CaseEvaluation;

    } catch (error) {
        console.error("Error evaluating performance:", error);
        throw new Error("No se pudo generar la evaluación. Por favor, intenta de nuevo.");
    }
}