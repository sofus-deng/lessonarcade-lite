import React from 'react';
import { ExternalLink } from 'lucide-react';

interface VideoPlayerProps {
  videoUrl: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl }) => {
  const getEmbedUrl = (url: string) => {
    let videoId = '';
    let listId = '';

    try {
      const u = new URL(url);
      if (u.hostname === 'youtu.be') {
        videoId = u.pathname.slice(1);
      } else if (u.hostname.includes('youtube.com')) {
        videoId = u.searchParams.get('v') || '';
        listId = u.searchParams.get('list') || '';
      }
    } catch (e) {
      console.warn("Invalid URL for parsing ID", e);
    }

    if (!videoId) return '';

    let embedSrc = `https://www.youtube.com/embed/${videoId}?rel=0`;
    if (listId) {
      embedSrc += `&list=${listId}`;
    }
    return embedSrc;
  };

  const embedUrl = getEmbedUrl(videoUrl);

  if (!embedUrl) {
    return (
      <div className="w-full aspect-video bg-slate-900 rounded-xl flex items-center justify-center text-white">
        <p>Invalid Video URL</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-lg border border-slate-800">
        <iframe
          className="w-full h-full"
          src={embedUrl}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      <a 
        href={videoUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-xs text-slate-500 hover:text-arcade-600 flex items-center justify-end gap-1 px-1 transition-colors"
      >
        <span>Open on YouTube</span>
        <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
};