import React, { useState } from 'react';
import { voices } from '../utils/voices';
import { generateVoiceSample } from '../services/geminiService';
import { decode, decodeAudioData } from '../utils/audioUtils';

interface VoiceSelectorProps {
  selectedVoice: string;
  onSelectVoice: (voiceId: string) => void;
  name: string;
}

const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

const VoiceSelector: React.FC<VoiceSelectorProps> = ({ selectedVoice, onSelectVoice, name }) => {
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [loadingVoice, setLoadingVoice] = useState<string | null>(null);

  const handlePlaySample = async (e: React.MouseEvent, voiceId: string) => {
    e.stopPropagation(); // Prevent the radio button from being selected
    if (loadingVoice || playingVoice) return;

    setLoadingVoice(voiceId);
    try {
      const base64Audio = await generateVoiceSample(voiceId);
      const audioData = decode(base64Audio);
      const audioBuffer = await decodeAudioData(audioData, audioContext, 24000, 1);
      
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();
      setPlayingVoice(voiceId);
      source.onended = () => {
        setPlayingVoice(null);
      };

    } catch (error) {
      console.error("Failed to play voice sample:", error);
      // You might want to show an error to the user here
    } finally {
        setLoadingVoice(null);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-600 rounded-lg p-2 space-y-1">
      {voices.map(voice => (
        <div
          key={voice.id}
          onClick={() => onSelectVoice(voice.id)}
          className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${selectedVoice === voice.id ? 'bg-sky-800/50' : 'hover:bg-gray-800'}`}
        >
          <div className="flex items-center">
            <input
              type="radio"
              id={`voice-${voice.id}-${name}`}
              name={name}
              value={voice.id}
              checked={selectedVoice === voice.id}
              onChange={() => onSelectVoice(voice.id)}
              className="h-4 w-4 text-sky-600 bg-gray-700 border-gray-500 focus:ring-sky-500"
            />
            <label htmlFor={`voice-${voice.id}-${name}`} className="ml-3 block text-sm font-medium text-gray-300">
              {voice.name}
            </label>
          </div>
          <button
            onClick={(e) => handlePlaySample(e, voice.id)}
            disabled={!!loadingVoice || !!playingVoice}
            className="text-gray-400 hover:text-sky-400 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
            aria-label={`Play sample for ${voice.name}`}
          >
            {loadingVoice === voice.id ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : playingVoice === voice.id ? (
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-sky-400">
                    <path d="M4.5 9.75a.75.75 0 01.75-.75h13.5a.75.75 0 010 1.5H5.25a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                    <path d="M4.5 14.25a.75.75 0 01.75-.75h13.5a.75.75 0 010 1.5H5.25a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.647c1.295.742 1.295 2.545 0 3.286L7.279 20.99c-1.25.717-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                </svg>
            )}
          </button>
        </div>
      ))}
    </div>
  );
};

export default VoiceSelector;