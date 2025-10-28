import React, { useState, useMemo } from 'react';
import type { GlossaryTerm } from '../types';

interface GlossaryModalProps {
    isOpen: boolean;
    onClose: () => void;
    terms: GlossaryTerm[];
}

const GlossaryModal: React.FC<GlossaryModalProps> = ({ isOpen, onClose, terms }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredTerms = useMemo(() => {
        if (!searchTerm) return terms;
        return terms.filter(term =>
            term.termino.toLowerCase().includes(searchTerm.toLowerCase()) ||
            term.definicion.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, terms]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-slate-700">
                    <h2 className="text-2xl font-bold text-center text-blue-300 font-serif">Glosario Legal del Caso</h2>
                </div>

                <div className="p-4 border-b border-slate-600">
                    <input
                        type="text"
                        placeholder="Buscar término..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-md text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                
                <div className="p-6 overflow-y-auto flex-grow">
                    {filteredTerms.length > 0 ? (
                        <dl>
                            {filteredTerms.map(term => (
                                <div key={term.termino} className="mb-4">
                                    <dt className="text-lg font-bold text-blue-300">{term.termino}</dt>
                                    <dd className="text-slate-300 ml-4">{term.definicion}</dd>
                                    {term.fuente && <dd className="text-xs text-slate-500 ml-4 mt-1 italic">Fuente: {term.fuente}</dd>}
                                </div>
                            ))}
                        </dl>
                    ) : (
                        <p className="text-slate-400 text-center">No se encontraron términos.</p>
                    )}
                </div>

                <div className="p-4 border-t border-slate-700 text-center">
                    <button onClick={onClose} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 transition-colors">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GlossaryModal;
