
import React from 'react';

interface HeaderProps {
    onReset: () => void;
}

const Header: React.FC<HeaderProps> = ({ onReset }) => {
    return (
        <header className="w-full max-w-5xl flex justify-between items-center pb-4 border-b border-slate-700">
            <h1 className="text-2xl md:text-4xl font-bold text-white font-serif">
                Juez Simulado
            </h1>
            <button
                onClick={onReset}
                className="px-4 py-2 bg-slate-700 text-slate-200 rounded-md hover:bg-slate-600 transition-colors text-sm"
            >
                Nuevo Juego
            </button>
        </header>
    );
};

export default Header;
