// Fix: Added export to all types to make them available for import in other files.
export interface AvatarSettings {
  hairstyle: 'corto' | 'medio' | 'largo' | 'recogido' | 'calvo';
  hairColor: string;
  facialHair: 'none' | 'barba' | 'bigote';
  glasses: 'none' | 'redondas' | 'rectangulares';
  skinTone: string;
  suitColor: string;
  tieColor: string;
}

export interface GlossaryTerm {
    termino: string;
    definicion: string;
    fuente?: string;
}

export interface CaseParty {
    nombre: string;
    rol: string;
}

export interface GuidedStep {
    trigger: string;
    title: string;
    text: string;
}

export interface CaseDetails {
    id?: string;
    isGuided?: boolean;
    titulo: string;
    resumen: string;
    area: string;
    partes: CaseParty[];
    evidencia: string[];
    objetivoJugador: string;
    dificultad: 'Introductorio' | 'Intermedio' | 'Avanzado' | string;
    esCivil: boolean;
    entrevistaCliente: string;
    objetivosDemanda?: string;
    glossary?: GlossaryTerm[];
    guidedSteps?: GuidedStep[];
    hechosClave?: string[];
    argumentoContrario?: string;
    juez?: {
        nombre: string;
        personalidad: string;
    };
}

export interface GameState {
    stage: 'case-selection' | 'pre-trial' | 'trial' | 'end-screen' | 'appeal';
    currentCase: CaseDetails | null;
    caseHistory: CompletedCase[];
    isLoading: boolean;
    error: string | null;
    username: string;
    avatarSettings: AvatarSettings;
}

export interface ADRProposal {
    tipo: 'Transacción' | 'Mediación' | 'Arbitraje' | 'Acuerdo';
    terminos: string;
}

export interface TrialEvent {
    actor: 'JUEZ' | 'DEMANDANTE' | 'DEMANDADO' | 'SISTEMA' | 'JUGADOR';
    texto: string;
    esDecision?: boolean;
    opciones?: string[];
    esPropuestaADR?: boolean;
    propuestaADR?: ADRProposal;
}

export interface CaseEvaluation {
    puntaje: number;
    analisis: string;
    fortalezas: string;
    debilidades: string;
    consejos: string;
}

export interface CompletedCase {
    id: string;
    caseDetails: CaseDetails;
    evaluation: CaseEvaluation;
    completedAt: string; // ISO string
}