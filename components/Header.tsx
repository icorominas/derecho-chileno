import React from 'react';
import type { AvatarSettings } from '../types';
import Avatar from './Avatar';

interface HeaderProps {
    onReset: () => void;
    avatarSettings: AvatarSettings;
    onOpenAvatarModal: () => void;
    username: string;
}

const Header: React.FC<HeaderProps> = ({ onReset, avatarSettings, onOpenAvatarModal, username }) => {
    return (
        <header className="w-full max-w-5xl flex justify-between items-center pb-4 border-b border-slate-700">
            <div className="flex items-center gap-4">
                 <button
                    onClick={onOpenAvatarModal}
                    className="rounded-full p-1 border-2 border-slate-600 hover:border-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Personalizar avatar"
                >
                    <Avatar settings={avatarSettings} size={48} />
                </button>
                <div>
                    <h1 className="text-2xl md:text-4xl font-bold text-white font-serif">
                        Abogado Simulado
                    </h1>
                    {username && <p className="text-sm text-blue-300 -mt-1">Abogado {username}</p>}
                </div>
            </div>
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