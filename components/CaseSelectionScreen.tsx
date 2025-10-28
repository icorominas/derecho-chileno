import React from 'react';
import { LEGAL_AREAS } from '../constants';
import LoadingSpinner from './LoadingSpinner';

interface CaseSelectionScreenProps {
    onSelectCase: (area: string, isCivil: boolean) => void;
    isLoading: boolean;
    error: string | null;
    completedCases: number;
}

const CaseSelectionScreen: React.FC<CaseSelectionScreenProps> = ({ onSelectCase, isLoading, error, completedCases }) => {
    
    const getDifficultyInfo = () => {
        if (completedCases < 2) return { level: 'Introductorio', next: 'Intermedio', goal: 2 };
        if (completedCases < 5) return { level: 'Intermedio', next: 'Avanzado', goal: 5 };
        return { level: 'Avanzado', next: null, goal: Infinity };
    };

    const difficultyInfo = getDifficultyInfo();

    if (isLoading) {
        return <LoadingSpinner message={`Generando caso de nivel ${difficultyInfo.level}...`} />;
    }

    return (
        <div className="flex flex-col items-center animate-fade-in">
            <h2 className="text-3xl font-bold text-center mb-2 font-serif">Bienvenido a la Corte</h2>
            <p className="text-lg text-slate-400 text-center mb-4">Elige un área del derecho para comenzar tu próximo caso.</p>
            
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-8 w-full max-w-2xl text-center">
                <p className="font-bold text-blue-300">Nivel de Dificultad Actual: <span className="text-white">{difficultyInfo.level}</span></p>
                {difficultyInfo.next && (
                     <p className="text-sm text-slate-400">Completa {difficultyInfo.goal - completedCases} caso(s) más con éxito para desbloquear el nivel '{difficultyInfo.next}'.</p>
                )}
            </div>

            {error && <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-md mb-6 w-full max-w-md text-center">{error}</div>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                {LEGAL_AREAS.map((area) => (
                    <button
                        key={area.name}
                        onClick={() => onSelectCase(area.name, area.isCivil)}
                        className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-left hover:bg-slate-700 hover:border-blue-500 transition-all duration-300 transform hover:-translate-y-1"
                    >
                        <div className="flex items-start">
                           <span className="text-3xl mr-4">{area.icon}</span>
                            <div>
                                <h3 className="text-xl font-bold text-blue-300">{area.name}</h3>
                                <p className="text-slate-400 mt-1">{area.description}</p>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default CaseSelectionScreen;
