import { GoogleGenAI, Type, Modality } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

interface GeminiQuoteResponse {
  quotes: { title: string, body: string }[];
}

interface GeminiDialogueResponse {
  dialogues: string[];
}

interface GeminiCustomResponse {
    results: string[];
}

interface GeminiBulkContentResponse {
  scripts: {
    title: string;
    body: string;
  }[];
}

export const generateBulkContent = async (prompt: string, count: number): Promise<{ title: string; body: string }[]> => {
  try {
    const fullPrompt = `Generate ${count} unique items based on the topic: "${prompt}". Each item should have a short, catchy title and a longer, motivational body text (about 2-3 sentences).`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scripts: {
              type: Type.ARRAY,
              description: `An array of ${count} script items.`,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: {
                    type: Type.STRING,
                    description: "A short, catchy title."
                  },
                  body: {
                    type: Type.STRING,
                    description: "The main motivational text, about 2-3 sentences long."
                  }
                },
                required: ['title', 'body'],
              }
            }
          },
          required: ['scripts'],
        }
      }
    });

    const jsonString = response.text.trim();
    const parsedResponse: GeminiBulkContentResponse = JSON.parse(jsonString);

    if (parsedResponse.scripts && Array.isArray(parsedResponse.scripts)) {
      return parsedResponse.scripts;
    } else {
      throw new Error("Invalid response format from API for bulk content.");
    }

  } catch (error) {
    console.error("Error generating bulk content:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate bulk content: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating bulk content.");
  }
};

export const generateQuotes = async (topic: string, count: number, style: 'quote' | 'story', length: number, language: string, dialect: string): Promise<{title: string, body: string}[]> => {
  try {
    const contentType = style === 'quote' ? 'quotes' : 'stories';
    const prompt = `Generate ${count} unique, short, and powerful motivational ${contentType} about "${topic}". For each item, provide a short, catchy title (2-4 words) and a body of approximately ${length} sentences. The language must be strictly ${language} with an ${dialect} dialect.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            quotes: {
              type: Type.ARRAY,
              description: `An array of ${count} motivational ${contentType}.`,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: {
                    type: Type.STRING,
                    description: "A short, catchy title (2-4 words)."
                  },
                  body: {
                    type: Type.STRING,
                    description: `The main motivational ${style}, approximately ${length} sentences long.`
                  }
                },
                required: ['title', 'body'],
              }
            }
          },
          required: ['quotes'],
        }
      }
    });

    const jsonString = response.text.trim();
    const parsedResponse: GeminiQuoteResponse = JSON.parse(jsonString);

    if (parsedResponse.quotes && Array.isArray(parsedResponse.quotes)) {
      return parsedResponse.quotes;
    } else {
      throw new Error("Invalid response format from API.");
    }

  } catch (error) {
    console.error("Error generating content:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate content: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating content.");
  }
};

export const generateDialogues = async (topic: string, count: number, length: number, language: string, dialect: string): Promise<string[]> => {
    try {
        const prompt = `Generate ${count} unique, short dialogues about "${topic}". For each dialogue, invent two distinct character names and use them consistently instead of "Speaker A" and "Speaker B". Each dialogue should have about ${length} total turns. The language must be strictly ${language} with an ${dialect} dialect. Format EACH dialogue STRICTLY as a single string with newlines, like this: "[Character Name 1]: [line]\\n[Character Name 2]: [line]..."`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        dialogues: {
                            type: Type.ARRAY,
                            description: `An array of ${count} dialogue strings.`,
                            items: {
                                type: Type.STRING,
                                description: 'A single dialogue script string between two characters with unique names.'
                            }
                        }
                    },
                    required: ['dialogues'],
                }
            }
        });

        const jsonString = response.text.trim();
        const parsedResponse: GeminiDialogueResponse = JSON.parse(jsonString);

        if (parsedResponse.dialogues && Array.isArray(parsedResponse.dialogues)) {
            return parsedResponse.dialogues;
        } else {
            throw new Error("Invalid response format from API for dialogues.");
        }

    } catch (error) {
        console.error("Error generating dialogues:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate dialogues: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating dialogues.");
    }
};

export const generateCustomContent = async (userPrompt: string, count: number, language: string, dialect: string): Promise<string[]> => {
    try {
        const prompt = `Based on the following request, generate ${count} unique text outputs: "${userPrompt}". The language must be strictly ${language} with an ${dialect} dialect.`;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        results: {
                            type: Type.ARRAY,
                            description: `An array of ${count} text outputs based on the user's prompt.`,
                            items: {
                                type: Type.STRING,
                            }
                        }
                    },
                    required: ['results'],
                }
            }
        });
        const jsonString = response.text.trim();
        const parsedResponse: GeminiCustomResponse = JSON.parse(jsonString);
        if (parsedResponse.results && Array.isArray(parsedResponse.results)) {
            return parsedResponse.results;
        } else {
            throw new Error("Invalid response format from API for custom content.");
        }
    } catch (error) {
        console.error("Error generating custom content:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate custom content: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating custom content.");
    }
};

