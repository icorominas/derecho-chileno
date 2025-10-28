import React, { useState, useCallback, useEffect } from 'react';
import { GameState, CaseDetails, Evaluation, TrialStep } from './types';
import Header from './components/Header';
import CaseSelectionScreen from './components/CaseSelectionScreen';
import TrialScreen from './components/TrialScreen';
import EndScreenModal from './components/EndScreenModal';
import { generateCase, evaluatePerformance } from './services/geminiService';

const App: React.FC = () => {
    const [gameState, setGameState] = useState<GameState>(GameState.CASE_SELECTION);
    const [currentCase, setCurrentCase] = useState<CaseDetails | null>(null);
    const [trialHistory, setTrialHistory] = useState<TrialStep[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
    
    const [completedCases, setCompletedCases] = useState<number>(() => {
        try {
            const savedCases = window.localStorage.getItem('simuladoJuezCompletedCases');
            return savedCases ? JSON.parse(savedCases) : 0;
        } catch (error) {
            console.error("Error al cargar los casos completados de localStorage:", error);
            return 0;
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem('simuladoJuezCompletedCases', JSON.stringify(completedCases));
        } catch (error) {
            console.error("Error al guardar los casos completados en localStorage:", error);
        }
    }, [completedCases]);


    const getDifficulty = (): 'Introductorio' | 'Intermedio' | 'Avanzado' => {
        if (completedCases < 2) return 'Introductorio';
        if (completedCases < 5) return 'Intermedio';
        return 'Avanzado';
    };

    const handleSelectCase = useCallback(async (area: string, isCivil: boolean) => {
        setIsLoading(true);
        setError(null);
        try {
            const difficulty = getDifficulty();
            const newCase = await generateCase(area, isCivil, difficulty);
            setCurrentCase(newCase);
            setTrialHistory([]);
            setGameState(GameState.IN_TRIAL);
        } catch (err) {
            setError('Error al generar el caso. Por favor, intente de nuevo.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [completedCases]);

    const handleTrialEnd = useCallback(async (history: TrialStep[]) => {
        setIsLoading(true);
        setError(null);
        setTrialHistory(history);
        setGameState(GameState.TRIAL_END);
        try {
            if (currentCase) {
                const evalResult = await evaluatePerformance(history, currentCase.objetivoJugador);
                setEvaluation(evalResult);
                if (evalResult.puntaje > 70) {
                    setCompletedCases(prev => prev + 1);
                }
            }
        } catch (err) {
            setError('Error al evaluar el desempeño. Aún así, ¡gran trabajo!');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [currentCase]);

    const resetGame = () => {
        setGameState(GameState.CASE_SELECTION);
        setCurrentCase(null);
        setTrialHistory([]);
        setEvaluation(null);
        setError(null);
    };

    const renderContent = () => {
        switch (gameState) {
            case GameState.IN_TRIAL:
                return currentCase ? (
                    <TrialScreen 
                        caseDetails={currentCase} 
                        onTrialEnd={handleTrialEnd}
                    />
                ) : null;
            case GameState.TRIAL_END:
                 return (
                    <>
                        {currentCase && <TrialScreen caseDetails={currentCase} onTrialEnd={() => {}} />}
                        <EndScreenModal
                            isOpen={true}
                            onClose={resetGame}
                            evaluation={evaluation}
                            isLoading={isLoading}
                            error={error}
                        />
                    </>
                 );
            case GameState.CASE_SELECTION:
            default:
                return (
                    <CaseSelectionScreen 
                        onSelectCase={handleSelectCase}
                        isLoading={isLoading}
                        error={error}
                        completedCases={completedCases}
                    />
                );
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 flex flex-col items-center p-4 md:p-8">
            <Header onReset={resetGame} />
            <main className="w-full max-w-5xl mt-8 flex-grow">
                {renderContent()}
            </main>
             {gameState === GameState.TRIAL_END && (
                <div className="fixed inset-0 bg-black bg-opacity-75 z-40"></div>
             )}
        </div>
    );
};

export default App;