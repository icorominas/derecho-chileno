import React, { useState, useEffect } from 'react';

interface NotepadModalProps {
    isOpen: boolean;
    onClose: () => void;
    caseId: string | null;
}

const NotepadModal: React.FC<NotepadModalProps> = ({ isOpen, onClose, caseId }) => {
    const [notes, setNotes] = useState('');
    const storageKey = caseId ? `simuladoAbogadoNotes_${caseId}` : null;

    useEffect(() => {
        if (isOpen && storageKey) {
            try {
                const savedNotes = window.localStorage.getItem(storageKey);
                if (savedNotes) {
                    setNotes(savedNotes);
                }
            } catch (error) {
                console.error("Error al cargar notas de localStorage:", error);
            }
        }
    }, [isOpen, storageKey]);

    useEffect(() => {
        if (storageKey) {
            try {
                window.localStorage.setItem(storageKey, notes);
            } catch (error) {
                console.error("Error al guardar notas en localStorage:", error);
            }
        }
    }, [notes, storageKey]);
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-slate-700">
                    <h2 className="text-2xl font-bold text-center text-blue-300 font-serif">Bloc de Notas del Caso</h2>
                </div>
                
                <div className="p-6 overflow-y-auto flex-grow">
                    <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Escribe tus notas aquí..."
                        className="w-full h-full min-h-[40vh] p-3 bg-slate-900 border border-slate-600 rounded-md text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
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

export default NotepadModal;