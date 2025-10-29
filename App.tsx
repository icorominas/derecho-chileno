
import React, { useState, useEffect, useCallback } from 'react';

// Types
import { GameState, CaseDetails, TrialStep, Evaluation, StageFeedback, AvatarSettings, TrialContinuation } from './types';

// Components
import Header from './components/Header';
import CaseSelectionScreen from './components/CaseSelectionScreen';
import PreTrialScreen from './components/PreTrialScreen';
import TrialScreen from './components/TrialScreen';
import EndScreenModal from './components/EndScreenModal';
import AvatarModal from './components/AvatarModal';

// Services
import { generateCase, advanceTrial, evaluatePerformance } from './services/geminiService';

// Guided Cases
import { TUTORIAL_CASE_DESPIDO_INJUSTIFICADO } from './guidedCases';

const DEFAULT_AVATAR_SETTINGS: AvatarSettings = {
  hairstyle: 'corto',
  hairColor: '#4a2c20',
  skinTone: '#d89c7c',
  suitColor: '#334155',
  tieColor: '#dc2626',
  facialHair: 'none',
  glasses: 'none',
};

const ORAL_TRIAL_DURATION = 5 * 60; // 5 minutes for oral trials

function App() {
  // Game state
  const [gameState, setGameState] = useState<GameState>(GameState.CASE_SELECTION);
  const [caseDetails, setCaseDetails] = useState<CaseDetails | null>(null);
  const [trialHistory, setTrialHistory] = useState<TrialStep[]>([]);
  const [narrative, setNarrative] = useState('');
  const [stageFeedback, setStageFeedback] = useState<StageFeedback | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playerInput, setPlayerInput] = useState('');
  const [isReadOnly, setIsReadOnly] = useState(false);
  
  // Oral trial timer state
  const [timeLeft, setTimeLeft] = useState(ORAL_TRIAL_DURATION);
  const [isTimerActive, setTimerActive] = useState(false);

  // User persistence
  const [username, setUsername] = useState<string>(() => localStorage.getItem('abogadoSimuladoUser') || '');
  const [completedCases, setCompletedCases] = useState<number>(() => parseInt(localStorage.getItem('abogadoSimuladoCompleted') || '0', 10));
  const [avatarSettings, setAvatarSettings] = useState<AvatarSettings>(() => {
    try {
      const saved = localStorage.getItem('abogadoSimuladoAvatar');
      return saved ? JSON.parse(saved) : DEFAULT_AVATAR_SETTINGS;
    } catch {
      return DEFAULT_AVATAR_SETTINGS;
    }
  });
  const [isAvatarModalOpen, setAvatarModalOpen] = useState(false);


  useEffect(() => {
    localStorage.setItem('abogadoSimuladoUser', username);
  }, [username]);
  
  useEffect(() => {
    localStorage.setItem('abogadoSimuladoCompleted', completedCases.toString());
  }, [completedCases]);

  useEffect(() => {
    localStorage.setItem('abogadoSimuladoAvatar', JSON.stringify(avatarSettings));
  }, [avatarSettings]);


  const handleReset = useCallback(() => {
    setGameState(GameState.CASE_SELECTION);
    setCaseDetails(null);
    setTrialHistory([]);
    setNarrative('');
    setStageFeedback(null);
    setEvaluation(null);
    setIsLoading(false);
    setError(null);
    setPlayerInput('');
    setIsReadOnly(false);
    setTimeLeft(ORAL_TRIAL_DURATION);
    setTimerActive(false);
  }, []);

  const getDifficulty = useCallback((): 'Introductorio' | 'Intermedio' | 'Avanzado' => {
    if (completedCases < 2) return 'Introductorio';
    if (completedCases < 5) return 'Intermedio';
    return 'Avanzado';
  }, [completedCases]);

  const handleSelectCase = async (area: string, isCivil: boolean) => {
    setIsLoading(true);
    setError(null);
    try {
      const difficulty = getDifficulty();
      const newCase = await generateCase(area, isCivil, difficulty);
      setCaseDetails(newCase);
      setGameState(GameState.PRE_TRIAL);
    } catch (err) {
      setError("No se pudo generar el caso. Por favor, intenta de nuevo.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectGuidedCase = (guidedCase: CaseDetails) => {
    setIsLoading(true);
    setError(null);
    // No API call, just load the predefined case
    setTimeout(() => { // Simulate a small loading time for UX consistency
        setCaseDetails(guidedCase);
        setGameState(GameState.PRE_TRIAL);
        setIsLoading(false);
    }, 500);
  };
  
  const handlePreTrialComplete = (initialHistory: TrialStep[], initialNarrative: string) => {
    setTrialHistory(initialHistory);
    setNarrative(initialNarrative);
    setGameState(GameState.IN_TRIAL);
    if (caseDetails && !caseDetails.esCivil) {
        setTimeLeft(ORAL_TRIAL_DURATION);
        setTimerActive(true);
    }
  };

  const handleSubmitAction = async () => {
    if (!caseDetails || !playerInput.trim()) return;

    setIsLoading(true);
    setError(null);
    setStageFeedback(null);
    
    const newStep: TrialStep = {
        accion: caseDetails.esCivil ? 'Presentación de Escrito' : 'Argumento Oral',
        narrativa: `El jugador ${caseDetails.esCivil ? 'presentó un escrito' : 'argumentó oralmente'}.`,
        submission: playerInput,
    };
    const updatedHistory = [...trialHistory, newStep];
    setTrialHistory(updatedHistory);

    try {
        const continuation: TrialContinuation = await advanceTrial(caseDetails, updatedHistory, playerInput);
        
        setNarrative(prev => `${prev}\n\n---\n\n**Tu acción:** ${playerInput}\n\n${continuation.narrativa}`);
        setStageFeedback(continuation.stageFeedback || null);
        setPlayerInput('');
        
        if (continuation.juegoTerminado) {
            setIsReadOnly(true);
            setTimerActive(false);
            // Wait a moment before concluding to let the user read the final narrative
            setTimeout(() => handleConcludeTrial(updatedHistory), 3000);
        }

    } catch (err) {
        setError("Ocurrió un error al procesar tu acción. Inténtalo de nuevo.");
        console.error(err);
        // Revert history on error
        setTrialHistory(trialHistory);
    } finally {
        setIsLoading(false);
    }
  };

  const handleConcludeTrial = async (finalHistory?: TrialStep[]) => {
      const historyToEvaluate = finalHistory || trialHistory;
      if (!caseDetails || historyToEvaluate.length === 0) {
          handleReset(); // Nothing to evaluate, just reset.
          return;
      }

      setGameState(GameState.TRIAL_END);
      setIsLoading(true);
      setError(null);
      setTimerActive(false);

      try {
          const result = await evaluatePerformance(historyToEvaluate, caseDetails.objetivoJugador);
          setEvaluation(result);
          if (result.puntaje >= 50 && !caseDetails.isGuided) { // Guided cases don't count for difficulty progression
              setCompletedCases(c => c + 1);
          }
      } catch (err) {
          setError("No se pudo obtener la evaluación. Cierra esta ventana para volver al menú.");
          console.error(err);
      } finally {
          setIsLoading(false);
      }
  };

  const renderGameState = () => {
    switch (gameState) {
      case GameState.CASE_SELECTION:
        return <CaseSelectionScreen 
          onSelectCase={handleSelectCase} 
          onSelectGuidedCase={handleSelectGuidedCase}
          isLoading={isLoading}
          error={error}
          completedCases={completedCases}
          username={username}
          onUsernameChange={setUsername}
        />;
      case GameState.PRE_TRIAL:
        if (!caseDetails) return null; // Or show an error screen
        return <PreTrialScreen 
          caseDetails={caseDetails}
          onPreTrialComplete={handlePreTrialComplete}
        />;
      case GameState.IN_TRIAL:
        if (!caseDetails) return null;
        return <TrialScreen
            caseDetails={caseDetails}
            narrative={narrative}
            stageFeedback={stageFeedback}
            trialHistory={trialHistory}
            isLoading={isLoading}
            error={error}
            playerInput={playerInput}
            onPlayerInputChange={setPlayerInput}
            onSubmit={handleSubmitAction}
            onConclude={() => handleConcludeTrial()}
            isReadOnly={isReadOnly}
            timeLeft={timeLeft}
            setTimeLeft={setTimeLeft}
            isTimerActive={isTimerActive}
            setTimerActive={setTimerActive}
        />
      case GameState.TRIAL_END:
        // The modal is rendered outside of this switch, this state just triggers it.
        // We can show a background or nothing.
        return null;
      default:
        return <div>Estado de juego desconocido.</div>;
    }
  }

  return (
    <div className="bg-slate-900 text-slate-200 min-h-screen font-sans">
      <main className="container mx-auto px-4 py-8">
        <Header 
          onReset={handleReset} 
          avatarSettings={avatarSettings} 
          onOpenAvatarModal={() => setAvatarModalOpen(true)}
          username={username}
        />
        <div className="mt-8">
            {renderGameState()}
        </div>
      </main>
      <EndScreenModal 
        isOpen={gameState === GameState.TRIAL_END}
        onClose={handleReset}
        evaluation={evaluation}
        isLoading={isLoading}
        error={error}
      />
      <AvatarModal
        isOpen={isAvatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
        settings={avatarSettings}
        onSettingsChange={setAvatarSettings}
      />
    </div>
  );
}

export default App;