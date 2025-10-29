import React, { useState, useRef, useEffect } from 'react';
import type { CaseDetails, TrialEvent } from '../types';
import LoadingSpinner from './LoadingSpinner';
import GuidanceBox from './GuidanceBox';
import GlossaryModal from './GlossaryModal';
import NotepadModal from './NotepadModal';

interface TrialScreenProps {
    caseDetails: CaseDetails;
    trialHistory: TrialEvent[];
    onSubmitTurn: (text: string) => void;
    onADRResponse: (responseType: 'accept' | 'reject' | 'counter', counterOfferText?: string) => void;
    isAiThinking: boolean;
}

const ActorBadge: React.FC<{ actor: TrialEvent['actor'] }> = ({ actor }) => {
    const styles = {
        JUEZ: 'bg-yellow-800 text-yellow-200 border-yellow-600',
        DEMANDADO: 'bg-red-800 text-red-200 border-red-600',
        JUGADOR: 'bg-blue-800 text-blue-200 border-blue-600',
        SISTEMA: 'bg-slate-700 text-slate-300 border-slate-600',
        // DEMANDANTE is mapped to JUGADOR for display purposes
        DEMANDANTE: 'bg-blue-800 text-blue-200 border-blue-600',
    };
    const text = actor === 'JUGADOR' || actor === 'DEMANDANTE' ? 'TÚ' : actor;
    return <span className={`px-2 py-0.5 text-xs font-bold rounded-md border ${styles[actor]}`}>{text}</span>;
}

