

import React, { useState, useEffect, useRef } from 'react';
import type { CaseDetails, StageFeedback, TrialStep } from '../types';
import LoadingSpinner from './LoadingSpinner';
import GlossaryModal from './GlossaryModal';
import NotepadModal from './NotepadModal';
import GuidanceBox from './GuidanceBox';

interface TrialScreenProps {
    caseDetails: CaseDetails;
    narrative: string;
    stageFeedback: StageFeedback | null;
    trialHistory: TrialStep[];
    isLoading: boolean;
    error: string | null;
    playerInput: string;
    onPlayerInputChange: (value: string) => void;
    onSubmit: () => void;
    onConclude: () => void;
    isReadOnly: boolean;
    timeLeft: number;
    setTimeLeft: (value: number) => void;
    isTimerActive: boolean;
    setTimerActive: (value: boolean) => void;
}

const Timer: React.FC<{ timeLeft: number; setTimeLeft: (value: number) => void; isTimerActive: boolean; setTimerActive: (value: boolean) => void; onConclude: () => void; }> = ({ timeLeft, setTimeLeft, isTimerActive, setTimerActive, onConclude }) => {
    useEffect(() => {
        if (!isTimerActive) return;

        if (timeLeft <= 0) {
            setTimerActive(false);
            onConclude();
            return;
        }

        const timerId = setInterval(() => {
            setTimeLeft(timeLeft - 1);
        }, 1000);

        return () => clearInterval(timerId);
    }, [timeLeft, isTimerActive, setTimeLeft, setTimerActive, onConclude]);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
        <div className="text-center font-mono text-lg bg-slate-900/50 p-2 rounded-md">
            Tiempo Restante: <span className={timeLeft < 60 ? 'text-red-400' : 'text-yellow-300'}>{minutes}:{seconds < 10 ? `0${seconds}` : seconds}</span>
        </div>
    );
};


