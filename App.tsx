import React, { useState, useEffect, useCallback } from 'react';
import CaseSelectionScreen from './components/CaseSelectionScreen';
import PreTrialScreen from './components/PreTrialScreen';
import TrialScreen from './components/TrialScreen';
import EndScreenModal from './components/EndScreenModal';
import Header from './components/Header';
import { generateCase, getNextTrialEvent, evaluatePerformance } from './services/geminiService';
import type { GameState, CaseDetails, TrialEvent, CaseEvaluation, CompletedCase, AvatarSettings } from './types';
import AvatarModal from './components/AvatarModal';
import { TUTORIAL_CASE_DESPIDO_INJUSTIFICADO } from './guidedCases';


const initialAvatarSettings: AvatarSettings = {
    hairstyle: 'corto',
    hairColor: '#4a2c20',
    facialHair: 'none',
    glasses: 'none',
    skinTone: '#f0c2a2',
    suitColor: '#334155',
    tieColor: '#dc2626',
};

function App() {
    const [gameState, setGameState] = useState<GameState>(() => {
        try {
            const savedState = localStorage.getItem('abogadoSimuladoState');
            if (savedState) {
                const parsed = JSON.parse(savedState);
                // Ensure stage is reset on load to avoid being stuck in a case
                return { ...parsed, stage: 'case-selection', currentCase: null, isLoading: false };
            }
        } catch (error) {
            console.error("Failed to load state from localStorage", error);
        }
        return {
            stage: 'case-selection',
            currentCase: null,
            caseHistory: [],
            isLoading: false,
            error: null,
            username: '',
            avatarSettings: initialAvatarSettings,
        };
    });
    
    const [trialHistory, setTrialHistory] = useState<TrialEvent[]>([]);
    const [evaluation, setEvaluation] = useState<CaseEvaluation | null>(null);
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);


    useEffect(() => {
        try {
            const stateToSave = {
                caseHistory: gameState.caseHistory,
                username: gameState.username,
                avatarSettings: gameState.avatarSettings
            };
            localStorage.setItem('abogadoSimuladoState', JSON.stringify(stateToSave));
        } catch (error) {
            console.error("Failed to save state to localStorage", error);
        }
    }, [gameState.caseHistory, gameState.username, gameState.avatarSettings]);

    const handleReset = () => {
        setGameState(prev => ({
            ...prev,
            stage: 'case-selection',
            currentCase: null,
            error: null,
            isLoading: false,
        }));
        setTrialHistory([]);
        setEvaluation(null);
    };

    const getDifficulty = useCallback(() => {
        const completed = gameState.caseHistory.length;
        if (completed < 2) return 'Introductorio';
        if (completed < 5) return 'Intermedio';
        return 'Avanzado';
    }, [gameState.caseHistory.length]);

    const handleSelectCase = async (area: string, isCivil: boolean) => {
        setGameState(prev => ({ ...prev, isLoading: true, error: null }));
        try {
            const difficulty = getDifficulty();
            const newCase = await generateCase(area, isCivil, difficulty);
            setGameState(prev => ({ ...prev, currentCase: newCase, stage: 'pre-trial', isLoading: false }));
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Un error desconocido ocurrió.";
            setGameState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
        }
    };

    const handleSelectGuidedCase = (guidedCase: CaseDetails) => {
         setGameState(prev => ({ ...prev, currentCase: guidedCase, stage: 'pre-trial' }));
    };

    const handleStartTrial = (draft: string) => {
        // For tutorial, actor is DEMANDANTE. For others, it's JUGADOR. Let's unify to JUGADOR and display differently.
        const firstTurn: TrialEvent = { actor: 'JUGADOR', texto: draft };
        setTrialHistory([firstTurn]);
        setGameState(prev => ({ ...prev, stage: 'trial' }));
        // Trigger AI's first response
        handleAiTurn([firstTurn]);
    };

    const handleAiTurn = async (currentHistory: TrialEvent[]) => {
        if (!gameState.currentCase) return;
        setIsAiThinking(true);
        try {
            const nextEvent = await getNextTrialEvent(gameState.currentCase, currentHistory);
            setTrialHistory(prev => [...prev, nextEvent]);
            if (nextEvent.esDecision) {
                await handleEndGame([...currentHistory, nextEvent]);
            }
        } catch (error) {
             const errorMessage = error instanceof Error ? error.message : "Un error desconocido ocurrió.";
             setTrialHistory(prev => [...prev, { actor: 'SISTEMA', texto: `Error: ${errorMessage}`, esDecision: false }]);
        } finally {
            setIsAiThinking(false);
        }
    };

    const handleSubmitTurn = (text: string) => {
        const newHistory: TrialEvent[] = [...trialHistory, { actor: 'JUGADOR', texto: text }];
        setTrialHistory(newHistory);
        handleAiTurn(newHistory);
    };

    const handleADRResponse = (responseType: 'accept' | 'reject' | 'counter', counterOfferText?: string) => {
        const lastEvent = trialHistory[trialHistory.length - 1];
        if (!lastEvent?.esPropuestaADR || !lastEvent.propuestaADR) return;

        let newHistory: TrialEvent[];

        if (responseType === 'accept') {
            const acceptanceEvent: TrialEvent = {
                actor: 'JUGADOR',
                texto: `Acepto la propuesta de ${lastEvent.propuestaADR.tipo}.`,
                esPropuestaADR: true, 
                propuestaADR: lastEvent.propuestaADR
            };
            newHistory = [...trialHistory, acceptanceEvent];
            setTrialHistory(newHistory);
            handleEndGame(newHistory);
            return;
        }

        if (responseType === 'reject') {
            const rejectionEvent: TrialEvent = {
                actor: 'JUGADOR',
                texto: `Rechazamos la propuesta. Solicitamos continuar con el procedimiento.`
            };
            newHistory = [...trialHistory, rejectionEvent];
        } else { // counter
            const counterOfferEvent: TrialEvent = {
                actor: 'JUGADOR',
                texto: `No aceptamos los términos, pero proponemos la siguiente contraoferta: ${counterOfferText}`
            };
            newHistory = [...trialHistory, counterOfferEvent];
        }

        setTrialHistory(newHistory);
        handleAiTurn(newHistory);
    };

    const handleEndGame = async (finalHistory: TrialEvent[]) => {
        if (!gameState.currentCase) return;
        setGameState(prev => ({ ...prev, stage: 'end-screen' }));
        try {
            const evalResult = await evaluatePerformance(gameState.currentCase, finalHistory);
            setEvaluation(evalResult);
            
            // Do not save tutorial cases to history
            if (!gameState.currentCase.isGuided) {
                const completedCase: CompletedCase = {
                    id: gameState.currentCase.id || crypto.randomUUID(),
                    caseDetails: gameState.currentCase,
                    evaluation: evalResult,
                    completedAt: new Date().toISOString()
                };
                setGameState(prev => ({
                    ...prev,
                    caseHistory: [...prev.caseHistory, completedCase],
                }));
            }

        } catch (error) {
            console.error("Error getting evaluation", error);
            // set a default evaluation on error
            setEvaluation({
                puntaje: 0,
                analisis: "No se pudo generar la evaluación debido a un error.",
                fortalezas: "-",
                debilidades: "-",
                consejos: "Intenta jugar otro caso."
            });
        }
    };

    const handleUsernameChange = (name: string) => {
        setGameState(prev => ({ ...prev, username: name }));
    };
    
    const handleAvatarSettingsChange = (newSettings: AvatarSettings) => {
         setGameState(prev => ({ ...prev, avatarSettings: newSettings }));
    };

    const renderContent = () => {
        switch (gameState.stage) {
            case 'pre-trial':
                return gameState.currentCase && <PreTrialScreen caseDetails={gameState.currentCase} onStartTrial={handleStartTrial} />;
            case 'trial':
                return gameState.currentCase && <TrialScreen caseDetails={gameState.currentCase} trialHistory={trialHistory} onSubmitTurn={handleSubmitTurn} onADRResponse={handleADRResponse} isAiThinking={isAiThinking} />;
            case 'case-selection':
            default:
                return (
                    <CaseSelectionScreen
                        onSelectCase={handleSelectCase}
                        onSelectGuidedCase={handleSelectGuidedCase}
                        isLoading={gameState.isLoading}
                        error={gameState.error}
                        completedCases={gameState.caseHistory.length}
                        caseHistory={gameState.caseHistory}
                        username={gameState.username}
                        onUsernameChange={handleUsernameChange}
                    />
                );
        }
    };

    return (
        <div className="bg-slate-900 text-slate-200 min-h-screen flex flex-col items-center p-4 md:p-8 font-sans">
            <Header 
                onReset={handleReset} 
                avatarSettings={gameState.avatarSettings}
                onOpenAvatarModal={() => setIsAvatarModalOpen(true)}
                username={gameState.username}
            />
            <main className="w-full max-w-5xl flex-grow mt-8 flex flex-col">
                {renderContent()}
            </main>
            <EndScreenModal
                isOpen={gameState.stage === 'end-screen'}
                onClose={handleReset}
                evaluation={evaluation}
                caseDetails={gameState.currentCase}
            />
            <AvatarModal
                isOpen={isAvatarModalOpen}
                onClose={() => setIsAvatarModalOpen(false)}
                settings={gameState.avatarSettings}
                onSettingsChange={handleAvatarSettingsChange}
            />
        </div>
    );
}

export default App;