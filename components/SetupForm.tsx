import React, { useState } from 'react';
import { generateLessonPlan } from '../services/geminiService';
import { LessonProject, Audience, Difficulty } from '../types';
import { Loader2, Sparkles, Youtube } from 'lucide-react';

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
          <div className="relative">
            <Youtube className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input 
                type="url" 
                required
                className="w-full pl-10 p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-arcade-500 focus:border-arcade-500 outline-none transition-all"
                placeholder="https://www.youtube.com/watch?v=..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
            />
          </div>
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
