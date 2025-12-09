import React from 'react';
import { LessonLevel } from '../types';
import { Play, CheckCircle, Lock, Clock } from 'lucide-react';

interface LevelListProps {
  levels: LessonLevel[];
  currentLevelId: string | null;
  onSelectLevel: (id: string) => void;
  completedLevelIds: string[];
}

export const LevelList: React.FC<LevelListProps> = ({ levels, currentLevelId, onSelectLevel, completedLevelIds }) => {
  return (
    <div className="flex flex-col gap-3 px-4 md:px-6">
      <div className="flex items-center justify-between px-1">
          <h3 className="text-lg font-bold text-slate-800">Levels</h3>
          <span className="text-xs font-bold text-slate-500 bg-white/50 px-2 py-1 rounded-full border border-white/60">{completedLevelIds.length} / {levels.length} Complete</span>
      </div>
      {levels.map((level, index) => {
        const isActive = level.id === currentLevelId;
        const isCompleted = completedLevelIds.includes(level.id);
        // Simple logic: unlock if previous is completed or it's the first one
        const isLocked = index > 0 && !completedLevelIds.includes(levels[index - 1].id);

        return (
          <button
            key={level.id}
            onClick={() => !isLocked && onSelectLevel(level.id)}
            disabled={isLocked}
            className={`
              w-full text-left p-4 rounded-xl border transition-all duration-200 group relative
              ${isActive 
                ? 'bg-white/80 border-arcade-500 shadow-md ring-1 ring-arcade-500 z-10' 
                : 'bg-white/60 border-white/60 hover:border-arcade-300 hover:shadow-sm hover:bg-white/80'}
              ${isLocked ? 'opacity-60 cursor-not-allowed bg-slate-50/50' : ''}
            `}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-2">
                <h4 className={`font-semibold text-sm md:text-base ${isActive ? 'text-arcade-700' : 'text-slate-800'}`}>
                  Level {index + 1}: {level.title}
                </h4>
                <p className="text-xs md:text-sm text-slate-500 mt-1 line-clamp-2">{level.description}</p>
              </div>
              <div className="mt-1 flex-shrink-0">
                 {isCompleted ? (
                   <CheckCircle className="w-5 h-5 text-green-500" />
                 ) : isLocked ? (
                   <Lock className="w-5 h-5 text-slate-400" />
                 ) : (
                   <Play className={`w-5 h-5 ${isActive ? 'text-arcade-600' : 'text-slate-300 group-hover:text-arcade-400'}`} />
                 )}
              </div>
            </div>
            {level.timeRangeStart && (
               <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                 <Clock className="w-3 h-3" />
                 <span>Starts at {level.timeRangeStart}</span>
               </div>
            )}
          </button>
        );
      })}
    </div>
  );
};