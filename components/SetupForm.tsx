import React, { useState } from 'react';
import { generateLessonPlan, generateVideoSummary } from '../services/geminiService';
import { LessonProject, Audience, Difficulty } from '../types';
import { Loader2, Sparkles, Youtube, Wand2, Play } from 'lucide-react';

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
    <div className="w-full bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 overflow-hidden animate-fade-in-up">
      {/* Playful Header */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 p-8 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <h1 className="text-4xl font-black mb-2 flex items-center justify-center gap-3 drop-shadow-md tracking-tight">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm shadow-inner">
               <Sparkles className="w-8 h-8 text-yellow-300 animate-pulse-slow" />
            </div>
            LessonArcade
        </h1>
        <p className="text-purple-100 text-lg font-medium opacity-90">Insert Coin (URL) to Start Learning</p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        {/* YouTube URL Section */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">YouTube URL</label>
          <div className="flex gap-3 items-start">
            <div className="relative flex-1 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 <Youtube className="h-5 w-5 text-slate-400 group-focus-within:text-red-500 transition-colors" />
              </div>
              <input 
                  type="url" 
                  required
                  className="w-full pl-10 p-3 rounded-xl border-2 border-slate-200 bg-slate-50/50 focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 outline-none transition-all duration-200 font-medium text-slate-800 placeholder:text-slate-400"
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
              className="px-5 py-3 rounded-xl font-bold text-sm border-2 border-violet-100 text-violet-600 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700 active:bg-violet-100 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-sm hover:shadow-md"
              title="Auto-fill details from YouTube"
            >
              {isAutoFilling ? (
                <Loader2 className="animate-spin w-4 h-4" />
              ) : (
                <Wand2 className="w-4 h-4" />
              )}
              {isAutoFilling ? "Filling..." : "Auto-fill"}
            </button>
          </div>
          {autoFillError && (
             <p className="text-red-500 text-sm font-medium mt-2 ml-1 animate-in slide-in-from-top-1 fade-in duration-200 flex items-center gap-1">
               <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500"></span>
               {autoFillError}
             </p>
          )}
        </div>

        {/* Title Input */}
        <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Video Title</label>
            <input 
                type="text" 
                required
                className="w-full p-3 rounded-xl border-2 border-slate-200 bg-slate-50/50 focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 outline-none transition-all duration-200 font-medium text-slate-800"
                placeholder="e.g., Introduction to Astrophysics"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />
        </div>

        {/* Description Input */}
        <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide flex justify-between">
                Description / Summary
                <span className="text-slate-400 font-normal normal-case text-xs bg-slate-100 px-2 py-0.5 rounded-full">Optional</span>
            </label>
            <textarea 
                className="w-full p-3 rounded-xl border-2 border-slate-200 bg-slate-50/50 focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 outline-none transition-all duration-200 h-24 resize-none font-medium text-slate-800"
                placeholder="Paste the video description or a short summary here..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
            />
        </div>

        {/* Dropdowns */}
        <div className="grid grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Target Audience</label>
                <div className="relative">
                    <select 
                        className="w-full p-3 rounded-xl border-2 border-slate-200 bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 outline-none appearance-none font-medium text-slate-800 cursor-pointer hover:border-violet-300 transition-colors"
                        value={audience}
                        onChange={(e) => setAudience(e.target.value as Audience)}
                    >
                        <option value="child">Child (K-6)</option>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="professional">Professional</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
                        <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                    </div>
                </div>
            </div>
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Difficulty</label>
                <div className="relative">
                    <select 
                        className="w-full p-3 rounded-xl border-2 border-slate-200 bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 outline-none appearance-none font-medium text-slate-800 cursor-pointer hover:border-violet-300 transition-colors"
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                    >
                        <option value="easy">Easy Mode</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard Mode</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
                        <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                    </div>
                </div>
            </div>
        </div>

        {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border-l-4 border-red-500 flex items-start gap-3">
                <div className="mt-0.5">⚠️</div>
                <div className="flex-1">{error}</div>
            </div>
        )}

        <button 
            type="submit" 
            disabled={isLoading}
            className="group w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-black text-lg py-4 rounded-2xl transition-all shadow-lg hover:shadow-violet-500/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3 relative overflow-hidden"
        >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 blur-md"></div>
            {isLoading ? (
                <>
                    <Loader2 className="animate-spin w-6 h-6" />
                    <span className="animate-pulse">Building Level...</span>
                </>
            ) : (
                <>
                    <div className="bg-white/20 p-1 rounded-full">
                        <Play className="w-5 h-5 fill-current" />
                    </div>
                    Generate Lesson
                </>
            )}
        </button>
      </form>
    </div>
  );
};