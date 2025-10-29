import React, { useState } from 'react';
import type { CompletedCase } from '../types';
import CaseHistoryDetailModal from './CaseHistoryDetailModal';

interface CaseHistoryScreenProps {
    cases: CompletedCase[];
    onBack: () => void;
}

const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
};

const CaseHistoryScreen: React.FC<CaseHistoryScreenProps> = ({ cases, onBack }) => {
    const [selectedCase, setSelectedCase] = useState<CompletedCase | null>(null);
    const sortedCases = [...cases].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

    return (
        <>
            <CaseHistoryDetailModal
                caseData={selectedCase}
                onClose={() => setSelectedCase(null)}
            />
            <div className="w-full max-w-4xl mx-auto animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold font-serif text-blue-300">Historial de Casos</h2>
                    <button onClick={onBack} className="px-4 py-2 bg-slate-700 text-slate-200 rounded-md hover:bg-slate-600 transition-colors text-sm">
                        &larr; Volver
                    </button>
                </div>

                {sortedCases.length === 0 ? (
                    <div className="text-center bg-slate-800 border border-slate-700 rounded-lg p-8">
                        <p className="text-slate-400">Aún no has completado ningún caso. ¡Tu historial aparecerá aquí cuando lo hagas!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sortedCases.map((caseItem) => (
                            <button
                                key={caseItem.id}
                                onClick={() => setSelectedCase(caseItem)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-4 text-left hover:bg-slate-700 hover:border-blue-500 transition-all duration-200 flex justify-between items-center"
                            >
                                <div>
                                    <h3 className="font-bold text-lg text-blue-300">{caseItem.caseDetails.titulo}</h3>
                                    <p className="text-sm text-slate-400">{caseItem.caseDetails.area} &bull; Completado el {new Date(caseItem.completedAt).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-slate-500">Puntaje</p>
                                    <p className={`text-2xl font-bold ${getScoreColor(caseItem.evaluation.puntaje)}`}>{caseItem.evaluation.puntaje}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default CaseHistoryScreen;
