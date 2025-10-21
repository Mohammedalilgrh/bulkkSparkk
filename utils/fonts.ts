export interface Font {
    name: string;
    value: string;
}

export interface FontCategory {
    name: string;
    fonts: Font[];
}

export const fontCategories: FontCategory[] = [
    {
        name: 'Sans-Serif',
        fonts: [
            { name: 'Roboto', value: 'Roboto, sans-serif' },
            { name: 'Open Sans', value: '"Open Sans", sans-serif' },
            { name: 'Lato', value: 'Lato, sans-serif' },
            { name: 'Montserrat', value: 'Montserrat, sans-serif' },
            { name: 'Arial', value: 'Arial, sans-serif' },
            { name: 'Helvetica Neue', value: '"Helvetica Neue", sans-serif' },
        ],
    },
    {
        name: 'Serif',
        fonts: [
            { name: 'Merriweather', value: 'Merriweather, serif' },
            { name: 'Playfair Display', value: '"Playfair Display", serif' },
            { name: 'Lora', value: 'Lora, serif' },
            { name: 'Georgia', value: 'Georgia, serif' },
            { name: 'Times New Roman', value: '"Times New Roman", serif' },
        ],
    },
    {
        name: 'Handwriting',
        fonts: [
            { name: 'Dancing Script', value: '"Dancing Script", cursive' },
            { name: 'Pacifico', value: 'Pacifico, cursive' },
            { name: 'Caveat', value: 'Caveat, cursive' },
            { name: 'Kalam', value: 'Kalam, cursive' },
        ],
    },
    {
        name: 'Display & Monospace',
        fonts: [
            { name: 'Impact', value: 'Impact, sans-serif' },
            { name: 'Courier New', value: '"Courier New", monospace' },
            { name: 'Comic Sans MS', value: '"Comic Sans MS", cursive, sans-serif' },
            { name: 'Oswald', value: 'Oswald, sans-serif' },
        ],
    },
];
