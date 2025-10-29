import React, { useState, useEffect } from 'react';

const CalendarAnimation: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const days = Array.from({ length: 35 }, (_, i) => i + 1); // 5 weeks
    const [highlightedDays, setHighlightedDays] = useState(0);

    useEffect(() => {
        const totalDaysToAnimate = 14; // Animate 2 weeks for effect
        const animationDuration = 2000; // 2 seconds
        const intervalTime = animationDuration / totalDaysToAnimate;

        const timer = setInterval(() => {
            setHighlightedDays(prev => {
                if (prev >= totalDaysToAnimate) {
                    clearInterval(timer);
                    setTimeout(onComplete, 700); // Wait a moment before completing
                    return prev;
                }
                return prev + 1;
            });
        }, intervalTime);

        return () => clearInterval(timer);
    }, [onComplete]);

    return (
        <div className="flex flex-col items-center justify-center p-8 text-center animate-fade-in w-full h-full">
            <h3 className="text-2xl font-serif mb-4 text-blue-300">Demanda Admitida a Trámite</h3>
            <p className="mb-6 text-slate-400">Corren los plazos procesales...</p>
            <div className="grid grid-cols-7 gap-2 p-4 bg-slate-900 border border-slate-700 rounded-lg shadow-lg">
                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => <div key={i} className="font-bold text-center text-slate-500 text-sm">{d}</div>)}
                {days.map(day => (
                    <div
                        key={day}
                        className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 text-sm ${
                            day <= highlightedDays ? 'bg-blue-600 text-white transform scale-110' : 'bg-slate-700 text-slate-400'
                        }`}
                    >
                        {day <= 30 ? day : ''}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CalendarAnimation;
