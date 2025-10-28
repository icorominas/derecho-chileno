
import React from 'react';
import type { Evaluation } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface EndScreenModalProps {
    isOpen: boolean;
    onClose: () => void;
    evaluation: Evaluation | null;
    isLoading: boolean;
    error: string | null;
}

const EndScreenModal: React.FC<EndScreenModalProps> = ({ isOpen, onClose, evaluation, isLoading, error }) => {
    if (!isOpen) {
        return null;
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-400';
        if (score >= 50) return 'text-yellow-400';
        return 'text-red-400';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-slate-700">
                    <h2 className="text-3xl font-bold text-center text-blue-300 font-serif">Veredicto y Evaluación</h2>
                </div>
                
                <div className="p-6 overflow-y-auto flex-grow">
                    {isLoading && <LoadingSpinner message="El jurado está deliberando..." />}
                    {error && !isLoading && <div className="bg-red-900 text-center border border-red-700 text-red-200 px-4 py-3 rounded-md">{error}</div>}
                    {evaluation && !isLoading && (
                        <div className="space-y-6">
                            <div className="text-center bg-slate-900 p-6 rounded-lg">
                                <h3 className="text-lg font-semibold text-slate-400">Puntaje Final</h3>
                                <p className={`text-7xl font-bold ${getScoreColor(evaluation.puntaje)}`}>{evaluation.puntaje}</p>
                                <p className="text-slate-300 mt-2 font-serif">{evaluation.analisis}</p>
                            </div>
                            
                            <div>
                                <h4 className="text-xl font-bold text-green-400 mb-2">Fortalezas</h4>
                                <p className="bg-slate-900/50 p-4 rounded-md text-slate-300">{evaluation.fortalezas}</p>
                            </div>
                            
                            <div>
                                <h4 className="text-xl font-bold text-yellow-400 mb-2">Áreas de Mejora</h4>
                                <p className="bg-slate-900/50 p-4 rounded-md text-slate-300">{evaluation.debilidades}</p>
                            </div>

                            <div>
                                <h4 className="text-xl font-bold text-blue-400 mb-2">Consejos del Catedrático</h4>
                                <p className="bg-slate-900/50 p-4 rounded-md text-slate-300">{evaluation.consejos}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-700 text-center">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 transition-colors w-full md:w-auto"
                    >
                        Volver al Menú Principal
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EndScreenModal;
