import React from 'react';

interface AnimationPreviewProps {
  animationStyleId: string;
}

const AnimationPreview: React.FC<AnimationPreviewProps> = ({ animationStyleId }) => {
  const renderPreview = () => {
    switch (animationStyleId) {
      case 'liveSpeech': // Karaoke
        return <div className="preview-text karaoke-preview">Animation Preview</div>;
      
      case 'FFlive': // Word Fade
        return (
          <div className="preview-text FFlive-preview">
            {'Animation Preview Words'.split(' ').map((word, i) => (
              <span key={i} style={{ animationDelay: `${i * 0.8}s` }}>{word}&nbsp;</span>
            ))}
          </div>
        );

      case 'typewriter':
         return (
            <div className="preview-text typewriter-preview">
                <p>Animation Preview</p>
            </div>
         );
      
      case 'none':
        return <div className="preview-text">Animation Preview</div>;

      default:
        return <div className={`preview-text ${animationStyleId}-preview`}>Animation Preview</div>;
    }
  };

  return (
    <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">Animation Preview</label>
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 flex items-center justify-center min-h-[72px] overflow-hidden">
            {renderPreview()}
        </div>
    </div>
  );
};

export default AnimationPreview;
