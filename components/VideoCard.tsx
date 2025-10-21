
import React from 'react';
import { GeneratedVideo } from '../types';
import { DownloadIcon } from './IconComponents';

interface VideoCardProps {
  video: GeneratedVideo;
}

const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = video.videoUrl;
    // A simple file name, could be made more descriptive
    link.download = `motivation_video_${video.id}.webm`; 
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4 flex flex-col justify-between shadow-lg transition-all duration-300 hover:border-sky-500 hover:shadow-sky-500/10">
      <video
        src={video.videoUrl}
        controls
        className="w-full rounded-md mb-4 border border-gray-600"
      />
      <div>
        <p className="text-gray-200 text-base italic mb-4 leading-relaxed whitespace-pre-wrap">"{video.quote}"</p>
        <div className="flex justify-end">
          <button
            onClick={handleDownload}
            className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors"
            aria-label="Download video"
          >
            <DownloadIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
