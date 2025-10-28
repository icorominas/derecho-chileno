import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { CaseDetails, TrialStep, StageFeedback } from '../types';
import { advanceTrial } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import GlossaryModal from './GlossaryModal';

interface TrialScreenProps {
    caseDetails: CaseDetails;
    onTrialEnd: (history: TrialStep[]) => void;
}

const FIVE_MINUTES = 5 * 60;

const TrialScreen: React.FC<TrialScreenProps> = ({ caseDetails, onTrialEnd }) => {
    const [narrative, setNarrative] = useState<string>("El juicio está por comenzar. Como abogado, tu objetivo es: " + caseDetails.objetivoJugador + ". Revisa la evidencia y prepárate para tu primera intervención.");
    const [history, setHistory] = useState<TrialStep[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [playerInput, setPlayerInput] = useState('');
    const [stageFeedback, setStageFeedback] = useState<StageFeedback | null>(null);
    const [isGlossaryOpen, setGlossaryOpen] = useState(false);
    const [timeLeft, setTimeLeft] = useState(FIVE_MINUTES);
    const [isTimerActive, setTimerActive] = useState(false);

    const narrativeEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        narrativeEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [narrative, stageFeedback]);

    useEffect(() => {
        if (!caseDetails.esCivil && isTimerActive) {
            if (timeLeft <= 0) {
                handleSubmit();
                return;
            }
            const timerId = setInterval(() => {
                setTimeLeft(t => t - 1);
            }, 1000);
            return () => clearInterval(timerId);
        }
    }, [isTimerActive, timeLeft, caseDetails.esCivil]);
    
    const startTurn = useCallback(() => {
        if (!caseDetails.esCivil) {
            setTimeLeft(FIVE_MINUTES);
            setTimerActive(true);
        }
    }, [caseDetails.esCivil]);

    useEffect(() => {
        startTurn();
    }, []);

    const handleSubmit = useCallback(async () => {
        if (!playerInput.trim() && !caseDetails.esCivil) {
            setError("Debes presentar un argumento para proceder.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setTimerActive(false);

        const newStep: TrialStep = {
            accion: caseDetails.esCivil 
                ? `Presentación de escrito: ${playerInput.substring(0, 50)}...` 
                : `Argumento oral: ${playerInput.substring(0, 50)}...`,
            narrativa: narrative,
            submission: playerInput,
        };
        const newHistory = [...history, newStep];
        setHistory(newHistory);
        
        try {
            const result = await advanceTrial(caseDetails, newHistory, playerInput);
            setNarrative(result.narrativa);
            setStageFeedback(result.stageFeedback ?? null);
            setPlayerInput('');
            
            if (result.juegoTerminado) {
                const finalStep: TrialStep = { accion: "Conclusión del juicio.", narrativa: result.narrativa };
                onTrialEnd([...newHistory, finalStep]);
            } else {
                startTurn();
            }
        } catch (err) {
            setError("La IA no pudo continuar el juicio. Puedes intentar de nuevo o concluir el caso.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [playerInput, narrative, history, caseDetails, onTrialEnd, startTurn]);
    
    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <>
        <GlossaryModal isOpen={isGlossaryOpen} onClose={() => setGlossaryOpen(false)} terms={caseDetails.glossary} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            <aside className="lg:col-span-1 bg-slate-800/50 border border-slate-700 rounded-lg p-6 self-start">
                <div className="flex justify-between items-center border-b border-slate-600 pb-3 mb-4">
                    <h2 className="text-2xl font-bold text-blue-300 font-serif">{caseDetails.titulo}</h2>
                    <button onClick={() => setGlossaryOpen(true)} className="text-sm bg-slate-700 px-3 py-1 rounded hover:bg-slate-600">Glosario</button>
                </div>
                <div className="space-y-4">
                     <div>
                        <h3 className="font-semibold text-slate-300">Dificultad</h3>
                        <p className="text-slate-400">{caseDetails.dificultad}</p>
                    </div>
                     <div>
                        <h3 className="font-semibold text-slate-300">Tu Objetivo</h3>
                        <p className="text-slate-400 font-serif italic">"{caseDetails.objetivoJugador}"</p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-300">Evidencia Disponible</h3>
                        <ul className="list-disc list-inside text-slate-400">
                            {caseDetails.evidencia.map(e => <li key={e}>{e}</li>)}
                        </ul>
                    </div>
                </div>
            </aside>

            <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-lg p-6 flex flex-col min-h-[70vh]">
                <div className="flex-grow overflow-y-auto pr-2 mb-6 max-h-[40vh] min-h-[200px]">
                    <p className="text-slate-300 whitespace-pre-wrap font-serif text-lg leading-relaxed">{narrative}</p>
                    <div ref={narrativeEndRef} />
                </div>

                {stageFeedback && (
                    <div className="mb-4 p-4 border border-blue-800 bg-blue-900/50 rounded-lg animate-fade-in">
                        <h4 className="font-bold text-blue-300">Retroalimentación de la Etapa:</h4>
                        <p className="text-slate-300">{stageFeedback.analisis}</p>
                        {stageFeedback.citaLegal && <p className="text-xs text-slate-500 mt-1 italic">{stageFeedback.citaLegal}</p>}
                    </div>
                )}

                <div className="mt-auto pt-6 border-t border-slate-700">
                    {isLoading ? <LoadingSpinner message="El juicio avanza..." /> : (
                        <>
                            {error && <p className="text-red-400 mb-4">{error}</p>}
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-xl font-bold">
                                    {caseDetails.esCivil ? "Redacta tu próximo escrito:" : "Prepara tu argumento oral:"}
                                </h3>
                                {!caseDetails.esCivil && (
                                     <div className={`text-lg font-mono px-3 py-1 rounded ${timeLeft < 60 ? 'bg-red-500 text-white' : 'bg-slate-700'}`}>
                                        {formatTime(timeLeft)}
                                    </div>
                                )}
                            </div>
                            <textarea
                                value={playerInput}
                                onChange={(e) => setPlayerInput(e.target.value)}
                                placeholder={caseDetails.esCivil ? "Escribe tus argumentos, peticiones y fundamentos de derecho aquí..." : "Escribe tu argumento para presentarlo ante el tribunal..."}
                                className="w-full h-32 p-2 bg-slate-900 border border-slate-600 rounded-md text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={isLoading}
                            />
                             <div className="flex gap-4 mt-4">
                                <button onClick={handleSubmit} className="w-full p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:bg-slate-600 font-bold" disabled={isLoading}>
                                    {caseDetails.esCivil ? "Presentar Escrito" : "Presentar Argumento"}
                                </button>
                                <button onClick={() => onTrialEnd(history)} className="px-4 py-3 bg-slate-600 text-slate-200 rounded-lg hover:bg-red-700 transition-colors">
                                    Concluir
                                </button>
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