export const generateToneScript = async (text: string, tone: string, isDialogue: boolean): Promise<string> => {
  try {
    const prompt = isDialogue 
      ? `You are a voice director. Write a short, single-paragraph performance direction for a dialogue. The desired overall tone is "${tone}". Your direction should guide the voice actors on pacing, emotion, and delivery to make the dialogue sound natural and engaging. Do not include the dialogue text itself, only the direction. Then, on a new line, write the full dialogue text which is: \n\n${text}`
      : `You are a voice director. Write a short, single-paragraph performance direction for a voice actor. The desired tone is "${tone}". Your direction should guide the actor on pacing, emotion, and delivery to make the speech sound natural and human-like. Do not include the text of the speech itself, only the direction. Then, on a new line, add the line to be spoken, formatted exactly as: Say: ${text}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    
    return response.text.trim();

  } catch (error) {
    console.error("Error generating tone script, falling back to simple prompt.", error);
    return isDialogue ? text : `Using a ${tone} tone, say: "${text}"`;
  }
};

export const generateCustomToneScript = async (prompt: string): Promise<string> => {
    try {
        const fullPrompt = `You are an expert voice director. A user wants a specific tone for a voiceover, which they describe as: "${prompt}". 
        
        Based on this, write a detailed, single-paragraph performance direction script for a voice actor. This direction should guide the actor on pacing, emotion, and delivery to make the speech sound natural and compelling. 
        
        The output should ONLY be the direction script itself. Do not add any introductory phrases like "Here is the performance direction:" or include placeholders for the actual text. Just the script.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro", // Using a more powerful model for creative tasks
            contents: fullPrompt,
        });

        return response.text.trim();

    } catch (error) {
        console.error("Error generating custom tone script:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate custom tone script: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating the custom tone script.");
    }
};


export const generateSpeech = async (
    text: string, 
    voice: string, 
    toneGuidance: string,
    dialogueConfig?: { speakerAVoice: string, speakerBVoice: string }
): Promise<string> => {
    try {
        const isDialogue = !!dialogueConfig;
        
        const ttsPrompt = await generateToneScript(text, toneGuidance, isDialogue);

        const speechConfig: any = {};
        if (isDialogue) {
            const lines = text.trim().split('\n').filter(line => line.includes(':'));
            const speakers = [...new Set(lines.map(line => line.split(':')[0].trim()))];
            
            const speaker1 = speakers[0] || 'Speaker A';
            const speaker2 = speakers[1] || 'Speaker B';

            speechConfig.multiSpeakerVoiceConfig = {
                speakerVoiceConfigs: [
                    { speaker: speaker1, voiceConfig: { prebuiltVoiceConfig: { voiceName: dialogueConfig.speakerAVoice }}},
                    { speaker: speaker2, voiceConfig: { prebuiltVoiceConfig: { voiceName: dialogueConfig.speakerBVoice }}}
                ]
            };
        } else {
            speechConfig.voiceConfig = {
                prebuiltVoiceConfig: { voiceName: voice },
            };
        }

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: ttsPrompt }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: speechConfig,
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error("No audio data returned from TTS API.");
        }
        return base64Audio;
    } catch (error) {
        console.error("Error generating speech:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate speech: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating speech.");
    }
};


export const generateVoiceSample = async (voice: string): Promise<string> => {
    try {
        const text = "Hello, you can use my voice to convey your message.";
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voice },
                    },
                },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error("No audio data returned from TTS API for voice sample.");
        }
        return base64Audio;
    } catch (error) {
        console.error(`Error generating voice sample for ${voice}:`, error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate voice sample: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating voice sample.");
    }
}