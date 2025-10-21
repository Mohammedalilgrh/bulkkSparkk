import React from 'react';
import { captionStyles, CaptionStyle } from '../utils/captionStyles';
import { TextEffect } from '../types';

interface CaptionPreviewProps {
    styleId: string;
    customStyle?: CaptionStyle;
    textEffect: TextEffect;
}

const CaptionPreview: React.FC<CaptionPreviewProps> = ({ styleId, customStyle, textEffect }) => {
    const style = styleId === 'custom' && customStyle
        ? customStyle
        : captionStyles.find(s => s.id === styleId) || captionStyles[0];

    const previewStyle: React.CSSProperties = {
        fontFamily: style.fontFamily,
        fontWeight: style.fontWeight || 'normal',
        color: style.fillStyle,
        backgroundColor: style.backgroundColor,
        padding: '10px',
        borderRadius: '5px',
        textAlign: 'center',
        marginTop: '0.5rem',
        letterSpacing: '0.02em',
    };

    if (textEffect === 'glow') {
        previewStyle.textShadow = `0 0 15px ${style.fillStyle}, ${style.shadowOffsetX}px ${style.shadowOffsetY}px ${style.shadowBlur}px ${style.shadowColor}`;
    } else if (textEffect === 'outline') {
        const outlineColor = style.shadowColor || 'black';
        previewStyle.textShadow = `-1px -1px 0 ${outlineColor}, 1px -1px 0 ${outlineColor}, -1px 1px 0 ${outlineColor}, 1px 1px 0 ${outlineColor}`;
    } else {
        previewStyle.textShadow = `${style.shadowOffsetX}px ${style.shadowOffsetY}px ${style.shadowBlur}px ${style.shadowColor}`;
    }

    if (style.stroke && style.stroke.width > 0) {
        (previewStyle as any).WebkitTextStroke = `${style.stroke.width}px ${style.stroke.color}`;
    }


    return (
        <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Style Preview</label>
            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 flex items-center justify-center min-h-[72px]">
                <p style={previewStyle}>Caption Preview</p>
            </div>
        </div>
    );
};

export default CaptionPreview;
