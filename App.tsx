import React, { useState } from 'react';
import { LessonProject, PlaySession } from './types';
import { SetupForm } from './components/SetupForm';
import { VideoPlayer } from './components/VideoPlayer';
import { LevelList } from './components/LevelList';
import { ArcadePanel } from './components/ArcadePanel';
import { BuilderPanel } from './components/BuilderPanel';
import { Gamepad2, Hammer, ChevronLeft, Star } from 'lucide-react';

const App: React.FC = () => {
  const [project, setProject] = useState<LessonProject | null>(null);
  const [mode, setMode] = useState<'play' | 'build'>('play');
  const [currentLevelId, setCurrentLevelId] = useState<string | null>(null);
  
  // Session State
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [completedLevels, setCompletedLevels] = useState<string[]>([]);

  const handleLessonCreated = (newProject: LessonProject) => {
    setProject(newProject);
    // Auto-select first level
    if (newProject.levels.length > 0) {
      setCurrentLevelId(newProject.levels[0].id);
    }
  };

  const handleLevelComplete = (levelScore: number) => {
    if (currentLevelId && !completedLevels.includes(currentLevelId)) {
        setCompletedLevels(prev => [...prev, currentLevelId]);
    }
  };

  const resetGame = () => {
    setProject(null);
    setScore(0);
    setStreak(0);
    setCompletedLevels([]);
    setCurrentLevelId(null);
  };

  if (!project) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-slate-50">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100"></div>
        
        {/* Decorative Blobs */}
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-20 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-2xl">
           <SetupForm onLessonCreated={handleLessonCreated} />
        </div>
      </div>
    );
  }

  const currentLevel = project.levels.find(l => l.id === currentLevelId);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button 
                    onClick={resetGame}
                    className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                    title="Back to Setup"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <h1 className="font-bold text-xl text-slate-800 hidden sm:block">LessonArcade</h1>
                <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
                <div className="text-sm font-medium text-slate-600 truncate max-w-[200px] sm:max-w-xs">
                    {project.videoTitle}
                </div>
            </div>

            <div className="flex items-center gap-4">
                {mode === 'play' && (
                    <div className="flex items-center gap-3 bg-slate-100 rounded-lg px-3 py-1.5 border border-slate-200">
                        <div className="flex items-center gap-1.5 text-yellow-600 font-bold">
                            <Star className="w-4 h-4 fill-yellow-500" />
                            <span>{score}</span>
                        </div>
                    </div>
                )}

                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                    <button
                        onClick={() => setMode('play')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'play' ? 'bg-white text-arcade-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Gamepad2 className="w-4 h-4" />
                        Play
                    </button>
                    <button
                        onClick={() => setMode('build')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'build' ? 'bg-white text-arcade-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Hammer className="w-4 h-4" />
                        Build
                    </button>
                </div>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Video & Navigation */}
        <div className="lg:col-span-5 space-y-6 flex flex-col h-[calc(100vh-7rem)] overflow-y-auto pb-10">
            <div className="flex-shrink-0">
                <VideoPlayer videoUrl={project.videoUrl} />
            </div>
            
            <div className="flex-1">
                <LevelList 
                    levels={project.levels} 
                    currentLevelId={currentLevelId}
                    onSelectLevel={setCurrentLevelId}
                    completedLevelIds={completedLevels}
                />
            </div>
        </div>

        {/* Right Column: Arcade or Builder */}
        <div className="lg:col-span-7 h-[600px] lg:h-[calc(100vh-7rem)]">
            {mode === 'play' ? (
                currentLevel ? (
                    <ArcadePanel 
                        level={currentLevel}
                        onLevelComplete={handleLevelComplete}
                        updateScore={(pts) => setScore(prev => prev + pts)}
                        streak={streak}
                        incrementStreak={() => setStreak(s => s + 1)}
                        resetStreak={() => setStreak(0)}
                    />
                ) : (
                    <div className="h-full flex items-center justify-center bg-white rounded-xl border border-slate-200 text-slate-400">
                        Select a level to start playing
                    </div>
                )
            ) : (
                <BuilderPanel project={project} />
            )}
        </div>

      </main>
    </div>
  );
};

export default App;