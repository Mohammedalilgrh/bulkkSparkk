import React, { useState, useEffect } from 'react';
import { LoaderIcon } from './IconComponents';

interface QuoteCardProps {
  quote: string;
  isProcessing: boolean;
  startTime?: number;
}

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
};

const QuoteCard: React.FC<QuoteCardProps> = ({ quote, isProcessing, startTime }) => {
    const [elapsedTime, setElapsedTime] = useState(0);

    useEffect(() => {
        if (!isProcessing || !startTime) {
            setElapsedTime(0);
            return;
        }

        const intervalId = setInterval(() => {
            const seconds = Math.floor((Date.now() - startTime) / 1000);
            setElapsedTime(seconds);
        }, 1000);
        
        // Set initial time immediately
        const initialSeconds = Math.floor((Date.now() - startTime) / 1000);
        setElapsedTime(initialSeconds);


        return () => clearInterval(intervalId);
    }, [isProcessing, startTime]);

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4 flex flex-col justify-between shadow-lg h-full">
            <div className="flex-grow flex items-center justify-center">
                <p className="text-gray-200 text-base italic text-center leading-relaxed whitespace-pre-wrap">"{quote}"</p>
            </div>
            {isProcessing && (
                <div className="mt-4 flex items-center justify-between text-sm text-sky-400">
                    <div className="flex items-center">
                        <LoaderIcon className="animate-spin mr-2 h-4 w-4" />
                        <span>Processing...</span>
                    </div>
                    {startTime && <span className="font-mono">{formatTime(elapsedTime)}</span>}
                </div>
            )}
        </div>
    );
};

export default QuoteCard;