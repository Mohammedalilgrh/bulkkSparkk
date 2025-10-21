import React from 'react';
import { CaptionStyle } from '../utils/captionStyles';
import { fontCategories } from '../utils/fonts';

interface CustomStyleEditorProps {
    style: CaptionStyle;
    onChange: (newStyle: CaptionStyle) => void;
}

const fontWeights = ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'];

const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
};

const parseRgba = (rgba: string | undefined): { hex: string; alpha: number } => {
    if (!rgba || !rgba.startsWith('rgba')) {
        return { hex: '#000000', alpha: 0 };
    }
    try {
        const parts = rgba.substring(rgba.indexOf('(') + 1, rgba.lastIndexOf(')')).split(/,\s*/);
        const [r, g, b, a] = parts.map(parseFloat);
        
        if ([r, g, b, a].some(isNaN)) return { hex: '#000000', alpha: 0 };
        
        const toHex = (c: number) => ('0' + Math.round(c).toString(16)).slice(-2);
        const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
        
        return { hex, alpha: a };
    } catch (e) {
        return { hex: '#000000', alpha: 0 };
    }
};


const CustomStyleEditor: React.FC<CustomStyleEditorProps> = ({ style, onChange }) => {
    const handleChange = (field: keyof CaptionStyle, value: any) => {
        onChange({ ...style, [field]: value });
    };

    const handleStrokeChange = (field: 'color' | 'width', value: any) => {
        onChange({ ...style, stroke: { ...style.stroke!, [field]: value } });
    };

    const { hex: bgColorHex, alpha: bgColorAlpha } = parseRgba(style.backgroundColor);
    
    const handleBgColorChange = (hexValue: string) => {
        const newRgba = hexToRgba(hexValue, bgColorAlpha);
        onChange({ ...style, backgroundColor: newRgba });
    };

    const handleBgAlphaChange = (alphaValue: number) => {
        const newRgba = hexToRgba(bgColorHex, alphaValue);
        onChange({ ...style, backgroundColor: newRgba });
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="fontFamily" className="block text-sm font-medium text-gray-300 mb-1">Font Family</label>
                    <select
                        id="fontFamily"
                        value={style.fontFamily}
                        onChange={(e) => handleChange('fontFamily', e.target.value)}
                        className="bg-gray-800 border border-gray-600 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2"
                    >
                        {fontCategories.map(category => (
                            <optgroup key={category.name} label={category.name}>
                                {category.fonts.map(font => (
                                    <option key={font.name} value={font.value}>{font.name}</option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="fontWeight" className="block text-sm font-medium text-gray-300 mb-1">Font Weight</label>
                     <select 
                        id="fontWeight" 
                        value={style.fontWeight} 
                        onChange={(e) => handleChange('fontWeight', e.target.value)}
                        className="bg-gray-800 border border-gray-600 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2"
                     >
                        {fontWeights.map(w => <option key={w} value={w}>{w}</option>)}
                     </select>
                </div>
            </div>
           
            <div className="grid grid-cols-4 gap-4">
                 <div className="flex flex-col items-center">
                    <label htmlFor="fillStyle" className="text-sm font-medium text-gray-300 mb-1">Text</label>
                    <input
                        id="fillStyle"
                        type="color"
                        value={style.fillStyle}
                        onChange={(e) => handleChange('fillStyle', e.target.value)}
                        className="w-10 h-10 p-1 bg-transparent border-none rounded-md cursor-pointer"
                        title="Text Color"
                    />
                </div>
                 <div className="flex flex-col items-center">
                    <label htmlFor="backgroundColor" className="text-sm font-medium text-gray-300 mb-1">Bkgd.</label>
                    <input
                        id="backgroundColor"
                        type="color"
                        value={bgColorHex}
                        onChange={(e) => handleBgColorChange(e.target.value)}
                        className="w-10 h-10 p-1 bg-transparent border-none rounded-md cursor-pointer"
                        title="Background Color"
                    />
                </div>
                 <div className="flex flex-col items-center">
                    <label htmlFor="shadowColor" className="text-sm font-medium text-gray-300 mb-1">Shadow</label>
                    <input
                        id="shadowColor"
                        type="color"
                        value={style.shadowColor.slice(0, 7) || '#000000'}
                        onChange={(e) => handleChange('shadowColor', e.target.value + 'BF')} // Add default alpha
                        className="w-10 h-10 p-1 bg-transparent border-none rounded-md cursor-pointer"
                        title="Shadow Color"
                    />
                </div>
                <div className="flex flex-col items-center">
                    <label htmlFor="strokeColor" className="text-sm font-medium text-gray-300 mb-1">Stroke</label>
                    <input
                        id="strokeColor"
                        type="color"
                        value={style.stroke?.color || '#000000'}
                        onChange={(e) => handleStrokeChange('color', e.target.value)}
                        className="w-10 h-10 p-1 bg-transparent border-none rounded-md cursor-pointer"
                        title="Stroke Color"
                    />
                </div>
            </div>
            
            <div>
                <label htmlFor="backgroundAlpha" className="flex justify-between text-sm text-gray-300 mb-1">
                    <span>Background Opacity</span>
                    <span className="font-mono text-sky-400">{Math.round(bgColorAlpha * 100)}%</span>
                </label>
                <input
                    id="backgroundAlpha"
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={bgColorAlpha}
                    onChange={(e) => handleBgAlphaChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
            </div>
            
             <div>
                <label htmlFor="strokeWidth" className="flex justify-between text-sm text-gray-300 mb-1">
                    <span>Stroke Width</span>
                    <span className="font-mono text-sky-400">{style.stroke?.width || 0}px</span>
                </label>
                <input
                    id="strokeWidth"
                    type="range"
                    min="0" max="10" step="0.5"
                    value={style.stroke?.width || 0}
                    onChange={(e) => handleStrokeChange('width', parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="shadowBlur" className="flex justify-between text-sm text-gray-300 mb-1">
                        <span>Shadow Blur</span>
                        <span className="font-mono text-sky-400">{style.shadowBlur}px</span>
                    </label>
                    <input
                        id="shadowBlur"
                        type="range" min="0" max="50"
                        value={style.shadowBlur}
                        onChange={(e) => handleChange('shadowBlur', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
                 <div>
                    <label htmlFor="shadowOffsetX" className="flex justify-between text-sm text-gray-300 mb-1">
                        <span>Shadow X Offset</span>
                         <span className="font-mono text-sky-400">{style.shadowOffsetX}px</span>
                    </label>
                    <input
                        id="shadowOffsetX"
                        type="range" min="-25" max="25"
                        value={style.shadowOffsetX}
                        onChange={(e) => handleChange('shadowOffsetX', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
                 <div>
                    <label htmlFor="shadowOffsetY" className="flex justify-between text-sm text-gray-300 mb-1">
                        <span>Shadow Y Offset</span>
                         <span className="font-mono text-sky-400">{style.shadowOffsetY}px</span>
                    </label>
                    <input
                        id="shadowOffsetY"
                        type="range" min="-25" max="25"
                        value={style.shadowOffsetY}
                        onChange={(e) => handleChange('shadowOffsetY', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
            </div>
        </div>
    );
};

export default CustomStyleEditor;
