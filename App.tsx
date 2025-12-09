import React, { useState, useEffect } from 'react';
import { LessonProject, LeaderboardEntry } from './types';
import { SetupForm } from './components/SetupForm';
import { VideoPlayer } from './components/VideoPlayer';
import { LevelList } from './components/LevelList';
import { ArcadePanel } from './components/ArcadePanel';
import { BuilderPanel } from './components/BuilderPanel';
import { getLeaderboard, saveScore } from './services/leaderboardService';
import { APP_NAME } from './config';
import { Gamepad2, Hammer, ChevronLeft, Star, Trophy, Medal, Save, RotateCcw } from 'lucide-react';

const App: React.FC = () => {
  const [project, setProject] = useState<LessonProject | null>(null);
  const [mode, setMode] = useState<'play' | 'build'>('play');
  const [currentLevelId, setCurrentLevelId] = useState<string | null>(null);
  
  // Session State
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [completedLevels, setCompletedLevels] = useState<string[]>([]);
  
  // Stats for Course Summary
  const [sessionStats, setSessionStats] = useState({
    totalCorrect: 0,
    totalQuestions: 0
  });
  
  // Leaderboard State
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [hasSavedScore, setHasSavedScore] = useState(false);

  // Ensure document title matches APP_NAME
  useEffect(() => {
    document.title = APP_NAME;
  }, []);

  const handleLessonCreated = (newProject: LessonProject) => {
    setProject(newProject);
    // Auto-select first level
    if (newProject.levels.length > 0) {
      setCurrentLevelId(newProject.levels[0].id);
    }
  };

  const handleLevelComplete = (levelScore: number, correctCount: number, questionCount: number) => {
    if (!project || !currentLevelId) return;

    // Update session stats
    setSessionStats(prev => ({
      totalCorrect: prev.totalCorrect + correctCount,
      totalQuestions: prev.totalQuestions + questionCount
    }));

    if (!completedLevels.includes(currentLevelId)) {
        const newCompleted = [...completedLevels, currentLevelId];
        setCompletedLevels(newCompleted);

        // Check for Course Completion
        if (newCompleted.length === project.levels.length) {
            const lb = getLeaderboard(project.id);
            setLeaderboardData(lb);
            setShowLeaderboard(true);
        }
    }
  };

  const saveToLeaderboard = () => {
    if (!project || !playerName.trim()) return;
    
    const accuracy = sessionStats.totalQuestions > 0 
      ? Math.round((sessionStats.totalCorrect / sessionStats.totalQuestions) * 100) 
      : 0;

    const entry: LeaderboardEntry = {
      name: playerName.trim(),
      score: score,
      accuracy: accuracy,
      completedAt: Date.now()
    };

    const updated = saveScore(project.id, entry);
    setLeaderboardData(updated);
    setHasSavedScore(true);
  };

  const resetGame = () => {
    setProject(null);
    setScore(0);
    setStreak(0);
    setCompletedLevels([]);
    setCurrentLevelId(null);
    setSessionStats({ totalCorrect: 0, totalQuestions: 0 });
    setShowLeaderboard(false);
    setHasSavedScore(false);
    setPlayerName('');
  };

  const restartCourse = () => {
    setScore(0);
    setStreak(0);
    setCompletedLevels([]);
    setSessionStats({ totalCorrect: 0, totalQuestions: 0 });
    setShowLeaderboard(false);
    setHasSavedScore(false);
    setPlayerName('');
    if (project && project.levels.length > 0) {
      setCurrentLevelId(project.levels[0].id);
    }
  };

  if (!project) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-slate-50">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100"></div>
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-20 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        <div className="relative z-10 w-full max-w-2xl">
           <SetupForm onLessonCreated={handleLessonCreated} />
        </div>
      </div>
    );
  }

  const currentLevelIndex = project.levels.findIndex(l => l.id === currentLevelId);
  const currentLevel = project.levels[currentLevelIndex];
  const isLastLevel = currentLevelIndex === project.levels.length - 1;

  // Render Course Complete / Leaderboard View
  if (showLeaderboard) {
    const accuracy = sessionStats.totalQuestions > 0 
      ? Math.round((sessionStats.totalCorrect / sessionStats.totalQuestions) * 100) 
      : 0;

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-fade-in-up">
                <div className="bg-arcade-600 p-8 text-white text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-300 drop-shadow-lg animate-bounce" />
                    <h1 className="text-4xl font-black mb-2">Course Complete!</h1>
                    <p className="text-arcade-100 text-lg">You've mastered {project.videoTitle}</p>
                </div>
                
                <div className="p-8">
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100">
                            <div className="text-slate-400 text-xs font-bold uppercase mb-1">Total Score</div>
                            <div className="text-3xl font-black text-arcade-600">{score}</div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100">
                            <div className="text-slate-400 text-xs font-bold uppercase mb-1">Accuracy</div>
                            <div className="text-3xl font-black text-blue-600">{accuracy}%</div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100">
                            <div className="text-slate-400 text-xs font-bold uppercase mb-1">Levels</div>
                            <div className="text-3xl font-black text-purple-600">{completedLevels.length}</div>
                        </div>
                    </div>

                    {!hasSavedScore ? (
                        <div className="bg-arcade-50 p-6 rounded-2xl border border-arcade-100 mb-8">
                            <h3 className="font-bold text-arcade-900 mb-3 flex items-center gap-2">
                                <Medal className="w-5 h-5 text-arcade-500" />
                                Join the Leaderboard
                            </h3>
                            <div className="flex gap-3">
                                <input 
                                    type="text" 
                                    placeholder="Enter your name or initials" 
                                    className="flex-1 p-3 rounded-xl border-2 border-arcade-200 focus:border-arcade-500 focus:outline-none"
                                    value={playerName}
                                    onChange={(e) => setPlayerName(e.target.value)}
                                    maxLength={15}
                                />
                                <button 
                                    onClick={saveToLeaderboard}
                                    disabled={!playerName.trim()}
                                    className="bg-arcade-600 hover:bg-arcade-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors"
                                >
                                    <Save className="w-4 h-4" />
                                    Save
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="mb-8">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-yellow-500" />
                                Local Leaderboard
                            </h3>
                            {leaderboardData.length > 0 ? (
                                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 text-slate-500">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-bold w-16">Rank</th>
                                                <th className="px-4 py-3 text-left font-bold">Name</th>
                                                <th className="px-4 py-3 text-right font-bold">Accuracy</th>
                                                <th className="px-4 py-3 text-right font-bold">Score</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {leaderboardData.map((entry, idx) => (
                                                <tr key={idx} className={entry.name === playerName && entry.completedAt === leaderboardData[idx].completedAt ? "bg-yellow-50" : ""}>
                                                    <td className="px-4 py-3 font-bold text-slate-400">#{idx + 1}</td>
                                                    <td className="px-4 py-3 font-medium text-slate-800">{entry.name}</td>
                                                    <td className="px-4 py-3 text-right text-slate-600">{entry.accuracy}%</td>
                                                    <td className="px-4 py-3 text-right font-bold text-arcade-600">{entry.score}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-center text-slate-500 italic py-4">Be the first to set a high score!</p>
                            )}
                        </div>
                    )}

                    <div className="flex justify-between pt-4 border-t border-slate-100">
                        <button onClick={resetGame} className="text-slate-500 hover:text-slate-700 font-medium px-4 py-2 hover:bg-slate-50 rounded-lg transition-colors">
                            Pick a New Video
                        </button>
                        <button onClick={restartCourse} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-lg">
                            <RotateCcw className="w-4 h-4" />
                            Play Again
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
  }

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
                <h1 className="font-bold text-xl text-slate-800 hidden sm:block">{APP_NAME}</h1>
                <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
                <div className="text-sm font-medium text-slate-600 truncate max-w-[200px] sm:max-w-xs">
                    {project.videoTitle}
                </div>
            </div>

            <div className="flex items-center gap-4">
                {mode === 'play' && (
                    <div 
                        className="flex items-center gap-2 bg-slate-100 rounded-full pl-2 pr-4 py-1.5 border border-slate-200 cursor-help transition-colors hover:bg-slate-50 hover:border-arcade-200"
                        title="Total points you've earned in this lesson so far."
                    >
                        <div className="bg-white p-1 rounded-full shadow-sm">
                            <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                        </div>
                        <span className="text-sm font-bold text-slate-700">Score {score}</span>
                    </div>
                )}

                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                    <button
                        onClick={() => setMode('play')}
                        title="Try the lesson as a learner."
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'play' ? 'bg-white text-arcade-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Gamepad2 className="w-4 h-4" />
                        Play
                    </button>
                    <button
                        onClick={() => setMode('build')}
                        title="Edit levels and questions as the creator."
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
                <VideoPlayer videoUrl={project.videoUrl} title={project.videoTitle} />
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
                        isLastLevel={isLastLevel}
                        onLevelComplete={handleLevelComplete}
                        updateScore={(pts) => setScore(prev => prev + pts)}
                        // Note: Global streak is tracked in ArcadePanel now to keep it simpler per level
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