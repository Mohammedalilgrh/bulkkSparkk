
import React, { useState, useRef, useEffect } from 'react';
import { generateQuotes, generateDialogues, generateSpeech, generateCustomContent, generateCustomToneScript } from './services/geminiService';
import { createVideo } from './services/videoService';
import { GeneratedVideo, BulkItem, Position, TextEffect } from './types';
import { voices } from './utils/voices';
import { captionStyles, CaptionStyle } from './utils/captionStyles';
import { textAnimationStyles } from './utils/textAnimations';
import { textEffects } from './utils/textEffects';
import { languages } from './utils/languages';
import VideoCard from './components/VideoCard';
import QuoteCard from './components/QuoteCard';
import VoiceSelector from './components/VoiceSelector';
import CaptionPreview from './components/CaptionPreview';
import BulkEditView from './components/BulkEditView';
import PlacementSelector from './components/PlacementSelector';
import CustomStyleEditor from './components/CustomStyleEditor';
import AnimationPreview from './components/AnimationPreview';
import { UploadIcon, SparklesIcon, LoaderIcon, DownloadIcon, MusicIcon, StopIcon, XCircleIcon } from './components/IconComponents';

declare global {
  interface Window {
    JSZip: any;
  }
}

type AppMode = 'quote' | 'bulk';
type MediaMode = 'loop' | 'multi-image';
type ContentStyle = 'quote' | 'story' | 'dialogue' | 'custom';
type SpeechTone = 'inspiring' | 'energetic' | 'calm' | 'dramatic' | 'authoritative' | 'custom';

const speechTones: { id: SpeechTone, name: string }[] = [
    { id: 'inspiring', name: 'Inspirational' },
    { id: 'energetic', name: 'Energetic' },
    { id: 'calm', name: 'Calm' },
    { id: 'dramatic', name: 'Dramatic' },
    { id: 'authoritative', name: 'Authoritative' },
    { id: 'custom', name: 'Custom' },
];

