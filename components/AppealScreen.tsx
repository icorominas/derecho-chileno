import React from 'react';
import type { CompletedCase } from '../types';

interface AppealScreenProps {
    completedCase: CompletedCase;
    onReturn: () => void;
}

const AppealScreen: React.FC<AppealScreenProps> = ({ completedCase, onReturn }) => {
    return (
        <div className="flex flex-col items-center justify-center animate-fade-in h-full text-center">
            <div className="bg-slate-800 p-8 rounded-lg border border-slate-700 w-full max-w-md shadow-2xl">
                <h2 className="text-3xl font-bold mb-4 font-serif text-blue-300">Apelación</h2>
                <p className="text-slate-400 mb-6">
                    La función de apelación está en desarrollo. ¡Vuelve pronto para desafiar el veredicto en el caso "{completedCase.caseDetails.titulo}"!
                </p>
                <button onClick={onReturn} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-500 transition-colors">
                    Volver
                </button>
            </div>
        </div>
    );
};

export default AppealScreen;