const TrialScreen: React.FC<TrialScreenProps> = ({ caseDetails, trialHistory, onSubmitTurn, onADRResponse, isAiThinking }) => {
    const [input, setInput] = useState('');
    const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
    const [isNotepadOpen, setIsNotepadOpen] = useState(false);
    const [showCounterOffer, setShowCounterOffer] = useState(false);
    const [counterOfferText, setCounterOfferText] = useState('');
    const transcriptEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        // Reset counter offer UI when new events arrive
        setShowCounterOffer(false);
        setCounterOfferText('');
    }, [trialHistory]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isAiThinking) {
            onSubmitTurn(input.trim());
            setInput('');
        }
    };
    
    const handleCounterOfferSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (counterOfferText.trim()) {
            onADRResponse('counter', counterOfferText.trim());
        }
    };

    const currentTurn = trialHistory.length;
    const guidance = caseDetails.guidedSteps?.find(step => step.trigger === `trial-turn-${currentTurn}`);
    const lastEvent = trialHistory.length > 0 ? trialHistory[trialHistory.length - 1] : null;

    const renderInteractionArea = () => {
        if (isAiThinking) {
            return <div className="text-center p-4"><p className="text-slate-400">Esperando respuesta...</p></div>;
        }

        if (lastEvent?.esPropuestaADR && lastEvent.actor !== 'JUGADOR') {
            return (
                <div className="bg-slate-800 border-2 border-yellow-600 rounded-lg p-6 mt-4 animate-fade-in">
                    <h3 className="text-xl font-bold font-serif text-yellow-300 mb-2">Propuesta de Acuerdo</h3>
                    <p className="text-slate-300 mb-4">La contraparte propone una <strong className="text-white">{lastEvent.propuestaADR?.tipo}</strong> con los siguientes términos:</p>
                    <p className="bg-slate-900 p-4 rounded-md text-slate-200 italic mb-6">"{lastEvent.propuestaADR?.terminos}"</p>

                    {showCounterOffer ? (
                        <form onSubmit={handleCounterOfferSubmit} className="space-y-4">
                            <h4 className="font-semibold text-slate-300">Redacta tu contraoferta:</h4>
                             <textarea
                                value={counterOfferText}
                                onChange={(e) => setCounterOfferText(e.target.value)}
                                placeholder="Ej: Aceptamos una transacción por el 90% de lo demandado más las costas..."
                                className="w-full p-3 bg-slate-900 border border-slate-600 rounded-md text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                rows={4}
                            />
                            <div className="flex gap-4">
                                <button type="submit" className="flex-1 px-6 py-3 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-500" disabled={!counterOfferText.trim()}>
                                    Enviar Contraoferta
                                </button>
                                <button type="button" onClick={() => setShowCounterOffer(false)} className="px-6 py-3 bg-slate-700 text-slate-200 rounded-md hover:bg-slate-600">
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button onClick={() => onADRResponse('accept')} className="px-6 py-3 bg-green-600 text-white font-bold rounded-md hover:bg-green-500 transition-colors">
                                Aceptar Acuerdo
                            </button>
                             <button onClick={() => setShowCounterOffer(true)} className="px-6 py-3 bg-yellow-600 text-white font-bold rounded-md hover:bg-yellow-500 transition-colors">
                                Proponer Contraoferta
                            </button>
                            <button onClick={() => onADRResponse('reject')} className="px-6 py-3 bg-red-600 text-white font-bold rounded-md hover:bg-red-500 transition-colors">
                                Rechazar y Continuar
                            </button>
                        </div>
                    )}
                </div>
            );
        }

        return (
            <>
                {lastEvent?.opciones && lastEvent.opciones.length > 0 && (
                    <div className="mb-4">
                        <p className="text-sm text-center text-slate-400 mb-2">Sugerencias del Juez:</p>
                        <div className="flex justify-center gap-2 flex-wrap">
                            {lastEvent.opciones.map((op, i) => (
                                <button key={i} onClick={() => onSubmitTurn(op)} disabled={isAiThinking} className="px-3 py-2 bg-slate-700 text-slate-200 rounded-md hover:bg-slate-600 transition-colors text-sm">
                                    "{op}"
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                 <form onSubmit={handleSubmit} className="flex gap-4">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Escribe tu argumento o acción..."
                        className="flex-grow px-4 py-3 bg-slate-800 border border-slate-600 rounded-md text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isAiThinking}
                    />
                    <button type="submit" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-500 transition-colors disabled:bg-slate-600" disabled={isAiThinking || !input.trim()}>
                        Enviar
                    </button>
                    <button type="button" onClick={() => setIsGlossaryOpen(true)} className="px-4 py-2 bg-slate-700 text-slate-200 rounded-md hover:bg-slate-600 transition-colors text-sm" aria-label="Abrir Glosario">
                        📖
                    </button>
                    <button type="button" onClick={() => setIsNotepadOpen(true)} className="px-4 py-2 bg-slate-700 text-slate-200 rounded-md hover:bg-slate-600 transition-colors text-sm" aria-label="Abrir Bloc de Notas">
                        📝
                    </button>
                </form>
            </>
        );
    }

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
            <div className="w-full max-w-5xl mx-auto flex flex-col h-full animate-fade-in">
                <div className="text-center mb-4">
                    <h2 className="text-3xl font-bold font-serif text-blue-300">{caseDetails.titulo}</h2>
                     <p className="text-slate-400">Juez a cargo: {caseDetails.juez?.nombre} ({caseDetails.juez?.personalidad})</p>
                </div>

                <div className="flex-grow bg-slate-900/50 p-4 rounded-lg border border-slate-700 overflow-y-auto mb-4">
                    <div className="space-y-4">
                        {trialHistory.map((event, index) => (
                            <div key={index} className="flex flex-col">
                                <div className={`p-3 rounded-lg max-w-xl ${event.actor === 'JUGADOR' || event.actor === 'DEMANDANTE' ? 'bg-blue-900/70 self-end text-right' : 'bg-slate-800 self-start'}`}>
                                    <div className={`mb-1 ${event.actor === 'JUGADOR' || event.actor === 'DEMANDANTE' ? 'text-right' : 'text-left'}`}>
                                       <ActorBadge actor={event.actor} />
                                    </div>
                                    <p className="text-slate-200 whitespace-pre-wrap">{event.texto}</p>
                                </div>
                            </div>
                        ))}
                         {isAiThinking && <div className="self-start"><LoadingSpinner message="La contraparte está pensando..." /></div>}
                        <div ref={transcriptEndRef} />
                    </div>
                </div>

                {guidance && <GuidanceBox title={guidance.title} text={guidance.text} />}
                {renderInteractionArea()}
            </div>
        </>
    );
};

export default TrialScreen;