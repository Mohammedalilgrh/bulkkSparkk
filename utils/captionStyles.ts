export interface CaptionStyle {
    id: string;
    name: string;
    fontFamily: string;
    fontWeight?: string;
    fillStyle: string;
    backgroundColor?: string;
    shadowColor: string;
    shadowBlur: number;
    shadowOffsetX: number;
    shadowOffsetY: number;
    stroke?: {
        color: string;
        width: number;
    };
}

export const captionStyles: CaptionStyle[] = [
    {
        id: 'classic',
        name: 'Classic',
        fontFamily: 'Merriweather, serif',
        fontWeight: '700',
        fillStyle: '#FFFFFF',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        shadowColor: 'rgba(0, 0, 0, 0.7)',
        shadowBlur: 10,
        shadowOffsetX: 2,
        shadowOffsetY: 2,
    },
    {
        id: 'modern',
        name: 'Modern',
        fontFamily: 'Arial, sans-serif',
        fontWeight: '900',
        fillStyle: '#FFFFFF',
        backgroundColor: undefined,
        shadowColor: 'rgba(0, 0, 0, 0.8)',
        shadowBlur: 5,
        shadowOffsetX: 3,
        shadowOffsetY: 3,
    },
    {
        id: 'elegant',
        name: 'Elegant',
        fontFamily: 'Georgia, serif',
        fillStyle: '#F0E68C', // Khaki
        backgroundColor: undefined,
        shadowColor: 'rgba(0, 0, 0, 0.5)',
        shadowBlur: 15,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
    },
    {
        id: 'neon',
        name: 'Neon',
        fontFamily: 'Courier New, monospace',
        fontWeight: '900',
        fillStyle: '#00FFFF', // Cyan
        backgroundColor: undefined,
        shadowColor: '#00FFFF',
        shadowBlur: 20,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
    },
    {
        id: 'cinematic',
        name: 'Cinematic',
        fontFamily: 'Impact, sans-serif',
        fontWeight: 'normal',
        fillStyle: '#FFFFFF',
        backgroundColor: undefined,
        shadowColor: 'rgba(0, 0, 0, 1)',
        shadowBlur: 0,
        shadowOffsetX: 2,
        shadowOffsetY: 2,
    },
    {
        id: 'minimalist',
        name: 'Minimalist',
        fontFamily: 'Helvetica Neue, sans-serif',
        fontWeight: '300',
        fillStyle: '#FFFFFF',
        backgroundColor: undefined,
        shadowColor: 'transparent',
        shadowBlur: 0,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
    },
    {
        id: 'handwritten',
        name: 'Handwritten',
        fontFamily: 'cursive',
        fontWeight: 'normal',
        fillStyle: '#FFFFFF',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        shadowColor: 'rgba(0, 0, 0, 0.5)',
        shadowBlur: 5,
        shadowOffsetX: 1,
        shadowOffsetY: 1,
    },
    {
        id: 'comic',
        name: 'Comic',
        fontFamily: 'Comic Sans MS, cursive, sans-serif',
        fontWeight: 'bold',
        fillStyle: '#FFFF00', // Yellow
        backgroundColor: undefined,
        shadowColor: 'rgba(0, 0, 0, 1)',
        shadowBlur: 0,
        shadowOffsetX: 3,
        shadowOffsetY: 3,
    },
    {
        id: 'custom',
        name: 'Custom',
        fontFamily: 'Roboto, sans-serif',
        fontWeight: '700',
        fillStyle: '#ffffff',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        shadowColor: 'rgba(0, 0, 0, 0.7)',
        shadowBlur: 10,
        shadowOffsetX: 2,
        shadowOffsetY: 2,
        stroke: {
            color: '#000000',
            width: 0,
        }
    }
];
