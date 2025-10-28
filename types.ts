export enum GameState {
    CASE_SELECTION,
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
