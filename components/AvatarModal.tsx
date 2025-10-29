import React from 'react';
import type { AvatarSettings } from '../types';
import Avatar from './Avatar';

interface AvatarModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: AvatarSettings;
    onSettingsChange: (newSettings: AvatarSettings) => void;
}

const suitColors = [
    { name: 'Gris Pizarra', value: '#334155' }, { name: 'Azul Marino', value: '#1e3a8a' },
    { name: 'Negro', value: '#1f2937' }, { name: 'Gris Claro', value: '#4b5563' },
];
const tieColors = [
    { name: 'Rojo', value: '#dc2626' }, { name: 'Azul', value: '#2563eb' },
    { name: 'Plata', value: '#9ca3af' }, { name: 'Dorado', value: '#f59e0b' },
];
const hairColors = [
    { name: 'Castaño Oscuro', value: '#4a2c20' }, { name: 'Negro', value: '#1c1917' },
    { name: 'Rubio', value: '#fde047' }, { name: 'Gris', value: '#9ca3af' },
];
const skinTones = [
    { name: 'Claro', value: '#f0c2a2' }, { name: 'Medio', value: '#d89c7c' },
    { name: 'Moreno', value: '#a05c3c' }, { name: 'Oscuro', value: '#6d4c41' },
];

const hairstyles: { name: string; value: AvatarSettings['hairstyle'] }[] = [
    { name: 'Corto', value: 'corto' }, { name: 'Medio', value: 'medio' },
    { name: 'Largo', value: 'largo' }, { name: 'Recogido', value: 'recogido' },
    { name: 'Calvo', value: 'calvo' },
];
const facialHairs: { name: string; value: AvatarSettings['facialHair'] }[] = [
    { name: 'Ninguno', value: 'none' }, { name: 'Barba', value: 'barba' }, { name: 'Bigote', value: 'bigote' },
];
const glassesOptions: { name: string; value: AvatarSettings['glasses'] }[] = [
    { name: 'Ningunas', value: 'none' }, { name: 'Redondas', value: 'redondas' }, { name: 'Rectangulares', value: 'rectangulares' },
];


const AvatarModal: React.FC<AvatarModalProps> = ({ isOpen, onClose, settings, onSettingsChange }) => {
    if (!isOpen) {
        return null;
    }

    const OptionButton: React.FC<{onClick: () => void, isActive: boolean, children: React.ReactNode}> = ({ onClick, isActive, children }) => (
        <button onClick={onClick} className={`px-4 py-2 rounded-md transition-colors text-sm ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>
            {children}
        </button>
    );

    const ColorSwatch: React.FC<{color: string, name: string, onClick: () => void, isActive: boolean}> = ({ color, name, onClick, isActive }) => (
         <button onClick={onClick} aria-label={name} className={`w-10 h-10 rounded-full border-2 transition-transform transform hover:scale-110 ${isActive ? 'border-blue-400 scale-110' : 'border-slate-600'}`} style={{ backgroundColor: color }} />
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-700">
                    <h2 className="text-3xl font-bold text-center text-blue-300 font-serif">Personalizar Avatar</h2>
                </div>
                
                <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="flex-shrink-0 flex justify-center items-start md:col-span-1">
                        <Avatar settings={settings} size={180} />
                    </div>
                    <div className="space-y-6 md:col-span-2">
                        {/* Apariencia */}
                        <div className="space-y-4">
                             <div>
                                <h3 className="text-lg font-semibold mb-3 text-slate-300">Peinado</h3>
                                <div className="flex flex-wrap gap-2">
                                    {hairstyles.map(style => <OptionButton key={style.value} onClick={() => onSettingsChange({...settings, hairstyle: style.value})} isActive={settings.hairstyle === style.value}>{style.name}</OptionButton>)}
                                </div>
                            </div>
                             <div>
                                <h3 className="text-lg font-semibold mb-3 text-slate-300">Color de Pelo</h3>
                                <div className="flex flex-wrap gap-3">
                                    {hairColors.map(color => <ColorSwatch key={color.value} color={color.value} name={color.name} onClick={() => onSettingsChange({...settings, hairColor: color.value})} isActive={settings.hairColor === color.value} />)}
                                </div>
                            </div>
                             <div>
                                <h3 className="text-lg font-semibold mb-3 text-slate-300">Tono de Piel</h3>
                                <div className="flex flex-wrap gap-3">
                                    {skinTones.map(color => <ColorSwatch key={color.value} color={color.value} name={color.name} onClick={() => onSettingsChange({...settings, skinTone: color.value})} isActive={settings.skinTone === color.value} />)}
                                </div>
                            </div>
                              <div>
                                <h3 className="text-lg font-semibold mb-3 text-slate-300">Vello Facial</h3>
                                <div className="flex flex-wrap gap-2">
                                    {facialHairs.map(item => <OptionButton key={item.value} onClick={() => onSettingsChange({...settings, facialHair: item.value})} isActive={settings.facialHair === item.value}>{item.name}</OptionButton>)}
                                </div>
                            </div>
                        </div>
                        {/* Vestimenta y Accesorios */}
                        <div className="space-y-4 pt-4 border-t border-slate-700">
                             <div>
                                <h3 className="text-lg font-semibold mb-3 text-slate-300">Color de Traje</h3>
                                <div className="flex flex-wrap gap-3">
                                    {suitColors.map(color => <ColorSwatch key={color.value} color={color.value} name={color.name} onClick={() => onSettingsChange({...settings, suitColor: color.value})} isActive={settings.suitColor === color.value} />)}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold mb-3 text-slate-300">Color de Corbata</h3>
                                <div className="flex flex-wrap gap-3">
                                    {tieColors.map(color => <ColorSwatch key={color.value} color={color.value} name={color.name} onClick={() => onSettingsChange({...settings, tieColor: color.value})} isActive={settings.tieColor === color.value} />)}
                                </div>
                            </div>
                              <div>
                                <h3 className="text-lg font-semibold mb-3 text-slate-300">Accesorios</h3>
                                <div className="flex flex-wrap gap-2">
                                    {glassesOptions.map(item => <OptionButton key={item.value} onClick={() => onSettingsChange({...settings, glasses: item.value})} isActive={settings.glasses === item.value}>{item.name}</OptionButton>)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-700 text-center">
                    <button onClick={onClose} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 transition-colors w-full md:w-auto">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AvatarModal;