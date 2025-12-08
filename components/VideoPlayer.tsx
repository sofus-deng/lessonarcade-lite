import React from 'react';
import { ExternalLink, AlertCircle } from 'lucide-react';

interface VideoPlayerProps {
  videoUrl: string;
  title?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, title }) => {
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

    // Use privacy-enhanced domain and ensure rel=0
    let embedSrc = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`;
    if (listId) {
      embedSrc += `&list=${listId}`;
    }
    return embedSrc;
  };

  const embedUrl = getEmbedUrl(videoUrl);

  if (!embedUrl) {
    return (
      <div className="w-full aspect-video bg-slate-900 rounded-xl flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-2">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <p>Invalid Video URL</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-lg border border-slate-800 relative group bg-slate-900">
        <iframe
          className="w-full h-full"
          src={embedUrl}
          title={title || "Lesson video"}
          frameBorder="0"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      
      {/* Fallback / External Link */}
      <div className="flex items-center justify-between px-2 py-2 bg-slate-100/50 rounded-lg border border-slate-200">
        <p className="text-xs text-slate-500 font-medium">
            Video not playing?
        </p>
        <a 
            href={videoUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm font-bold text-arcade-600 hover:text-arcade-700 hover:underline transition-colors"
        >
            <span>Watch on YouTube</span>
            <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};