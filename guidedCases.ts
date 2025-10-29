import type { CaseDetails } from './types';

export const TUTORIAL_CASE_DESPIDO_INJUSTIFICADO: CaseDetails = {
    isGuided: true,
    titulo: 'Caso Guiado: Despido Injustificado',
    resumen: 'Ana Pérez fue despedida de su trabajo como diseñadora gráfica en "Publicidad Rápida" después de 1 año. La empresa argumenta "necesidades de la empresa", pero Ana sospecha que fue por sus constantes solicitudes de pago de horas extras adeudadas. Ella busca el pago de sus indemnizaciones y un recargo legal.',
    area: 'Derecho Laboral',
    partes: [
        { nombre: 'Ana Pérez', rol: 'Demandante (Tu Cliente)' },
        { nombre: 'Publicidad Rápida Ltda.', rol: 'Demandado' },
    ],
    evidencia: [
        'Contrato de trabajo de Ana Pérez.',
        'Carta de despido que invoca "necesidades de la empresa".',
        'Correos electrónicos de Ana solicitando pago de horas extras.',
    ],
    objetivoJugador: 'Lograr que se declare el despido como injustificado y obtener el pago de las indemnizaciones correspondientes con el recargo legal del 30%.',
    dificultad: 'Introductorio',
    esCivil: false,
    entrevistaCliente: 'Abogado, gracias por recibirme. Me llamo Ana Pérez. Trabajé un año como diseñadora en "Publicidad Rápida" y ayer me despidieron. Me entregaron una carta que dice "necesidades de la empresa", pero no entiendo, ¡si hasta me pedían que me quedara hasta tarde! Justamente, el mes pasado envié varios correos pidiendo que me pagaran esas horas extras y nunca lo hicieron. Siento que se quisieron deshacer de mí para no pagarme. Solo quiero lo que es justo: mi finiquito y que se reconozca que esto no fue correcto.',
    objetivosDemanda: 'La demanda debe: 1. Individualizar a las partes. 2. Exponer los hechos del despido. 3. Argumentar por qué la causal "necesidades de la empresa" es improcedente. 4. Solicitar que se declare el despido como injustificado. 5. Pedir el pago de la indemnización por años de servicio y la sustitutiva del aviso previo, con el recargo del 30% del Art. 168 del Código del Trabajo.',
    glossary: [
        { termino: 'Despido Injustificado', definicion: 'Cuando el despido no se ajusta a ninguna de las causales legales, o la causal invocada por el empleador es falsa o improcedente.' },
        { termino: 'Necesidades de la Empresa', definicion: 'Causal de despido del Art. 161 del Código del Trabajo, relacionada con cambios en las condiciones del mercado o la economía que hacen necesaria la separación de uno o más trabajadores.' },
        { termino: 'Recargo Legal', definicion: 'Aumento porcentual de la indemnización por años de servicio que el juez puede ordenar si considera el despido como injustificado, improcedente o indebido (ej. 30%).' },
    ],
    guidedSteps: [
        {
            trigger: 'pre-trial-drafting',
            title: 'Tu Primera Demanda Laboral',
            text: '¡Bienvenido a tu primer caso! Tu objetivo es redactar la demanda. Estructúrala así:\n1. **Individualiza las partes:** Menciona a tu cliente (demandante) y a la empresa (demandada).\n2. **Describe los hechos:** Explica la relación laboral y cómo ocurrió el despido.\n3. **Fundamenta el derecho:** Argumenta por qué la causal "necesidades de la empresa" no aplica en este caso.\n4. **Haz tu petición (Petitum):** Solicita al juez que declare el despido como injustificado y ordene el pago de las indemnizaciones con el recargo correspondiente.'
        },
        {
            trigger: 'trial-turn-1',
            title: 'Audiencia Preparatoria: Ratificación y Conciliación',
            text: 'Has llegado a la primera audiencia. El juez primero te pedirá que **ratifiques la demanda**. Luego, llamará a las partes a **conciliación** (llegar a un acuerdo).\n\n**Tu tarea:** Presenta un argumento inicial breve. Ratifica la demanda en nombre de tu cliente y muéstrate abierto a una conciliación, pero deja clara tu postura firme sobre la injusticia del despido.'
        }
    ]
};