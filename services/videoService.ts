import { decode, decodeAudioData } from '../utils/audioUtils';
import { CaptionStyle } from '../utils/captionStyles';
import { TextPayload, Position, LineTiming, TextEffect, WordTiming } from '../types';

const AUDIO_CONTEXT = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
const FADE_DURATION = 0.3; // seconds for fade in/out

const PAUSE_BETWEEN_SENTENCES = 0.25; // A more natural pause

const linesCache = new Map<string, string[]>();

function calculateSentenceTimings(text: string, totalDuration: number): LineTiming[] {
    if (!text || totalDuration <= 0) return [];
    // Improved regex to better handle sentences
    const sentences = text.match(/[^.!?\n]+(?:[.!?\n]|$)/g) || [];
    const cleanedSentences = sentences.map(s => s.trim()).filter(Boolean);

    if (cleanedSentences.length === 0) {
        // Handle single block of text without punctuation
        return [{ text, start: 0, end: totalDuration, words: calculateWordTimings(text, 0, totalDuration) }];
    }
    
    const totalPausesDuration = (cleanedSentences.length - 1) * PAUSE_BETWEEN_SENTENCES;
    const speakableDuration = Math.max(0, totalDuration - totalPausesDuration);
    
    const totalLength = cleanedSentences.reduce((sum, s) => sum + s.length, 0);
    if (totalLength === 0) return [];

    let currentTime = 0;
    const timings: LineTiming[] = [];

    for (const sentence of cleanedSentences) {
        const sentenceDuration = speakableDuration > 0 ? (sentence.length / totalLength) * speakableDuration : 0;
        const endTime = currentTime + sentenceDuration;
        timings.push({
            text: sentence,
            start: currentTime,
            end: endTime,
            words: calculateWordTimings(sentence, currentTime, sentenceDuration),
        });
        currentTime = endTime + PAUSE_BETWEEN_SENTENCES;
    }
    
    return timings;
}


function calculateWordTimings(text: string, sentenceStart: number, sentenceDuration: number): WordTiming[] {
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length === 0 || sentenceDuration <= 0) return [];

    // Add a tiny bit of padding at the start and end of the sentence's speech time
    const PADDING_RATIO = 0.05; 
    const padding = sentenceDuration * PADDING_RATIO;
    const effectiveDuration = sentenceDuration - (2 * padding);
    const effectiveStart = sentenceStart + padding;

    const totalChars = words.reduce((sum, word) => sum + word.length, 0);
    if (totalChars === 0) return [];
    
    let currentTime = effectiveStart;
    const timings: WordTiming[] = [];

    for (const word of words) {
        // Give a slight base duration to each word to prevent zero-length timings for short words
        const BASE_WORD_DURATION = 0.05;
        const remainingDuration = effectiveDuration - (words.length * BASE_WORD_DURATION);
        const charBasedDuration = remainingDuration > 0 ? (word.length / totalChars) * remainingDuration : 0;
        const wordDuration = BASE_WORD_DURATION + charBasedDuration;

        timings.push({
            text: word,
            start: currentTime,
            end: currentTime + wordDuration
        });
        currentTime += wordDuration;
    }
    return timings;
}