const TrialScreen: React.FC<TrialScreenProps> = ({
    caseDetails,
    narrative,
    stageFeedback,
    trialHistory,
    isLoading,
    error,
    playerInput,
    onPlayerInputChange,
    onSubmit,
    onConclude,
    isReadOnly,
    timeLeft,
    setTimeLeft,
    isTimerActive,
    setTimerActive,
}) => {
    const [isGlossaryOpen, setGlossaryOpen] = useState(false);
    const [isNotepadOpen, setNotepadOpen] = useState(false);
    const narrativeEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        narrativeEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [narrative, stageFeedback]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey && !caseDetails.esCivil) {
            e.preventDefault();
            if (!isLoading && playerInput.trim()) {
                onSubmit();
            }
        }
    };

    const currentTurn = trialHistory.length;
    const guidedStep = (caseDetails.isGuided && caseDetails.guidedSteps)
        ? caseDetails.guidedSteps.find(s => s.trigger === `trial-turn-${currentTurn}`)
        : null;

    return (
        <>
            <GlossaryModal isOpen={isGlossaryOpen} onClose={() => setGlossaryOpen(false)} terms={caseDetails.glossary} />
            <NotepadModal isOpen={isNotepadOpen} onClose={() => setNotepadOpen(false)} caseId={caseDetails.titulo} />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                <aside className="lg:col-span-1 bg-slate-800/50 border border-slate-700 rounded-lg p-6 self-start sticky top-8">
                    <div className="flex justify-between items-center border-b border-slate-600 pb-3 mb-4">
                        <h2 className="text-2xl font-bold text-blue-300 font-serif">{caseDetails.titulo}</h2>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold text-slate-300">Tu Objetivo</h3>
                            <p className="text-slate-400 font-serif italic">"{caseDetails.objetivoJugador}"</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-300">Evidencia</h3>
                            <ul className="list-disc list-inside text-slate-400">
                                {caseDetails.evidencia.map(e => <li key={e}>{e}</li>)}
                            </ul>
                        </div>
                         <div className="flex gap-2 pt-4 border-t border-slate-700">
                             <button onClick={() => setGlossaryOpen(true)} className="text-sm bg-slate-700 px-3 py-2 rounded-md hover:bg-slate-600 w-full">Glosario</button>
                             <button onClick={() => setNotepadOpen(true)} className="text-sm bg-slate-700 px-3 py-2 rounded-md hover:bg-slate-600 w-full">Notas</button>
                        </div>
                         {!caseDetails.esCivil && (
                             <div className="pt-4 border-t border-slate-700">
                                 <Timer timeLeft={timeLeft} setTimeLeft={setTimeLeft} isTimerActive={isTimerActive} setTimerActive={setTimerActive} onConclude={onConclude} />
                             </div>
                         )}
                    </div>
                </aside>
                <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-lg p-6 flex flex-col min-h-[80vh]">
                    <div className="flex-grow overflow-y-auto mb-4 pr-2 max-h-[55vh]">
                        <h3 className="text-2xl font-bold text-blue-300 mb-4 font-serif">Desarrollo del Juicio</h3>
                        <p className="whitespace-pre-wrap text-slate-300 font-serif leading-relaxed">{narrative}</p>

                        {stageFeedback && (
                            <div className="mt-6 p-4 rounded-lg bg-slate-900/50 border border-blue-800 animate-fade-in">
                                <h4 className="font-bold text-blue-300">Retroalimentación del Turno</h4>
                                <p className="text-slate-300 mt-2">{stageFeedback.analisis}</p>
                                {stageFeedback.citaLegal && <p className="text-xs text-slate-500 mt-2 italic">Ref: {stageFeedback.citaLegal}</p>}
                            </div>
                        )}
                        <div ref={narrativeEndRef} />
                    </div>

                    <div className="mt-auto pt-6 border-t border-slate-700">
                         {isLoading && <LoadingSpinner />}
                         {error && <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-md mb-4 text-center">{error}</div>}
                        
                        {!isReadOnly && !isLoading && (
                            <>
                                {guidedStep && <GuidanceBox title={guidedStep.title} text={guidedStep.text} />}
                                <div className="space-y-4">
                                    {caseDetails.esCivil ? (
                                         <div>
                                             <h3 className="text-xl font-bold mb-2">Presentar Escrito</h3>
                                             <p className="text-slate-400 mb-4">Redacta y presenta el siguiente escrito según lo que corresponda en esta etapa del juicio.</p>
                                             <textarea
                                                value={playerInput}
                                                onChange={(e) => onPlayerInputChange(e.target.value)}
                                                placeholder="Señor Juez..."
                                                className="w-full h-40 p-2 bg-slate-900 border border-slate-600 rounded-md text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                disabled={isLoading}
                                            />
                                         </div>
                                    ) : (
                                        <div>
                                             <h3 className="text-xl font-bold mb-2">Tu Argumento</h3>
                                             <p className="text-slate-400 mb-4">Presenta tu argumento oralmente. Sé conciso y fundamenta bien tu posición.</p>
                                            <textarea
                                                value={playerInput}
                                                onChange={(e) => onPlayerInputChange(e.target.value)}
                                                placeholder="Señoría, con el debido respeto..."
                                                className="w-full h-24 p-2 bg-slate-900 border border-slate-600 rounded-md text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                disabled={isLoading}
                                                onKeyDown={handleKeyDown}
                                            />
                                        </div>
                                    )}
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <button onClick={onSubmit} className="w-full p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:bg-slate-600 font-bold" disabled={isLoading || !playerInput.trim()}>
                                            {caseDetails.esCivil ? 'Presentar Escrito' : 'Presentar Argumento'}
                                        </button>
                                        <button onClick={onConclude} className="w-full sm:w-auto p-4 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors disabled:bg-slate-600" disabled={isLoading}>
                                            Concluir Juicio
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default TrialScreen;