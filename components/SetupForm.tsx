import React, { useState } from 'react';
import { generateLessonPlan, generateVideoSummary } from '../services/geminiService';
import { LessonProject, Audience, Difficulty } from '../types';
import { Loader2, Sparkles, Youtube, Wand2 } from 'lucide-react';

interface SetupFormProps {
  onLessonCreated: (project: LessonProject) => void;
}

export const SetupForm: React.FC<SetupFormProps> = ({ onLessonCreated }) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [audience, setAudience] = useState<Audience>('intermediate');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-fill state
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [autoFillError, setAutoFillError] = useState<string | null>(null);

  const handleAutoFill = async () => {
    if (!url) return;
    
    // 1. Validate URL
    let isYoutube = false;
    try {
      const u = new URL(url);
      isYoutube = u.hostname.includes('youtube.com') || u.hostname === 'youtu.be';
    } catch(e) {}
    
    if (!isYoutube) {
      setAutoFillError("Please paste a valid YouTube URL before auto-filling.");
      return;
    }

    setIsAutoFilling(true);
    setAutoFillError(null);

    try {
      // 2. Fetch oEmbed Data
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      const res = await fetch(oembedUrl);
      
      if (!res.ok) {
        throw new Error("Could not fetch video details from YouTube.");
      }
      
      const data = await res.json();
      const fetchedTitle = data.title;
      const authorName = data.author_name;

      // Update Title
      if (fetchedTitle) {
        setTitle(fetchedTitle);
      }

      // 3. Generate Summary with Gemini
      if (fetchedTitle) {
         const summary = await generateVideoSummary(fetchedTitle, authorName, audience, difficulty);
         if (summary) {
           setDescription(summary);
         }
      }

    } catch (err) {
      console.error(err);
      setAutoFillError("We couldn't auto-fill this video. You can still type the title and summary manually.");
    } finally {
      setIsAutoFilling(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !title) return;

    setIsLoading(true);
    setError(null);
    try {
      const project = await generateLessonPlan(url, title, description, audience, difficulty);
      onLessonCreated(project);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-arcade-600 to-arcade-800 p-8 text-white text-center">
        <h1 className="text-3xl font-extrabold mb-2 flex items-center justify-center gap-3">
            <Sparkles className="w-8 h-8 text-yellow-300" />
            LessonArcade
        </h1>
        <p className="text-arcade-100 text-lg">Turn any YouTube video into an interactive learning game.</p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">YouTube URL</label>
          <div className="flex gap-2 items-start">
            <div className="relative flex-1">
              <Youtube className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input 
                  type="url" 
                  required
                  className="w-full pl-10 p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-arcade-500 focus:border-arcade-500 outline-none transition-all"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    if (autoFillError) setAutoFillError(null);
                  }}
              />
            </div>
            <button
              type="button"
              onClick={handleAutoFill}
              disabled={!url || isAutoFilling}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2.5 rounded-lg border border-slate-300 transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isAutoFilling ? (
                <Loader2 className="animate-spin w-4 h-4" />
              ) : (
                <Wand2 className="w-4 h-4 text-arcade-600" />
              )}
              {isAutoFilling ? "Filling..." : "Auto-fill"}
            </button>
          </div>
          {autoFillError && (
             <p className="text-red-500 text-xs mt-2 ml-1 animate-in slide-in-from-top-1 fade-in duration-200">
               {autoFillError}
             </p>
          )}
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Video Title</label>
            <input 
                type="text" 
                required
                className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-arcade-500 focus:border-arcade-500 outline-none"
                placeholder="e.g., Introduction to Astrophysics"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
                Description / Summary
                <span className="text-slate-400 font-normal ml-2">(Optional but recommended)</span>
            </label>
            <textarea 
                className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-arcade-500 focus:border-arcade-500 outline-none h-24 resize-none"
                placeholder="Paste the video description or a short summary here to help Gemini generate better questions..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
            />
        </div>

        <div className="grid grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Target Audience</label>
                <select 
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-arcade-500 outline-none bg-white"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value as Audience)}
                >
                    <option value="child">Child</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="professional">Professional</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Difficulty</label>
                <select 
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-arcade-500 outline-none bg-white"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                </select>
            </div>
        </div>

        {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                {error}
            </div>
        )}

        <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-arcade-600 hover:bg-arcade-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
            {isLoading ? (
                <>
                    <Loader2 className="animate-spin w-5 h-5" />
                    Generating Arcade...
                </>
            ) : (
                <>
                    <Sparkles className="w-5 h-5" />
                    Generate Lesson
                </>
            )}
        </button>
      </form>
    </div>
  );
};