export const createVideo = async (
  mediaFile: File,
  textPayload: TextPayload,
  speechAudioBase64: string,
  captionStyle: CaptionStyle,
  duration: number,
  musicBuffer: AudioBuffer | null,
  musicVolume: number,
  textAnimationStyle: string,
  titlePosition: Position,
  bodyPosition: Position,
  textEffect: TextEffect
): Promise<Blob> => {
  return new Promise(async (resolve, reject) => {
    try {
      const mediaURL = URL.createObjectURL(mediaFile);
      const isVideo = mediaFile.type.startsWith('video/');

      let mediaElement: HTMLVideoElement | HTMLImageElement;
      let mediaWidth: number;
      let mediaHeight: number;

      if (isVideo) {
        const video = document.createElement('video');
        video.src = mediaURL;
        video.muted = true;
        await new Promise<void>((res, rej) => {
          video.onloadedmetadata = () => {
            mediaWidth = video.videoWidth;
            mediaHeight = video.videoHeight;
            res();
          };
          video.onerror = (e) => rej(new Error('Error loading video file'));
        });
        mediaElement = video;
      } else {
        const img = new Image();
        img.src = mediaURL;
        await new Promise<void>((res, rej) => {
          img.onload = () => {
            mediaWidth = img.width;
            mediaHeight = img.height;
            res();
          };
          img.onerror = (e) => rej(new Error('Error loading image file'));
        });
        mediaElement = img;
      }

      const speechAudioData = decode(speechAudioBase64);
      const speechBuffer = await decodeAudioData(speechAudioData, AUDIO_CONTEXT, 24000, 1);
      const finalDuration = Math.max(duration, speechBuffer.duration + 1.5); // Added more buffer for fades

      const titleText = (typeof textPayload === 'object' && textPayload.title?.trim()) ? textPayload.title.trim() : '';
      const bodyText = (typeof textPayload === 'string' ? textPayload : textPayload.body).trim();
      
      const bodyTimings = calculateSentenceTimings(bodyText, speechBuffer.duration);

      const audioStreamDestination = AUDIO_CONTEXT.createMediaStreamDestination();
      const speechSource = AUDIO_CONTEXT.createBufferSource();
      speechSource.buffer = speechBuffer;
      speechSource.connect(audioStreamDestination);

      let musicSource: AudioBufferSourceNode | null = null;
      if (musicBuffer) {
        musicSource = AUDIO_CONTEXT.createBufferSource();
        musicSource.buffer = musicBuffer;
        musicSource.loop = true;
        const musicGainNode = AUDIO_CONTEXT.createGain();
        musicGainNode.gain.value = musicVolume;
        musicSource.connect(musicGainNode);
        musicGainNode.connect(audioStreamDestination);
      }
      
      const [audioTrack] = audioStreamDestination.stream.getAudioTracks();
      
      const canvas = document.createElement('canvas');
      canvas.width = mediaWidth;
      canvas.height = mediaHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Could not create canvas context'));

      const stream = canvas.captureStream(30);
      stream.addTrack(audioTrack);
      
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9,opus' });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        URL.revokeObjectURL(mediaURL);
        if (speechSource.buffer) speechSource.stop();
        if (musicSource?.buffer) musicSource.stop();
        resolve(blob);
      };
      recorder.onerror = (e) => reject(e);

      recorder.start();
      speechSource.start();
      musicSource?.start();
      
      if (isVideo) {
        (mediaElement as HTMLVideoElement).play().catch(reject);
      }

      let animationFrameId: number;
      let startTime: number | null = null;
      
      const drawFrame = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsedTime = (timestamp - startTime) / 1000;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(mediaElement, 0, 0, canvas.width, canvas.height);

        if (isVideo) {
          const video = mediaElement as HTMLVideoElement;
          if (video.currentTime >= video.duration - 0.1) {
             video.currentTime = 0;
             video.play();
          }
        }
        
        const fullDurationLine = { text: titleText, start: 0.1, end: speechBuffer.duration + 0.1, words: [] };
        if (titleText) {
             drawAnimatedText(ctx, fullDurationLine, elapsedTime, 'fadeInOut', captionStyle, titlePosition, textEffect);
        }

        if (bodyTimings.length > 0) {
            for (const timing of bodyTimings) {
                drawAnimatedText(ctx, timing, elapsedTime, textAnimationStyle, captionStyle, bodyPosition, textEffect);
            }
        }

        // Add a final fade-to-black for a professional finish
        if (elapsedTime > finalDuration - FADE_DURATION) {
            const fadeProgress = (elapsedTime - (finalDuration - FADE_DURATION)) / FADE_DURATION;
            ctx.fillStyle = `rgba(0, 0, 0, ${easeInOutCubic(fadeProgress)})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        if (elapsedTime >= finalDuration) {
          cancelAnimationFrame(animationFrameId);
          if (recorder.state !== 'inactive') recorder.stop();
          if (isVideo) (mediaElement as HTMLVideoElement).pause();
          return;
        }

        animationFrameId = requestAnimationFrame(drawFrame);
      };

      animationFrameId = requestAnimationFrame(drawFrame);

    } catch (error) {
      reject(error);
    }
  });
};

function getLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    if (!text) return [];

    const key = `${ctx.font}:${maxWidth}:${text}`;
    if (linesCache.has(key)) {
        return linesCache.get(key)!;
    }

    // More robust splitting that handles various spaces
    const words = text.split(/(\s+)/);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
        const prospectiveLine = currentLine + word;
        const metrics = ctx.measureText(prospectiveLine);
        
        if (metrics.width > maxWidth && currentLine !== '') {
            lines.push(currentLine.trim());
            currentLine = word;
        } else {
            currentLine = prospectiveLine;
        }
    }
    if(currentLine.trim()) lines.push(currentLine.trim());

    if (linesCache.size > 500) {
      const firstKey = linesCache.keys().next().value;
      linesCache.delete(firstKey);
    }
    linesCache.set(key, lines);

    return lines;
}

function easeInOutCubic(x: number): number {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function drawTextWithBackground(ctx: CanvasRenderingContext2D, line: string, x: number, y: number, style: CaptionStyle, effect: TextEffect, fontSize: number, fillStyleOverride?: string) {
    const currentFillStyle = ctx.fillStyle;
    if (style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
        const textMetrics = ctx.measureText(line);
        const textHeight = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;
        
        let bgX;
        switch(ctx.textAlign) {
            case 'left': bgX = x - (fontSize * 0.2); break;
            case 'right': bgX = x - textMetrics.width - (fontSize * 0.2); break;
            default: bgX = x - (textMetrics.width / 2) - (fontSize * 0.2); break;
        }
        const bgY = y - textHeight / 2 - (fontSize * 0.2);
        const bgWidth = textMetrics.width + (fontSize * 0.4);
        const bgHeight = textHeight + (fontSize * 0.4);

        ctx.fillStyle = style.backgroundColor;
        ctx.fillRect(bgX, bgY, bgWidth, bgHeight);
    }
    
    ctx.save();
    ctx.shadowColor = 'transparent';

    if (style.stroke && style.stroke.width > 0) {
        ctx.strokeStyle = style.stroke.color;
        ctx.lineWidth = style.stroke.width;
        ctx.lineJoin = 'round';
        ctx.strokeText(line, x, y);
    }

    if (effect === 'outline') {
        ctx.strokeStyle = style.shadowColor;
        ctx.lineWidth = fontSize * 0.05; // Refined for a cleaner look
        ctx.lineJoin = 'round';
        ctx.strokeText(line, x, y);
    }
    
    ctx.restore();
    
    ctx.fillStyle = fillStyleOverride || style.fillStyle;
    ctx.fillText(line, x, y);
    ctx.fillStyle = currentFillStyle; // Restore original fill style
}

// --- Animation-Specific Drawing Functions ---

const drawKaraokeAnimation = (ctx: CanvasRenderingContext2D, params: AnimationParameters) => {
    const { lines, words, elapsedTime, start, end, style, textEffect, fontSize, finalX, blockStartY } = params;
    if (!words) return;

    // Add sentence-level fade in/out
    const lineDuration = end - start;
    const timeInAnimation = elapsedTime - start;
    
    let opacity = 0;
    if (timeInAnimation >= 0 && lineDuration > 0) {
        if (timeInAnimation < FADE_DURATION) {
            opacity = easeInOutCubic(timeInAnimation / FADE_DURATION);
        } else if (lineDuration - timeInAnimation < FADE_DURATION) {
            opacity = easeInOutCubic((lineDuration - timeInAnimation) / FADE_DURATION);
        } else {
            opacity = 1;
        }
    }
    
    if (opacity <= 0.01) return;
    
    ctx.save();
    
    // The active fill style should be the main style color.
    // The inactive fill style will be a semi-transparent version.
    const activeFillStyle = style.fillStyle;
    // Simple way to create a dimmer version without a color library
    const inactiveFillStyle = 'rgba(255, 255, 255, 0.5)';


    let wordCounter = 0;
    lines.forEach((line, lineIndex) => {
        const lineY = blockStartY + (lineIndex * fontSize * 1.2) + (fontSize * 0.6);
        const lineMetrics = ctx.measureText(line);
        
        let startX;
        if (ctx.textAlign === 'center') startX = finalX - lineMetrics.width / 2;
        else if (ctx.textAlign === 'right') startX = finalX - lineMetrics.width;
        else startX = finalX;

        // 1. Draw the full inactive line as a base
        ctx.globalAlpha = opacity * 0.7; // Dim the inactive text slightly
        drawTextWithBackground(ctx, line, startX, lineY, style, textEffect, fontSize, style.fillStyle);
        ctx.globalAlpha = opacity; // Reset alpha for the active part
        
        // 2. Calculate the width of the active (highlighted) part
        let activeClipWidth = 0;
        const wordsInLine = line.split(/(\s+)/).filter(s => s.trim().length > 0);
        
        for (let i = 0; i < wordsInLine.length; i++) {
            const word = wordsInLine[i];
            const space = (i < wordsInLine.length - 1) ? " " : "";
            const wordWithSpace = word + space;
            const wordTiming = words[wordCounter + i];
            
            if (!wordTiming) continue;

            const wordWidth = ctx.measureText(wordWithSpace).width;

            if (elapsedTime >= wordTiming.end) {
                activeClipWidth += wordWidth;
            } else if (elapsedTime > wordTiming.start) {
                const wordDuration = wordTiming.end - wordTiming.start;
                const progress = wordDuration > 0 ? (elapsedTime - wordTiming.start) / wordDuration : 1;
                activeClipWidth += wordWidth * easeInOutCubic(progress);
                break; // Stop calculating width once we hit the current word
            } else {
                break; // Word hasn't started yet
            }
        }
        wordCounter += wordsInLine.length;

        // 3. Clip and draw the active part on top
        if (activeClipWidth > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(startX, lineY - fontSize, activeClipWidth, fontSize * 2);
            ctx.clip();
            // Re-draw the full line, but with full opacity
            drawTextWithBackground(ctx, line, startX, lineY, style, textEffect, fontSize, style.fillStyle);
            ctx.restore();
        }
    });
    ctx.restore();
};

const drawWordByWordFadeInAnimation = (ctx: CanvasRenderingContext2D, params: AnimationParameters) => {
    const { lines, words, elapsedTime, style, textEffect, fontSize, finalX, blockStartY } = params;
    if (!words) return;

    let wordCounter = 0;
    lines.forEach((line, lineIndex) => {
        const lineY = blockStartY + (lineIndex * fontSize * 1.2) + (fontSize * 0.6);
        const wordsInLine = line.split(/(\s+)/);

        const lineMetrics = ctx.measureText(line);
        let currentX: number;
        if (ctx.textAlign === 'center') currentX = finalX - lineMetrics.width / 2;
        else if (ctx.textAlign === 'right') currentX = finalX - lineMetrics.width;
        else currentX = finalX;

        for (const word of wordsInLine) {
            let wordOpacity = 0;
            const isWhitespace = word.trim().length === 0;

            if (!isWhitespace) {
                const wordTiming = words[wordCounter];
                if (wordTiming) {
                    const WORD_TRANSITION_DURATION = 0.2; // 200ms
                    const timeSinceStart = elapsedTime - wordTiming.start;
                    const timeUntilEnd = wordTiming.end - elapsedTime;
                    const wordDuration = wordTiming.end - wordTiming.start;

                    // Ensure fade duration isn't longer than half the word's duration for very short words
                    const fadeDuration = Math.max(0.01, Math.min(WORD_TRANSITION_DURATION, wordDuration / 2));

                    if (timeSinceStart > 0 && timeUntilEnd > 0) {
                        if (timeSinceStart < fadeDuration) {
                            // Fading in
                            wordOpacity = easeInOutCubic(timeSinceStart / fadeDuration);
                        } else if (timeUntilEnd < fadeDuration) {
                            // Fading out
                            wordOpacity = easeInOutCubic(timeUntilEnd / fadeDuration);
                        } else {
                            // Fully visible
                            wordOpacity = 1;
                        }
                    }
                }
                wordCounter++;
            } else {
                // For whitespace, just let it take up space. Don't draw it but advance the cursor.
                wordOpacity = 0;
            }

            if (wordOpacity > 0.01) {
                ctx.save();
                ctx.globalAlpha = wordOpacity;
                drawTextWithBackground(ctx, word, currentX, lineY, style, textEffect, fontSize);
                ctx.restore();
            }
            
            currentX += ctx.measureText(word).width;
        }
    });
};

const drawSentenceEffectsAnimation = (ctx: CanvasRenderingContext2D, params: AnimationParameters) => {
    const { lines, elapsedTime, start, end, animationStyle, style, textEffect, fontSize, finalX, blockStartY, totalTextHeight } = params;

    const lineDuration = end - start;
    const timeInAnimation = elapsedTime - start;
    
    let opacity = 0;
    if (timeInAnimation >= 0 && lineDuration > 0) {
        const FADE_TIME = animationStyle === 'Flive' ? 0.4 : FADE_DURATION;
        if (timeInAnimation < FADE_TIME) opacity = easeInOutCubic(timeInAnimation / FADE_TIME);
        else if (lineDuration - timeInAnimation < FADE_TIME) opacity = easeInOutCubic((lineDuration - timeInAnimation) / FADE_TIME);
        else opacity = 1;
    }
    
    if (opacity <= 0.01) return;
    ctx.globalAlpha = opacity;

    ctx.save();
     switch (animationStyle) {
        case 'riseUp': {
            const moveDistance = fontSize;
            ctx.translate(0, moveDistance * (1 - opacity));
            break;
        }
        case 'zoomIn': {
            const scale = 1.1 - 0.1 * opacity;
            ctx.translate(finalX, blockStartY + totalTextHeight/2);
            ctx.scale(scale, scale);
            ctx.translate(-finalX, -(blockStartY + totalTextHeight/2));
            break;
        }
        case 'popUp': {
            const scale = opacity;
            ctx.translate(finalX, blockStartY + totalTextHeight/2);
            ctx.scale(scale, scale);
            ctx.translate(-finalX, -(blockStartY + totalTextHeight/2));
        }
    }

    lines.forEach((line, index) => {
        const lineY = blockStartY + (index * fontSize * 1.2) + (fontSize * 0.6);
        drawTextWithBackground(ctx, line, finalX, lineY, style, textEffect, fontSize);
    });
    ctx.restore();
};

const drawTypewriterAnimation = (ctx: CanvasRenderingContext2D, params: AnimationParameters) => {
    const { text, elapsedTime, start, end, style, textEffect, fontSize, finalX, blockStartY, maxWidth } = params;

    const lineDuration = end - start;
    const timeInAnimation = elapsedTime - start;

    let opacity = 1;
    if (lineDuration - timeInAnimation < FADE_DURATION) {
        opacity = easeInOutCubic((lineDuration - timeInAnimation) / FADE_DURATION);
    }
    if (opacity <= 0.01) return;
    ctx.globalAlpha = opacity;

    const progress = lineDuration > 0 ? Math.min(timeInAnimation / lineDuration, 1.0) : 1.0;
    const charProgress = Math.floor(progress * text.length);
    let textToDraw = text.substring(0, charProgress);
    const typewriterLines = getLines(ctx, textToDraw, maxWidth);

    if (progress < 1.0 && Math.floor(elapsedTime / 0.4) % 2 === 0) {
         if (textToDraw.endsWith('\n') || textToDraw.length === 0) {
            typewriterLines.push('▋');
         } else if (typewriterLines.length > 0) {
            typewriterLines[typewriterLines.length - 1] += '▋';
         } else {
            typewriterLines.push('▋');
         }
    }

     typewriterLines.forEach((line, index) => {
        const lineY = blockStartY + (index * fontSize * 1.2) + (fontSize * 0.6);
        drawTextWithBackground(ctx, line, finalX, lineY, style, textEffect, fontSize);
    });
};

interface AnimationParameters {
    text: string;
    lines: string[];
    words?: WordTiming[];
    elapsedTime: number;
    start: number;
    end: number;
    animationStyle: string;
    style: CaptionStyle;
    textEffect: TextEffect;
    fontSize: number;
    finalX: number;
    blockStartY: number;
    totalTextHeight: number;
    maxWidth: number;
}

function drawAnimatedText(
    ctx: CanvasRenderingContext2D, 
    activeLine: LineTiming,
    elapsedTime: number,
    animationStyle: string,
    style: CaptionStyle,
    position: Position,
    textEffect: TextEffect
) {
    const { text, start, end, words } = activeLine;
    if (!text) return;
    // Extend render time slightly to allow fades to complete
    if (elapsedTime < start - FADE_DURATION || elapsedTime > end + FADE_DURATION) return;

    ctx.save();
    
    // --- Global Setup ---
    const padding = ctx.canvas.width * 0.05;
    const maxWidth = ctx.canvas.width - (padding * 2);
    
    // Create a temporary font setting to calculate line breaks
    const tempBaseSize = Math.min(ctx.canvas.width / 15, ctx.canvas.height / 12);
    const tempFontSize = Math.max(16, tempBaseSize);
    ctx.font = `${style.fontWeight || 'bold'} ${tempFontSize}px '${style.fontFamily}', sans-serif`;
    
    const lines = getLines(ctx, text, maxWidth);
    if (lines.length === 0) { ctx.restore(); return; }
    
    // Adaptive font size based on line count and text length
    const lineCountFactor = Math.max(0.7, 1 - (lines.length - 2) * 0.1);
    const textLengthFactor = Math.max(0.8, 1 - (text.length / 200) * 0.1);
    const fontSize = tempFontSize * lineCountFactor * textLengthFactor;
    ctx.font = `${style.fontWeight || 'bold'} ${fontSize}px '${style.fontFamily}', sans-serif`;

    const [verticalAlign, horizontalAlign] = position.split('-');
    const xPadding = ctx.canvas.width * 0.05;
    const yPadding = ctx.canvas.height * 0.05;

    let finalX: number;
    ctx.textAlign = horizontalAlign as CanvasTextAlign;
    if (horizontalAlign === 'left') finalX = xPadding;
    else if (horizontalAlign === 'right') finalX = ctx.canvas.width - xPadding;
    else finalX = ctx.canvas.width / 2;
    
    const totalTextHeight = lines.length * fontSize * 1.2;
    let blockStartY: number;
    if (verticalAlign === 'top') blockStartY = yPadding;
    else if (verticalAlign === 'bottom') blockStartY = ctx.canvas.height - yPadding - totalTextHeight;
    else blockStartY = (ctx.canvas.height - totalTextHeight) / 2;
    
    ctx.textBaseline = 'middle';
    ctx.shadowColor = style.shadowColor;
    ctx.shadowBlur = style.shadowBlur;
    ctx.shadowOffsetX = style.shadowOffsetX;
    ctx.shadowOffsetY = style.shadowOffsetY;
    if (textEffect === 'glow') {
      ctx.shadowColor = style.fillStyle;
      ctx.shadowBlur = fontSize * 0.5;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }
    
    const animationParams: AnimationParameters = {
        text, lines, words, elapsedTime, start, end, animationStyle, style, textEffect, fontSize, finalX, blockStartY, totalTextHeight, maxWidth
    };
    
    // --- Animation Logic ---
    switch(animationStyle) {
        case 'liveSpeech':
            drawKaraokeAnimation(ctx, animationParams);
            break;
        case 'FFlive':
            drawWordByWordFadeInAnimation(ctx, animationParams);
            break;
        case 'Flive':
        case 'fadeInOut': 
        case 'riseUp':
        case 'popUp':
        case 'zoomIn':
        case 'cinematicReveal': // Fallback for simple fade
            drawSentenceEffectsAnimation(ctx, animationParams);
            break;
        case 'typewriter':
            drawTypewriterAnimation(ctx, animationParams);
            break;
        default:
            // Default to a simple sentence fade for unknown styles
            animationParams.animationStyle = 'fadeInOut';
            drawSentenceEffectsAnimation(ctx, animationParams);
            break;
    }

    ctx.restore();
}