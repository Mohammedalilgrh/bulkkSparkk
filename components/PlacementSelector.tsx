import React from 'react';
import { Position } from '../types';

interface PlacementSelectorProps {
    isTitleEnabled: boolean;
    titlePosition: Position;
    onTitlePositionChange: (pos: Position) => void;
    bodyPosition: Position;
    onBodyPositionChange: (pos: Position) => void;
}

const positions: Position[] = [
    'top-left', 'top-center', 'top-right',
    'middle-left', 'middle-center', 'middle-right',
    'bottom-left', 'bottom-center', 'bottom-right'
];

const PlacementSelector: React.FC<PlacementSelectorProps> = ({
    isTitleEnabled,
    titlePosition,
    onTitlePositionChange,
    bodyPosition,
    onBodyPositionChange
}) => {
    return (
        <div className="space-y-4">
            {isTitleEnabled && (
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Title Position</label>
                    <div className="grid grid-cols-3 gap-2 p-2 bg-gray-900 border border-gray-600 rounded-lg">
                        {positions.map(pos => (
                            <button
                                key={`title-${pos}`}
                                onClick={() => onTitlePositionChange(pos)}
                                className={`h-10 w-full rounded-md transition-colors flex items-center justify-center ${
                                    titlePosition === pos
                                        ? 'bg-sky-600 ring-2 ring-sky-400'
                                        : 'bg-gray-700 hover:bg-gray-600'
                                }`}
                                aria-label={`Set title position to ${pos.replace('-', ' ')}`}
                            >
                                {titlePosition === pos && <span className="font-bold text-white">T</span>}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Body Position</label>
                <div className="grid grid-cols-3 gap-2 p-2 bg-gray-900 border border-gray-600 rounded-lg">
                    {positions.map(pos => (
                        <button
                            key={`body-${pos}`}
                            onClick={() => onBodyPositionChange(pos)}
                            className={`h-10 w-full rounded-md transition-colors flex items-center justify-center ${
                                bodyPosition === pos
                                    ? 'bg-emerald-600 ring-2 ring-emerald-400'
                                    : 'bg-gray-700 hover:bg-gray-600'
                            }`}
                             aria-label={`Set body position to ${pos.replace('-', ' ')}`}
                        >
                             {bodyPosition === pos && <span className="font-bold text-white">B</span>}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PlacementSelector;