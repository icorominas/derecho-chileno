
import React from 'react';
import type { AvatarSettings } from '../types';

interface AvatarProps {
    settings: AvatarSettings;
    size?: number;
}

const hairStyles: { [key in AvatarSettings['hairstyle']]: React.ReactNode } = {
    // Un peinado corto y limpio con más volumen que se asienta sobre la cabeza.
    corto: <path d="M 26 38 A 24 24 0 0 1 74 38 L 72 45 C 60 48, 40 48, 28 45 Z" />,
    // Pelo de longitud media que cubre las orejas.
    medio: <path d="M 25 38 A 25 25 0 0 1 75 38 L 76 56 C 65 62, 35 62, 24 56 Z" />,
    // Pelo largo que cae hacia abajo.
    largo: <path d="M 25 38 A 25 25 0 0 1 75 38 L 78 70 C 65 75, 35 75, 22 70 Z" />,
    // Pelo recogido en un moño.
    recogido: (
        <>
            <path d="M 28 38 A 23 23 0 0 1 72 38 C 72 48, 65 52, 50 52 C 35 52, 28 48, 28 38 Z" />
            <circle cx="50" cy="18" r="8" />
        </>
    ),
    calvo: null,
};


const facialHairStyles: { [key in AvatarSettings['facialHair']]: React.ReactNode } = {
    none: null,
    barba: <path d="M 35 50 C 35 60, 40 65, 50 65 C 60 65, 65 60, 65 50 L 60 52 C 55 55, 45 55, 40 52 Z" />,
    bigote: <path d="M 40 52 C 45 50, 55 50, 60 52 L 55 55 Z" />,
};

const glassesStyles: { [key in AvatarSettings['glasses']]: React.ReactNode } = {
    none: null,
    redondas: (
        <g stroke="#1f2937" strokeWidth="2" fill="none">
            <circle cx="42" cy="42" r="7" />
            <circle cx="58" cy="42" r="7" />
            <path d="M 49 42 H 51" />
            <path d="M 35 42 H 25" />
            <path d="M 65 42 H 75" />
        </g>
    ),
    rectangulares: (
        <g stroke="#1f2937" strokeWidth="2" fill="none">
            <rect x="35" y="37" width="14" height="10" />
            <rect x="51" y="37" width="14" height="10" />
            <path d="M 49 42 H 51" />
            <path d="M 35 42 H 25" />
            <path d="M 65 42 H 75" />
        </g>
    ),
};


const Avatar: React.FC<AvatarProps> = ({ settings, size = 64 }) => {
    return (
        <svg width={size} height={size} viewBox="0 0 100 100" className="bg-slate-700 rounded-full">
            <g transform="translate(0, 5)">
                {/* Suit */}
                <path d="M 20 55 L 20 95 L 80 95 L 80 55 C 70 55, 60 65, 50 75 C 40 65, 30 55, 20 55 Z" fill={settings.suitColor} />
                {/* Shirt */}
                <path d="M 40 55 L 50 75 L 60 55 Z" fill="#ffffff" />
                {/* Tie */}
                <path d="M 50 75 L 47 90 L 53 90 Z" fill={settings.tieColor} />

                {/* Head */}
                <circle cx="50" cy="40" r="22" fill={settings.skinTone} />
                
                {/* Facial Hair */}
                <g fill={settings.hairColor}>
                    {facialHairStyles[settings.facialHair]}
                </g>
                
                {/* Hair */}
                <g fill={settings.hairColor}>
                    {hairStyles[settings.hairstyle]}
                </g>

                {/* Face features */}
                <circle cx="42" cy="42" r="1.5" fill="#2c1e1a" />
                <circle cx="58" cy="42" r="1.5" fill="#2c1e1a" />
                <path d="M 45 52 Q 50 55, 55 52" stroke="#2c1e1a" strokeWidth="1.5" fill="none" />
                
                {/* Glasses */}
                {glassesStyles[settings.glasses]}
            </g>
        </svg>
    );
};

export default Avatar;
