import React from 'react';

interface VideoPlayerProps {
  videoUrl: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl }) => {
  const getEmbedUrl = (url: string) => {
    let videoId = '';
    try {
      const u = new URL(url);
      if (u.hostname === 'youtu.be') {
        videoId = u.pathname.slice(1);
      } else if (u.hostname.includes('youtube.com')) {
        videoId = u.searchParams.get('v') || '';
      }
    } catch (e) {
      console.warn("Invalid URL for parsing ID", e);
    }

    // Default placeholder if invalid
    if (!videoId) return '';

    return `https://www.youtube.com/embed/${videoId}?rel=0`;
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
  );
};
