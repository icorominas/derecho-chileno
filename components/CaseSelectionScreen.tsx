import React, { useState } from 'react';
import { LEGAL_AREAS } from '../constants';
import LoadingSpinner from './LoadingSpinner';

interface CaseSelectionScreenProps {
    onSelectCase: (area: string, isCivil: boolean) => void;
    isLoading: boolean;
    error: string | null;
    completedCases: number;
    username: string;
    onUsernameChange: (name: string) => void;
}

const CaseSelectionScreen: React.FC<CaseSelectionScreenProps> = ({ onSelectCase, isLoading, error, completedCases, username, onUsernameChange }) => {
    const [nameInput, setNameInput] = useState('');

    const getDifficultyInfo = () => {
        if (completedCases < 2) return { level: 'Introductorio', next: 'Intermedio', goal: 2 };
        if (completedCases < 5) return { level: 'Intermedio', next: 'Avanzado', goal: 5 };
        return { level: 'Avanzado', next: null, goal: Infinity };
    };

    const handleNameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (nameInput.trim()) {
            onUsernameChange(nameInput.trim());
        }
    };

    if (!username) {
        return (
             <div className="flex flex-col items-center justify-center animate-fade-in h-full">
                <div className="bg-slate-800 p-8 rounded-lg border border-slate-700 w-full max-w-md text-center shadow-2xl">
                    <h2 className="text-3xl font-bold mb-4 font-serif text-blue-300">Bienvenido a tu Bufete</h2>
                    <p className="text-slate-400 mb-6">Para comenzar, por favor ingresa tu nombre de Abogado.</p>
                    <form onSubmit={handleNameSubmit} className="flex flex-col sm:flex-row gap-2">
                        <input
                            type="text"
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value)}
                            placeholder="Ej: A. Pérez"
                            className="flex-grow px-4 py-3 bg-slate-900 border border-slate-600 rounded-md text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label="Nombre de Abogado"
                            required
                        />
                        <button type="submit" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-500 transition-colors">
                            Guardar
                        </button>
                    </form>
                </div>
            </div>
        );
    }
    
    const difficultyInfo = getDifficultyInfo();

    if (isLoading) {
        return <LoadingSpinner message={`Generando caso de nivel ${difficultyInfo.level}...`} />;
    }

    return (
        <div className="flex flex-col items-center animate-fade-in">
            <h2 className="text-3xl font-bold text-center mb-2 font-serif">Bienvenido de vuelta, Abogado {username}</h2>
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