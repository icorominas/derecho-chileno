
import React, { useState, useCallback, useEffect } from 'react';
import { GameState, CaseDetails, Evaluation, TrialStep, AvatarSettings, StageFeedback } from './types';
import Header from './components/Header';
import CaseSelectionScreen from './components/CaseSelectionScreen';
import PreTrialScreen from './components/PreTrialScreen';
import TrialScreen from './components/TrialScreen';
import EndScreenModal from './components/EndScreenModal';
import AvatarModal from './components/AvatarModal';
import { generateCase, evaluatePerformance, advanceTrial } from './services/geminiService';

const FIVE_MINUTES = 5 * 60;

const App: React.FC = () => {
    const [gameState, setGameState] = useState<GameState>(GameState.CASE_SELECTION);
    const [currentCase, setCurrentCase] = useState<CaseDetails | null>(null);
    const [trialHistory, setTrialHistory] = useState<TrialStep[]>([]);
    const [narrative, setNarrative] = useState<string>('');
    const [stageFeedback, setStageFeedback] = useState<StageFeedback | null>(null);
    const [playerInput, setPlayerInput] = useState('');
    const [timeLeft, setTimeLeft] = useState(FIVE_MINUTES);
    const [isTimerActive, setTimerActive] = useState(false);
    
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
    const [isAvatarModalOpen, setAvatarModalOpen] = useState(false);
    
    const [username, setUsername] = useState<string>(() => {
        try {
            return window.localStorage.getItem('simuladoAbogadoUsername') || '';
        } catch (error) {
            console.error("Error al cargar el nombre de usuario de localStorage:", error);
            return '';
        }
    });

    const [completedCases, setCompletedCases] = useState<number>(() => {
        try {
            const savedCases = window.localStorage.getItem('simuladoAbogadoCompletedCases');
            return savedCases ? JSON.parse(savedCases) : 0;
// FIX: Added curly braces to the catch block to correctly handle the error and return a default value.
        } catch (error) {
            console.error("Error al cargar los casos completados de localStorage:", error);
            return 0;
        }
    });

    const [avatarSettings, setAvatarSettings] = useState<AvatarSettings>(() => {
        const defaultSettings: AvatarSettings = {
            hairstyle: 'corto',
            hairColor: '#4a2c20',
            skinTone: '#f0c2a2',
            suitColor: '#334155',
            tieColor: '#dc2626',
            facialHair: 'none',
            glasses: 'none',
        };
        try {
            const saved = window.localStorage.getItem('simuladoAbogadoAvatar');
            if (saved) {
                return { ...defaultSettings, ...JSON.parse(saved) };
            }
            return defaultSettings;
        } catch (error) {
            console.error("Error loading avatar settings from localStorage:", error);
            return defaultSettings;
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem('simuladoAbogadoUsername', username);
        } catch (error) {
            console.error("Error al guardar el nombre de usuario en localStorage:", error);
        }
    }, [username]);


    useEffect(() => {
        try {
            window.localStorage.setItem('simuladoAbogadoCompletedCases', JSON.stringify(completedCases));
        } catch (error) {
            console.error("Error al guardar los casos completados en localStorage:", error);
        }
    }, [completedCases]);

    useEffect(() => {
        try {
            window.localStorage.setItem('simuladoAbogadoAvatar', JSON.stringify(avatarSettings));
        } catch (error) {
            console.error("Error saving avatar settings to localStorage:", error);
        }
    }, [avatarSettings]);


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
            setNarrative('');
            setStageFeedback(null);
            setPlayerInput('');
            setGameState(GameState.PRE_TRIAL);
        } catch (err) {
            setError('Error al generar el caso. Por favor, intente de nuevo.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [completedCases]);

    const handlePreTrialComplete = (initialHistory: TrialStep[], initialNarrative: string) => {
        setTrialHistory(initialHistory);
        setNarrative(initialNarrative);
        setGameState(GameState.IN_TRIAL);
    };
    
    const startTurn = useCallback(() => {
        if (currentCase && !currentCase.esCivil) {
            setTimeLeft(FIVE_MINUTES);
            setTimerActive(true);
        }
    }, [currentCase]);

    useEffect(() => {
        if (gameState === GameState.IN_TRIAL) {
            startTurn();
        }
    }, [gameState, startTurn]);


    const handlePlayerAction = useCallback(async () => {
        if (!playerInput.trim() && currentCase && !currentCase.esCivil) {
            setError("Debes presentar un argumento para proceder.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setTimerActive(false);

        const newStep: TrialStep = {
            accion: currentCase?.esCivil 
                ? `Presentación de escrito: ${playerInput.substring(0, 50)}...` 
                : `Argumento oral: ${playerInput.substring(0, 50)}...`,
            narrativa: narrative,
            submission: playerInput,
        };
        const newHistory = [...trialHistory, newStep];
        setTrialHistory(newHistory);
        
        try {
            if (currentCase) {
                const result = await advanceTrial(currentCase, newHistory, playerInput);
                setNarrative(result.narrativa);
                setStageFeedback(result.stageFeedback ?? null);
                setPlayerInput('');
                
                if (result.juegoTerminado) {
                    const finalStep: TrialStep = { accion: "Conclusión del juicio.", narrativa: result.narrativa };
                    handleTrialEnd([...newHistory, finalStep]);
                } else {
                    startTurn();
                }
            }
        } catch (err) {
            setError("La IA no pudo continuar el juicio. Puedes intentar de nuevo o concluir el caso.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [playerInput, narrative, trialHistory, currentCase, startTurn]);

    const handleTrialEnd = useCallback(async (finalHistory: TrialStep[]) => {
        setIsLoading(true);
        setError(null);
        setTrialHistory(finalHistory);
        setGameState(GameState.TRIAL_END);
        try {
            if (currentCase) {
                const evalResult = await evaluatePerformance(finalHistory, currentCase.objetivoJugador);
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
        setNarrative('');
        setStageFeedback(null);
        setPlayerInput('');
        setEvaluation(null);
        setError(null);
        setTimerActive(false);
    };

    const renderContent = () => {
        switch (gameState) {
            case GameState.PRE_TRIAL:
                 return currentCase ? (
                    <PreTrialScreen 
                        caseDetails={currentCase} 
                        onPreTrialComplete={handlePreTrialComplete} 
                    />
                ) : null;
            case GameState.IN_TRIAL:
            case GameState.TRIAL_END: // Render trial screen in both states for background
                return currentCase ? (
                    <TrialScreen 
                        caseDetails={currentCase}
                        narrative={narrative}
                        stageFeedback={stageFeedback}
                        isLoading={isLoading}
                        error={error}
                        playerInput={playerInput}
                        onPlayerInputChange={setPlayerInput}
                        onSubmit={handlePlayerAction}
                        onConclude={() => handleTrialEnd(trialHistory)}
                        isReadOnly={gameState === GameState.TRIAL_END}
                        timeLeft={timeLeft}
                        setTimeLeft={setTimeLeft}
                        isTimerActive={isTimerActive}
                        setTimerActive={setTimerActive}
                    />
                ) : null;
            case GameState.CASE_SELECTION:
            default:
                return (
                    <CaseSelectionScreen 
                        onSelectCase={handleSelectCase}
                        isLoading={isLoading}
                        error={error}
                        completedCases={completedCases}
                        username={username}
                        onUsernameChange={setUsername}
                    />
                );
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 flex flex-col items-center p-4 md:p-8">
            <Header 
                onReset={resetGame} 
                avatarSettings={avatarSettings}
                onOpenAvatarModal={() => setAvatarModalOpen(true)}
                username={username}
            />
            <main className="w-full max-w-5xl mt-8 flex-grow">
                {renderContent()}
            </main>
            {isAvatarModalOpen && (
                <AvatarModal
                    isOpen={isAvatarModalOpen}
                    onClose={() => setAvatarModalOpen(false)}
                    settings={avatarSettings}
                    onSettingsChange={setAvatarSettings}
                />
            )}
             {gameState === GameState.TRIAL_END && (
                <>
                    <div className="fixed inset-0 bg-black bg-opacity-75 z-40"></div>
                     <EndScreenModal
                        isOpen={true}
                        onClose={resetGame}
                        evaluation={evaluation}
                        isLoading={isLoading && !evaluation}
                        error={error}
                    />
                </>
             )}
        </div>
    );
};

export default App;
