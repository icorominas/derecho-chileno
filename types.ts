export enum GameState {
    CASE_SELECTION,
    PRE_TRIAL,
    IN_TRIAL,
    TRIAL_END,
}

export interface CaseParty {
    nombre: string;
    rol: string;
}

export interface GlossaryTerm {
    termino: string;
    definicion: string;
    fuente?: string;
}

export interface GuidedStep {
    trigger: string; // e.g., 'pre-trial-drafting', 'trial-turn-1'
    title: string;
    text: string;
}

export interface CaseDetails {
    titulo: string;
    resumen: string;
    area: string;
    partes: CaseParty[];
    evidencia: string[];
    objetivoJugador: string;
    dificultad: 'Introductorio' | 'Intermedio' | 'Avanzado';
    esCivil: boolean;
    glossary: GlossaryTerm[];
    entrevistaCliente: string;
    objetivosDemanda: string;
    isGuided?: boolean;
    guidedSteps?: GuidedStep[];
}

export interface TrialStep {
    accion: string;
    narrativa: string;
    submission?: string;
}

export interface StageFeedback {
    analisis: string;
    citaLegal?: string;
}

export interface TrialContinuation {
    narrativa: string;
    opciones: string[];
    juegoTerminado: boolean;
    stageFeedback?: StageFeedback;
}

export interface Evaluation {
    puntaje: number;
    analisis: string;
    fortalezas: string;
    debilidades: string;
    consejos: string;
}

export interface AvatarSettings {
  hairstyle: 'corto' | 'medio' | 'largo' | 'calvo' | 'recogido';
  hairColor: string;
  skinTone: string;
  suitColor: string;
  tieColor: string;
  facialHair: 'none' | 'barba' | 'bigote';
  glasses: 'none' | 'redondas' | 'rectangulares';
}

export interface DemandEvaluation {
    esAdmisible: boolean;
    analisis: string;
    narrativaSiguiente: string;
}