const mediaModes: { id: MediaMode, name: string, description: string }[] = [
    { id: 'loop', name: 'Loop Single Media', description: 'Use one video/image for all generated clips. Video will loop if shorter than the audio.' },
    { id: 'multi-image', name: 'Use Multiple Images', description: 'Upload multiple images. One video will be generated for each image.' },
];

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('quote');
  
  // Shared state
  const [mediaMode, setMediaMode] = useState<MediaMode>('loop');
  const [backgroundMediaFile, setBackgroundMediaFile] = useState<File | null>(null);
  const [backgroundMediaFiles, setBackgroundMediaFiles] = useState<File[]>([]);
  const [backgroundMediaUrl, setBackgroundMediaUrl] = useState<string>('');
  const [backgroundMediaUrls, setBackgroundMediaUrls] = useState<string[]>([]);

  const [selectedCaptionStyle, setSelectedCaptionStyle] = useState<string>(captionStyles[0].id);
  const [customCaptionStyle, setCustomCaptionStyle] = useState<CaptionStyle>(captionStyles.find(s => s.id === 'custom')!);
  const [selectedTextAnimationStyle, setSelectedTextAnimationStyle] = useState<string>(textAnimationStyles[0].id);
  const [selectedTextEffect, setSelectedTextEffect] = useState<TextEffect>('none');
  const [isTitleEnabled, setIsTitleEnabled] = useState<boolean>(true);
  const [titlePosition, setTitlePosition] = useState<Position>('top-center');
  const [bodyPosition, setBodyPosition] = useState<Position>('middle-center');
  const [videoDuration, setVideoDuration] = useState<number>(10);
  
  // Quote mode state
  const [topic, setTopic] = useState<string>('success');
  const [videoCount, setVideoCount] = useState<number>(3);
  const [contentStyle, setContentStyle] = useState<ContentStyle>('quote');
  const [contentLength, setContentLength] = useState<number>(2);
  const [customPrompt, setCustomPrompt] = useState<string>('A short, powerful motivational quote about overcoming fear.');

  // Language State
  const [selectedLanguage, setSelectedLanguage] = useState<string>(languages[0].id);
  const [selectedDialect, setSelectedDialect] = useState<string>(languages[0].dialects[0].id);

  // Voice & Speech State
  const [selectedVoice, setSelectedVoice] = useState<string>(voices[0].id);
  const [speakerAVoice, setSpeakerAVoice] = useState<string>(voices[0].id);
  const [speakerBVoice, setSpeakerBVoice] = useState<string>(voices[1].id);
  const [speechTone, setSpeechTone] = useState<SpeechTone>('inspiring');
  const [customToneGuidance, setCustomToneGuidance] = useState<string>('Speak in an inspiring and motivational tone, with clear and steady pacing. Emphasize key words to create a powerful and uplifting feeling.');
  const [customTonePrompt, setCustomTonePrompt] = useState<string>('a wise old storyteller');
  const [isGeneratingTone, setIsGeneratingTone] = useState<boolean>(false);
  
  // Music State
  const [backgroundMusicFile, setBackgroundMusicFile] = useState<File | null>(null);
  const [musicVolume, setMusicVolume] = useState<number>(20);

  // Bulk mode state
  const [bulkItems, setBulkItems] = useState<BulkItem[]>([{ id: Date.now().toString(), title: '', body: '' }]);

  // Generation process state
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([]);
  const [processingContent, setProcessingContent] = useState<string[]>([]);
  const [processingTimers, setProcessingTimers] = useState<Record<number, number>>({});
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const isCancelledRef = useRef(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const musicFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const currentLanguage = languages.find(lang => lang.id === selectedLanguage);
    if (currentLanguage && currentLanguage.dialects.length > 0) {
      setSelectedDialect(currentLanguage.dialects[0].id);
    }
  }, [selectedLanguage]);

  useEffect(() => {
    if (mediaMode === 'multi-image') {
        setVideoCount(backgroundMediaFiles.length);
    }
  }, [backgroundMediaFiles, mediaMode]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (mediaMode === 'multi-image') {
        const imageFiles = Array.from(files).filter((file: File) => file.type.startsWith('image/'));
        setBackgroundMediaFiles(prev => [...prev, ...imageFiles]);
        const urls = imageFiles.map((file: File) => URL.createObjectURL(file));
        setBackgroundMediaUrls(prev => [...prev, ...urls]);
    } else {
        const file = files[0];
        if (backgroundMediaUrl) {
            URL.revokeObjectURL(backgroundMediaUrl);
        }
        setBackgroundMediaFile(file);
        const url = URL.createObjectURL(file);
        setBackgroundMediaUrl(url);
    }
    setError('');
  };

  const handleRemoveImage = (indexToRemove: number) => {
    URL.revokeObjectURL(backgroundMediaUrls[indexToRemove]);
    setBackgroundMediaFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    setBackgroundMediaUrls(prev => prev.filter((_, index) => index !== indexToRemove));
  };


  const handleMusicFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setBackgroundMusicFile(file);
    }
  };
  
  const validateInputs = () => {
    if (mediaMode === 'multi-image') {
        if (backgroundMediaFiles.length === 0) {
            setError('Please upload at least one background image.');
            return false;
        }
    } else {
        if (!backgroundMediaFile) {
            setError('Please upload a background video or image.');
            return false;
        }
    }
    if (mode === 'quote' && contentStyle === 'dialogue' && speakerAVoice === speakerBVoice) {
      setError('Please select different voices for Speaker A and Speaker B.');
      return false;
    }
    setError('');
    return true;
  }

  const handleGenerateToneScript = async () => {
    if (!customTonePrompt.trim()) {
        setError("Please describe the tone you'd like to generate.");
        return;
    }
    setIsGeneratingTone(true);
    setError('');
    try {
        const script = await generateCustomToneScript(customTonePrompt);
        setCustomToneGuidance(script);
    } catch (err) {
        const message = err instanceof Error ? `Tone generation failed: ${err.message}` : "An unknown error occurred while generating the tone script."
        setError(prev => prev ? `${prev}\n${message}`: message);
    } finally {
        setIsGeneratingTone(false);
    }
  };

  const handleStopGeneration = () => {
    isCancelledRef.current = true;
    setStatusMessage('Stopping generation...');
  };

  const handleGenerate = async () => {
    if (!validateInputs()) return;

    let effectiveVideoCount = mediaMode === 'multi-image' ? backgroundMediaFiles.length : videoCount;

    if (mode === 'quote' && contentStyle !== 'custom' && !topic.trim()) {
      setError('Please enter a topic.');
      return;
    }
     if (mode === 'quote' && contentStyle === 'custom' && !customPrompt.trim()) {
      setError('Please enter a custom prompt.');
      return;
    }
    if (mode === 'quote' && (effectiveVideoCount <= 0 || effectiveVideoCount > 20)) {
        setError('Please generate between 1 and 20 videos.');
        return;
    }
    if (mode === 'bulk' && bulkItems.filter(item => item.title.trim() || item.body.trim()).length === 0) {
        setError('Please add at least one script for bulk generation.');
        return;
    }

    isCancelledRef.current = false;
    setIsGenerating(true);
    setGeneratedVideos([]);
    setProcessingContent([]);
    setProcessingTimers({});
    setError('');

    try {
      let contentToProcess: (string | {title: string, body: string})[] = [];
      const toneGuidance = speechTone === 'custom' ? customToneGuidance : speechTone;

      if (mode === 'quote') {
        setStatusMessage('Generating creative content...');
        const languageName = languages.find(l => l.id === selectedLanguage)?.name || selectedLanguage;
        const dialectName = languages.find(l => l.id === selectedLanguage)?.dialects.find(d => d.id === selectedDialect)?.name || selectedDialect;

        let unprocessedContent: (string[] | {title: string, body: string}[]) = [];
        if (contentStyle === 'dialogue') {
          unprocessedContent = await generateDialogues(topic, effectiveVideoCount, contentLength, languageName, dialectName);
        } else if (contentStyle === 'custom') {
            unprocessedContent = await generateCustomContent(customPrompt, effectiveVideoCount, languageName, dialectName);
        } else {
          unprocessedContent = await generateQuotes(topic, effectiveVideoCount, contentStyle, contentLength, languageName, dialectName);
        }

        contentToProcess = unprocessedContent.map(content => {
            if (typeof content === 'string') return content;
            return { title: content.title, body: content.body };
        });

      } else { // bulk mode
        contentToProcess = bulkItems
          .filter(item => item.title.trim() || item.body.trim())
          .map(item => ({ title: item.title, body: item.body }));
      }
      
      let sources: { content: (string | {title: string, body: string}); media: File }[] = [];
      if (mediaMode === 'multi-image') {
          sources = contentToProcess.slice(0, backgroundMediaFiles.length).map((content, index) => ({
              content,
              media: backgroundMediaFiles[index],
          }));
      } else { // loop mode
          sources = contentToProcess.map(content => ({
              content,
              media: backgroundMediaFile!,
          }));
      }


      setProcessingContent(sources.map(s => {
          if (typeof s.content === 'string') return s.content;
          return s.content.title ? `${s.content.title}\n${s.content.body}` : s.content.body;
      }));

      // Performance Improvement: Decode music once before the loop
      let musicBuffer: AudioBuffer | null = null;
      if (backgroundMusicFile) {
        setStatusMessage('Processing background music...');
        const tempAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        try {
            const musicArrayBuffer = await backgroundMusicFile.arrayBuffer();
            musicBuffer = await tempAudioContext.decodeAudioData(musicArrayBuffer);
        } catch (e) {
            console.error("Failed to decode music file, proceeding without it.", e);
            setError("Could not process the background music file. Please try a different file.");
        } finally {
            await tempAudioContext.close();
        }
      }

      const CONCURRENCY_LIMIT = 3;
      let completedCount = 0;
      const totalVideos = sources.length;
      const queue = [...sources.entries()];

      const styleToUse = selectedCaptionStyle === 'custom' 
          ? customCaptionStyle 
          : captionStyles.find(s => s.id === selectedCaptionStyle)!;

      const processQueue = async () => {
        while(queue.length > 0 && !isCancelledRef.current) {
            const [index, { content: contentPayload, media: mediaFile }] = queue.shift()!;
            
            setProcessingTimers(prev => ({ ...prev, [index]: Date.now() }));
            
            const textForSpeech = typeof contentPayload === 'string' ? contentPayload : contentPayload.body;
            
            const contentForDisplay = {
                title: isTitleEnabled && typeof contentPayload === 'object' ? contentPayload.title : '',
                body: typeof contentPayload === 'string' ? contentPayload : contentPayload.body
            };
            const quoteForCard = [contentForDisplay.title, contentForDisplay.body].filter(Boolean).join('\n');

            try {
                if (isCancelledRef.current) return;
                const id = new Date().getTime().toString() + index;
                const dialogueConfig = (mode === 'quote' && contentStyle === 'dialogue') 
                    ? { speakerAVoice, speakerBVoice } 
                    : undefined;
                
                const speechAudio = await generateSpeech(textForSpeech, selectedVoice, toneGuidance, dialogueConfig);
                
                if (isCancelledRef.current) return;
                const videoBlob = await createVideo(mediaFile, contentForDisplay, speechAudio, styleToUse, videoDuration, musicBuffer, musicVolume / 100, selectedTextAnimationStyle, titlePosition, bodyPosition, selectedTextEffect);
                const videoUrl = URL.createObjectURL(videoBlob);
                
                const newVideo = { id, quote: quoteForCard, videoUrl, videoBlob };
                
                if (!isCancelledRef.current) {
                    setGeneratedVideos(prev => [...prev, newVideo]);
                }

            } catch (err) {
                if (isCancelledRef.current) return;
                console.error(`Error processing video #${index + 1}`, err);
                const message = err instanceof Error ? `Error on video ${index + 1}: ${err.message}` : `An unknown error occurred on video ${index + 1}.`
                setError(prev => prev ? `${prev}\n${message}`: message);
            } finally {
                completedCount++;
                if (!isCancelledRef.current) {
                  setStatusMessage(`Processing... ${completedCount}/${totalVideos} complete.`);
                }
            }
        }
      };

      setStatusMessage(`Starting generation for ${totalVideos} videos...`);
      const workerPromises = Array(Math.min(CONCURRENCY_LIMIT, totalVideos)).fill(null).map(processQueue);
      await Promise.all(workerPromises);

    } catch (err) {
      if (!isCancelledRef.current) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      }
    } finally {
      setIsGenerating(false);
      if (isCancelledRef.current) {
        setStatusMessage('Generation stopped by user.');
      } else {
        setStatusMessage(generatedVideos.length > 0 ? 'Generation complete!' : 'Generation finished.');
      }
    }
  };
  
  const handleDownloadAll = async () => {
    if (generatedVideos.length === 0) return;
    const zip = new window.JSZip();
    generatedVideos.forEach((video, index) => {
      zip.file(`video_${index + 1}.webm`, video.videoBlob);
    });

    setStatusMessage('Zipping files...');
    zip.generateAsync({ type: 'blob' }).then(function (content: Blob) {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `motivational_videos_${topic || 'bulk'}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setStatusMessage('');
    });
  };

  const renderQuoteGeneratorForm = () => {
      const currentLanguage = languages.find(lang => lang.id === selectedLanguage);
      const dialectOptions = currentLanguage?.dialects || [];
      const isMultiImage = mediaMode === 'multi-image';
      
      return (
    <>
      {contentStyle !== 'custom' && (
        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-gray-300 mb-2">Topic</label>
          <input type="text" name="topic" id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} className="bg-gray-900 border border-gray-600 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5" placeholder="e.g., perseverance, innovation" />
        </div>
      )}
       <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="language" className="block text-sm font-medium text-gray-300 mb-2">Language</label>
            <select id="language" value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} className="bg-gray-900 border border-gray-600 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5">
              {languages.map(lang => <option key={lang.id} value={lang.id}>{lang.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="dialect" className="block text-sm font-medium text-gray-300 mb-2">Accent / Dialect</label>
            <select 
              id="dialect" 
              value={selectedDialect} 
              onChange={(e) => setSelectedDialect(e.target.value)} 
              className="bg-gray-900 border border-gray-600 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5 disabled:bg-gray-700 disabled:cursor-not-allowed"
              disabled={dialectOptions.length <= 1}
            >
              {dialectOptions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="content-style" className="block text-sm font-medium text-gray-300 mb-2">Content Style</label>
          <select id="content-style" value={contentStyle} onChange={(e) => setContentStyle(e.target.value as ContentStyle)} className="bg-gray-900 border border-gray-600 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5">
            <option value="quote">Motivational Quote</option>
            <option value="story">Short Story</option>
            <option value="dialogue">Dialogue</option>
            <option value="custom">Custom Prompt</option>
          </select>
        </div>
        <div>
            <label htmlFor="video-count" className="block text-sm font-medium text-gray-300 mb-2">
                {isMultiImage ? 'Videos (from images)' : '# of Videos'}
            </label>
            <input 
                type="number" 
                name="video-count" 
                id="video-count" 
                value={videoCount} 
                onChange={(e) => setVideoCount(parseInt(e.target.value))} 
                min="1" 
                max="20" 
                className="bg-gray-900 border border-gray-600 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5 disabled:bg-gray-700 disabled:text-gray-400" 
                disabled={isMultiImage}
            />
        </div>
      </div>
      {contentStyle === 'custom' && (
        <div>
            <label htmlFor="custom-prompt" className="block text-sm font-medium text-gray-300 mb-2">Custom Prompt</label>
            <textarea
                id="custom-prompt"
                rows={4}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="bg-gray-900 border border-gray-600 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5"
                placeholder="e.g., Generate a short, funny story about a robot who discovers coffee."
            />
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
            <label htmlFor="content-length" className="block text-sm font-medium text-gray-300 mb-2">
                {contentStyle === 'dialogue' ? 'Dialogue Length (turns)' : 'Content Length (sentences)'}
            </label>
            <input type="number" name="content-length" id="content-length" value={contentLength} onChange={(e) => setContentLength(parseInt(e.target.value))} min="1" max="20" className="bg-gray-900 border border-gray-600 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5" />
        </div>
        <div>
          <label htmlFor="video-duration" className="block text-sm font-medium text-gray-300 mb-2">
            Min Duration (s)
          </label>
          <input type="number" name="video-duration" id="video-duration" value={videoDuration} onChange={(e) => setVideoDuration(parseInt(e.target.value))} min="1" max="60" className="bg-gray-900 border border-gray-600 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
            <label htmlFor="caption-style" className="block text-sm font-medium text-gray-300 mb-2">Caption Style</label>
            <select id="caption-style" value={selectedCaptionStyle} onChange={(e) => setSelectedCaptionStyle(e.target.value)} className="bg-gray-900 border border-gray-600 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5">
              {captionStyles.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <CaptionPreview 
                styleId={selectedCaptionStyle}
                customStyle={selectedCaptionStyle === 'custom' ? customCaptionStyle : undefined}
                textEffect={selectedTextEffect}
            />
        </div>
        <div className="space-y-4">
          <div>
            <label htmlFor="text-animation" className="block text-sm font-medium text-gray-300 mb-2">Text Animation</label>
            <select id="text-animation" value={selectedTextAnimationStyle} onChange={(e) => setSelectedTextAnimationStyle(e.target.value)} className="bg-gray-900 border border-gray-600 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5">
                {textAnimationStyles.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
           <AnimationPreview animationStyleId={selectedTextAnimationStyle} />
           <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Text Effect</label>
              <div className="flex items-center space-x-2 bg-gray-900 border border-gray-600 rounded-lg p-1">
                  {textEffects.map(effect => (
                      <button 
                          key={effect.id}
                          onClick={() => setSelectedTextEffect(effect.id as TextEffect)}
                          className={`w-full text-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${selectedTextEffect === effect.id ? 'bg-sky-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                      >
                          {effect.name}
                      </button>
                  ))}
              </div>
          </div>
        </div>
      </div>
      {selectedCaptionStyle === 'custom' && (
        <div className="mt-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
            <h4 className="text-base font-medium text-gray-200 mb-3">Custom Style Editor</h4>
            <CustomStyleEditor style={customCaptionStyle} onChange={setCustomCaptionStyle} />
        </div>
      )}
       <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Use Title?</label>
                <div className="flex items-center space-x-2 bg-gray-900 border border-gray-600 rounded-lg p-1">
                    <button onClick={() => setIsTitleEnabled(true)} className={`w-full text-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${isTitleEnabled ? 'bg-sky-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                        Yes
                    </button>
                    <button onClick={() => setIsTitleEnabled(false)} className={`w-full text-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${!isTitleEnabled ? 'bg-red-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                        No
                    </button>
                </div>
            </div>
            <PlacementSelector 
                isTitleEnabled={isTitleEnabled}
                titlePosition={titlePosition}
                onTitlePositionChange={setTitlePosition}
                bodyPosition={bodyPosition}
                onBodyPositionChange={setBodyPosition}
            />
        </div>
    </>
    );
  };
  
  const renderSharedSettings = (isBulk: boolean) => (
      <>
        {contentStyle === 'dialogue' && mode === 'quote' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Speaker A</label>
                    <VoiceSelector selectedVoice={speakerAVoice} onSelectVoice={setSpeakerAVoice} name="speaker-a-voice" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Speaker B</label>
                    <VoiceSelector selectedVoice={speakerBVoice} onSelectVoice={setSpeakerBVoice} name="speaker-b-voice" />
                </div>
            </div>
        ) : (
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{isBulk ? 'Shared Voice' : 'Voice'}</label>
                <VoiceSelector selectedVoice={selectedVoice} onSelectVoice={setSelectedVoice} name="single-voice" />
            </div>
        )}

        <div>
            <label htmlFor="speech-tone" className="block text-sm font-medium text-gray-300 mb-2">Speech Tone</label>
            <select id="speech-tone" value={speechTone} onChange={(e) => setSpeechTone(e.target.value as SpeechTone)} className="bg-gray-900 border border-gray-600 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5">
                {speechTones.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {speechTone === 'custom' && (
                <div className="mt-2 space-y-3 bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                    <div>
                        <label htmlFor="tone-prompt" className="block text-xs font-medium text-gray-400 mb-1">Describe desired tone</label>
                        <div className="flex items-center space-x-2">
                           <input 
                                type="text" 
                                id="tone-prompt"
                                value={customTonePrompt}
                                onChange={e => setCustomTonePrompt(e.target.value)}
                                className="bg-gray-800 border border-gray-600 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2" 
                                placeholder="e.g., a wise old storyteller"
                           />
                           <button 
                             onClick={handleGenerateToneScript}
                             disabled={isGeneratingTone}
                             className="px-3 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-gray-500 disabled:cursor-not-allowed flex-shrink-0"
                           >
                            {isGeneratingTone ? <LoaderIcon className="h-5 w-5 animate-spin"/> : <SparklesIcon className="h-5 w-5" />}
                           </button>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="tone-guidance" className="block text-xs font-medium text-gray-400 mb-1">Generated Performance Script (Editable)</label>
                        <textarea id="tone-guidance" rows={4} value={customToneGuidance} onChange={(e) => setCustomToneGuidance(e.target.value)} className="bg-gray-800 border border-gray-600 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5" placeholder="e.g., calm and reassuring, energetic and bold"></textarea>
                    </div>
                </div>
            )}
        </div>

        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
            <h4 className="text-base font-medium text-gray-200 mb-3">Audio Settings</h4>
            <div className="space-y-4">
                <div>
                    <label htmlFor="music-upload" className="block text-sm font-medium text-gray-300 mb-2">Background Music</label>
                    {backgroundMusicFile ? (
                        <div className="flex items-center justify-between bg-gray-800 p-2 rounded-md border border-gray-600">
                            <div className="flex items-center min-w-0">
                                <MusicIcon className="h-5 w-5 text-sky-400 flex-shrink-0" />
                                <p className="text-sm text-gray-300 truncate ml-2">{backgroundMusicFile.name}</p>
                            </div>
                            <button 
                                onClick={() => setBackgroundMusicFile(null)} 
                                className="text-gray-500 hover:text-red-400 ml-2 p-1 rounded-full hover:bg-gray-700"
                                aria-label="Remove music file"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <div 
                          className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md cursor-pointer hover:border-sky-500 transition-colors"
                          onClick={() => musicFileInputRef.current?.click()}
                        >
                          <div className="space-y-1 text-center">
                            <MusicIcon className="mx-auto h-10 w-10 text-gray-500" />
                             <div className="flex text-sm text-gray-400">
                               <p className="pl-1">Click to upload audio</p>
                            </div>
                             <p className="text-xs text-gray-500">MP3, WAV, etc. up to 10MB</p>
                          </div>
                          <input ref={musicFileInputRef} id="music-upload" name="music-upload" type="file" className="sr-only" accept="audio/*" onChange={handleMusicFileChange} />
                        </div>
                    )}
                </div>
                {backgroundMusicFile && (
                    <div>
                        <label htmlFor="music-volume" className="flex items-center justify-between text-sm font-medium text-gray-300 mb-1">
                            <span>Music Volume</span>
                            <span className="text-sky-400 font-mono">{musicVolume}%</span>
                        </label>
                        <input id="music-volume" type="range" min="0" max="100" value={musicVolume} onChange={(e) => setMusicVolume(parseInt(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg" />
                    </div>
                )}
            </div>
        </div>

        <div className="flex flex-col items-center justify-center bg-gray-900/50 rounded-lg p-6 text-center">
            <div className="w-full flex items-center space-x-4">
                <button 
                    onClick={handleGenerate} 
                    disabled={isGenerating} 
                    className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105" aria-live="polite"
                >
                    <SparklesIcon className="-ml-1 mr-3 h-5 w-5" />Generate Videos
                </button>
                {isGenerating && (
                    <button 
                        onClick={handleStopGeneration} 
                        className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                    >
                       <StopIcon className="-ml-1 mr-3 h-5 w-5" /> Stop
                    </button>
                )}
            </div>
            {isGenerating && <p className="mt-4 text-sm text-gray-400">{statusMessage}</p>}
            {error && <p className="mt-4 text-sm text-red-400 whitespace-pre-wrap">{error}</p>}
            {!isGenerating && generatedVideos.length > 0 && (
                <button onClick={handleDownloadAll} className="mt-4 w-full inline-flex items-center justify-center px-6 py-3 border border-gray-600 text-base font-medium rounded-md shadow-sm text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors">
                    <DownloadIcon className="-ml-1 mr-3 h-5 w-5" />Download All (.zip)
                </button>
            )}
        </div>
      </>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <header className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-sky-400 mb-2">
            Motivation Spark
          </h1>
          <p className="text-lg text-gray-400">
            AI-Powered Motivational Video Generator
          </p>
        </header>

        <div className="flex justify-center mb-8">
            <div className="bg-gray-800 rounded-lg p-1 flex space-x-1">
                <button onClick={() => setMode('quote')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${mode === 'quote' ? 'bg-sky-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                    AI Generator
                </button>
                <button onClick={() => setMode('bulk')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${mode === 'bulk' ? 'bg-sky-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                    Bulk Editor
                </button>
            </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 sm:p-8 mb-8 shadow-2xl">
          {mode === 'quote' ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Form Column */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Media Handling</label>
                    <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2 bg-gray-900 border border-gray-600 rounded-lg p-1">
                        {mediaModes.map(m => (
                             <button 
                                key={m.id}
                                onClick={() => setMediaMode(m.id)}
                                className={`w-full text-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${mediaMode === m.id ? 'bg-sky-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                                title={m.description}
                            >
                                {m.name}
                            </button>
                        ))}
                    </div>
                     <p className="text-xs text-gray-500 mt-2 text-center">{mediaModes.find(m => m.id === mediaMode)?.description}</p>
                  </div>
                  <div>
                    <label htmlFor="media-upload" className="block text-sm font-medium text-gray-300 mb-2">Background Media</label>
                    <div 
                      className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md cursor-pointer hover:border-sky-500 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="space-y-1 text-center">
                        <UploadIcon className="mx-auto h-12 w-12 text-gray-500" />
                        <div className="flex text-sm text-gray-400">
                          <p className="pl-1">
                            {mediaMode === 'multi-image' && backgroundMediaFiles.length > 0 && `${backgroundMediaFiles.length} images selected`}
                            {mediaMode !== 'multi-image' && backgroundMediaFile && backgroundMediaFile.name}
                            {!((mediaMode === 'multi-image' && backgroundMediaFiles.length > 0) || (mediaMode !== 'multi-image' && backgroundMediaFile)) && (mediaMode === 'multi-image' ? 'Click to upload images' : 'Click to upload video or image')}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500">
                            {mediaMode === 'loop' && 'Video or Image up to 50MB'}
                            {mediaMode === 'multi-image' && 'Images up to 10MB each'}
                        </p>
                      </div>
                    </div>
                    <input 
                        ref={fileInputRef} 
                        id="media-upload" 
                        name="media-upload" 
                        type="file" 
                        className="sr-only" 
                        accept={mediaMode === 'multi-image' ? 'image/*' : 'video/*,image/*'}
                        multiple={mediaMode === 'multi-image'}
                        onChange={handleFileChange} 
                    />
                    {mediaMode === 'multi-image' && backgroundMediaUrls.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-4 bg-gray-900/50 p-2 rounded-lg">
                            {backgroundMediaUrls.map((url, index) => (
                                <div key={index} className="relative group aspect-square">
                                    <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover rounded-md border-2 border-transparent group-hover:border-sky-500"/>
                                    <button 
                                        onClick={() => handleRemoveImage(index)} 
                                        className="absolute top-0.5 right-0.5 bg-gray-900/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                        aria-label={`Remove image ${index + 1}`}
                                    >
                                        <XCircleIcon className="w-6 h-6"/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    {mediaMode !== 'multi-image' && backgroundMediaUrl && (
                      backgroundMediaFile?.type.startsWith('video/') ? (
                        <video src={backgroundMediaUrl} controls muted className="mt-4 w-full rounded-md max-h-64" />
                      ) : (
                        <img src={backgroundMediaUrl} alt="Background Preview" className="mt-4 w-full rounded-md max-h-64 object-contain" />
                      )
                    )}
                  </div>
                  {renderQuoteGeneratorForm()}
                </div>
                {/* Action & Status Column */}
                <div className="space-y-6">
                    {renderSharedSettings(false)}
                </div>
             </div>
          ) : (
             <BulkEditView 
                items={bulkItems}
                onItemsChange={setBulkItems}
             >
                {/* Children are the shared settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label htmlFor="media-upload-bulk" className="block text-sm font-medium text-gray-300 mb-2">Background Media (shared)</label>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md cursor-pointer hover:border-sky-500 transition-colors" onClick={() => fileInputRef.current?.click()}>
                        <div className="space-y-1 text-center">
                          <UploadIcon className="mx-auto h-12 w-12 text-gray-500" />
                          <p className="text-sm text-gray-400">{backgroundMediaFile ? backgroundMediaFile.name : 'Click to upload a video or image'}</p>
                        </div>
                      </div>
                      <input ref={fileInputRef} id="media-upload-bulk" name="media-upload" type="file" className="sr-only" accept="video/*,image/*" onChange={handleFileChange} />
                       {backgroundMediaUrl && (
                          backgroundMediaFile?.type.startsWith('video/') ? (
                            <video src={backgroundMediaUrl} controls muted className="mt-4 w-full rounded-md max-h-48" />
                          ) : (
                            <img src={backgroundMediaUrl} alt="Background Preview" className="mt-4 w-full rounded-md max-h-48 object-contain" />
                          )
                        )}
                        <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <label htmlFor="video-duration" className="block text-sm font-medium text-gray-300 mb-2">Min Duration (s)</label>
                          <input type="number" name="video-duration" id="video-duration" value={videoDuration} onChange={(e) => setVideoDuration(parseInt(e.target.value))} min="1" max="60" className="bg-gray-900 border border-gray-600 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5" />
                        </div>
                        <div>
                          <label htmlFor="caption-style-bulk" className="block text-sm font-medium text-gray-300 mb-2">Caption Style</label>
                          <select id="caption-style-bulk" value={selectedCaptionStyle} onChange={(e) => setSelectedCaptionStyle(e.target.value)} className="bg-gray-900 border border-gray-600 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5">
                            {captionStyles.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        </div>
                      </div>
                       {selectedCaptionStyle === 'custom' && (
                          <div className="mt-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                              <h4 className="text-base font-medium text-gray-200 mb-3">Custom Style Editor</h4>
                              <CustomStyleEditor style={customCaptionStyle} onChange={setCustomCaptionStyle} />
                          </div>
                        )}
                      <div className="space-y-6 mt-4">
                        <div className="space-y-4">
                            <label htmlFor="text-animation-bulk" className="block text-sm font-medium text-gray-300 mb-2">Text Animation</label>
                            <select id="text-animation-bulk" value={selectedTextAnimationStyle} onChange={(e) => setSelectedTextAnimationStyle(e.target.value)} className="bg-gray-900 border border-gray-600 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5">
                                {textAnimationStyles.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            <AnimationPreview animationStyleId={selectedTextAnimationStyle} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Text Effect</label>
                            <div className="flex items-center space-x-2 bg-gray-900 border border-gray-600 rounded-lg p-1">
                                {textEffects.map(effect => (
                                    <button 
                                        key={effect.id}
                                        onClick={() => setSelectedTextEffect(effect.id as TextEffect)}
                                        className={`w-full text-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${selectedTextEffect === effect.id ? 'bg-sky-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                                    >
                                        {effect.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Use Title?</label>
                                <div className="flex items-center space-x-2 bg-gray-900 border border-gray-600 rounded-lg p-1">
                                    <button onClick={() => setIsTitleEnabled(true)} className={`w-full text-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${isTitleEnabled ? 'bg-sky-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                                        Yes
                                    </button>
                                    <button onClick={() => setIsTitleEnabled(false)} className={`w-full text-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${!isTitleEnabled ? 'bg-red-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                                        No
                                    </button>
                                </div>
                            </div>
                            <PlacementSelector
                                isTitleEnabled={isTitleEnabled}
                                titlePosition={titlePosition}
                                onTitlePositionChange={setTitlePosition}
                                bodyPosition={bodyPosition}
                                onBodyPositionChange={setBodyPosition}
                            />
                        </div>
                        <CaptionPreview 
                            styleId={selectedCaptionStyle}
                            customStyle={selectedCaptionStyle === 'custom' ? customCaptionStyle : undefined}
                            textEffect={selectedTextEffect}
                        />
                      </div>
                    </div>
                    <div className="space-y-6">
                       {renderSharedSettings(true)}
                    </div>
                </div>
             </BulkEditView>
          )}
        </div>

        {/* Results Section */}
        {(isGenerating || generatedVideos.length > 0) && (
          <div className="mt-12">
            <h2 className="text-2xl font-semibold mb-6 text-center">Generated Content</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {isGenerating && processingContent.length > 0 && processingContent.map((quote, index) => (
                 <QuoteCard 
                    key={index} 
                    quote={quote} 
                    isProcessing={!generatedVideos.some(v => v.quote === quote)}
                    startTime={processingTimers[index]}
                 />
              ))}
              {generatedVideos.sort((a,b) => a.id.localeCompare(b.id)).map(video => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;