
import React from 'react';

interface LoadingSpinnerProps {
    message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = "Procesando..." }) => {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-lg text-slate-300">{message}</p>
        </div>
    );
};

export default LoadingSpinner;
