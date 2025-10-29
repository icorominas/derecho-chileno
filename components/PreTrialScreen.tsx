import React, { useState, useEffect } from 'react';
import type { CaseDetails } from '../types';
import CalendarAnimation from './CalendarAnimation';
import GuidanceBox from './GuidanceBox';
import GlossaryModal from './GlossaryModal';
import NotepadModal from './NotepadModal';

interface PreTrialScreenProps {
    caseDetails: CaseDetails;
    onStartTrial: (draft: string) => void;
}

const PreTrialScreen: React.FC<PreTrialScreenProps> = ({ caseDetails, onStartTrial }) => {
    const [draft, setDraft] = useState('');
    const [isAnimating, setIsAnimating] = useState(true);
    const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
    const [isNotepadOpen, setIsNotepadOpen] = useState(false);

    useEffect(() => {
        // Reset state if case changes
        setDraft('');
        setIsAnimating(true);
    }, [caseDetails]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (draft.trim().length > 50) { // Basic validation
            onStartTrial(draft);
        } else {
            alert('Tu escrito debe tener al menos 50 caracteres para ser presentado.');
        }
    };

    if (isAnimating) {
        return <CalendarAnimation onComplete={() => setIsAnimating(false)} />;
    }
    
    const guidance = caseDetails.guidedSteps?.find(step => step.trigger === 'pre-trial-drafting');

    return (
        <>
            <GlossaryModal 
                isOpen={isGlossaryOpen} 
                onClose={() => setIsGlossaryOpen(false)} 
                terms={caseDetails.glossary || []} 
            />
            <NotepadModal
                isOpen={isNotepadOpen}
                onClose={() => setIsNotepadOpen(false)}
                caseId={caseDetails.id || null}
            />
            <div className="w-full max-w-5xl mx-auto animate-fade-in">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold font-serif text-blue-300">{caseDetails.titulo}</h2>
                    <p className="text-slate-400">{caseDetails.area} &bull; Dificultad: {caseDetails.dificultad}</p>
                </div>

                {guidance && <GuidanceBox title={guidance.title} text={guidance.text} />}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Columna de Información */}
                    <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700 space-y-6">
                        <div>
                            <h3 className="text-xl font-bold text-blue-300 mb-3 border-b border-slate-600 pb-2">Resumen del Caso</h3>
                            <p className="text-slate-300 whitespace-pre-wrap">{caseDetails.resumen}</p>
                        </div>
                         <div>
                            <h3 className="text-xl font-bold text-blue-300 mb-3 border-b border-slate-600 pb-2">Entrevista con el Cliente</h3>
                            <p className="text-slate-300 whitespace-pre-wrap italic bg-slate-800 p-4 rounded-md">"{caseDetails.entrevistaCliente}"</p>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-blue-300 mb-3 border-b border-slate-600 pb-2">Tu Objetivo</h3>
                            <p className="text-slate-300 whitespace-pre-wrap">{caseDetails.objetivoJugador}</p>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-blue-300 mb-3 border-b border-slate-600 pb-2">Evidencia Disponible</h3>
                            <ul className="list-disc list-inside text-slate-300 space-y-1">
                                {caseDetails.evidencia.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </div>
                        <div className="flex gap-4 pt-4">
                           <button onClick={() => setIsGlossaryOpen(true)} className="flex-1 px-4 py-2 bg-slate-700 text-slate-200 rounded-md hover:bg-slate-600 transition-colors">
                                Ver Glosario 📖
                            </button>
                            <button onClick={() => setIsNotepadOpen(true)} className="flex-1 px-4 py-2 bg-slate-700 text-slate-200 rounded-md hover:bg-slate-600 transition-colors">
                                Bloc de Notas 📝
                            </button>
                        </div>
                    </div>

                    {/* Columna de Acción */}
                    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 flex flex-col">
                        <h3 className="text-xl font-bold text-blue-300 mb-3">Redacta tu Escrito Principal</h3>
                        <p className="text-slate-400 mb-4">
                            {caseDetails.esCivil 
                                ? "Prepara tu demanda inicial. Expón los hechos, los fundamentos de derecho y tus peticiones." 
                                : "Prepara tu alegato de apertura. Resume tu teoría del caso y lo que probarás en el juicio."
                            }
                        </p>
                        <form onSubmit={handleSubmit} className="flex flex-col flex-grow">
                            <textarea
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                placeholder="Comienza a escribir tu argumento aquí..."
                                className="w-full flex-grow p-3 bg-slate-900 border border-slate-600 rounded-md text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                rows={15}
                            />
                            <button type="submit" className="mt-4 w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-500 transition-colors disabled:bg-slate-600" disabled={draft.trim().length < 50}>
                                {caseDetails.esCivil ? 'Presentar Demanda' : 'Iniciar Juicio Oral'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PreTrialScreen;
