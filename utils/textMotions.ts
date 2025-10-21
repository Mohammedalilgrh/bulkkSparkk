import { TextMotion } from "../types";

export interface TextMotionStyle {
    id: TextMotion;
    name: string;
}

export const textMotions: TextMotionStyle[] = [
    {
        id: 'none',
        name: 'None',
    },
    {
        id: 'pan-up',
        name: 'Subtle Pan Up',
    },
    {
        id: 'pan-down',
        name: 'Subtle Pan Down',
    },
     {
        id: 'drift-left',
        name: 'Slow Drift Left',
    },
    {
        id: 'drift-right',
        name: 'Slow Drift Right',
    },
    {
        id: 'zoom-in',
        name: 'Gentle Zoom',
    },
];
