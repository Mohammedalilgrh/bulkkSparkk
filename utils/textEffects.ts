export interface TextEffectStyle {
    id: string;
    name: string;
}

export const textEffects: TextEffectStyle[] = [
    {
        id: 'none',
        name: 'None',
    },
    {
        id: 'glow',
        name: 'Glow',
    },
    {
        id: 'outline',
        name: 'Outline',
    },
];
