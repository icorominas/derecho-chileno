import React, { useState } from 'react';
import type { CaseDetails, TrialStep, DemandEvaluation } from '../types';
import { startTrialAfterDemand } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import GlossaryModal from './GlossaryModal';
import CalendarAnimation from './CalendarAnimation';
import GuidanceBox from './GuidanceBox';

interface PreTrialScreenProps {
    caseDetails: CaseDetails;
    onPreTrialComplete: (initialHistory: TrialStep[], initialNarrative: string) => void;
}

type PreTrialStep = 'interview' | 'drafting' | 'feedback' | 'calendar';

const PreTrialScreen: React.FC<PreTrialScreenProps> = ({ caseDetails, onPreTrialComplete }) => {
    const [step, setStep] = useState<PreTrialStep>('interview');
    const [demandText, setDemandText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState<DemandEvaluation | null>(null);
    const [isGlossaryOpen, setGlossaryOpen] = useState(false);

    const handleSubmitDemand = async () => {
        setIsLoading(true);
        setFeedback(null);
        try {
            const result = await startTrialAfterDemand(caseDetails, demandText);
            setFeedback(result);
            if (result.esAdmisible) {
                setStep('calendar');
            } else {
                setStep('feedback');
            }
        } catch (error) {
            console.error(error);
            setFeedback({
                esAdmisible: false,
                analisis: 'Ocurrió un error al contactar al servicio de IA. Por favor, intenta de nuevo.',
                narrativaSiguiente: ''
            });
            setStep('feedback');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCalendarComplete = () => {
        if (feedback && feedback.esAdmisible) {
            const initialHistory: TrialStep[] = [{
                accion: 'Presentación de Demanda',
                narrativa: 'El caso comenzó con la entrevista al cliente y la redacción de la demanda.',
                submission: demandText,
            }];
            onPreTrialComplete(initialHistory, feedback.narrativaSiguiente);
        }
    };
    
    const renderContent = () => {
        switch (step) {
            case 'interview':
                return (
                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 animate-fade-in">
                        <h3 className="text-2xl font-bold text-blue-300 mb-4 font-serif">Entrevista con Cliente</h3>
                        <p className="whitespace-pre-wrap text-slate-300 font-serif leading-relaxed mb-6">{caseDetails.entrevistaCliente}</p>
                        <button onClick={() => setStep('drafting')} className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors font-bold">
                            Entendido, proceder a redactar la demanda
                        </button>
                    </div>
                );
            case 'drafting':
            case 'feedback':
                const guidedStep = (caseDetails.isGuided && caseDetails.guidedSteps)
                    ? caseDetails.guidedSteps.find(s => s.trigger === 'pre-trial-drafting')
                    : null;

                 return (
                    <div className="mt-auto pt-6 border-t border-slate-700">
                        {isLoading ? <LoadingSpinner message="Presentando demanda al tribunal..." /> : (
                            <>
                                {guidedStep && <GuidanceBox title={guidedStep.title} text={guidedStep.text} />}

                                <h3 className="text-xl font-bold mb-2">Redacta la Demanda</h3>
                                <p className="text-slate-400 mb-4">Basado en la entrevista y la evidencia, redacta la demanda inicial. Asegúrate de individualizar a las partes, exponer los hechos y realizar las peticiones correspondientes.</p>
                                
                                {step === 'feedback' && feedback && (
                                    <div className={`p-4 mb-4 rounded-lg border ${feedback.esAdmisible ? 'bg-green-900/50 border-green-700' : 'bg-red-900/50 border-red-700'}`}>
                                        <h4 className="font-bold">{feedback.esAdmisible ? 'Demanda Admisible' : 'Demanda Inadmisible'}</h4>
                                        <p>{feedback.analisis}</p>
                                        {!feedback.esAdmisible && <p className="mt-2 text-sm font-semibold">Por favor, corrige tu demanda y preséntala de nuevo.</p>}
                                    </div>
                                )}

                                <textarea
                                    value={demandText}
                                    onChange={(e) => setDemandText(e.target.value)}
                                    placeholder="Señor Juez en lo Civil de..."
                                    className="w-full h-64 p-2 bg-slate-900 border border-slate-600 rounded-md text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={isLoading}
                                />
                                <div className="flex gap-4 mt-4">
                                    <button onClick={handleSubmitDemand} className="w-full p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:bg-slate-600 font-bold" disabled={isLoading || !demandText.trim()}>
                                        Presentar Demanda
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                );
            case 'calendar':
                return <CalendarAnimation onComplete={handleCalendarComplete} />;
        }
    }

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
                   {renderContent()}
                </div>
            </div>
        </>
    );
};

export default PreTrialScreen;