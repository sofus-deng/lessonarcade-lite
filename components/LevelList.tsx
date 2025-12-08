import React from 'react';
import { LessonLevel } from '../types';
import { Play, CheckCircle, Lock } from 'lucide-react';

interface LevelListProps {
  levels: LessonLevel[];
  currentLevelId: string | null;
  onSelectLevel: (id: string) => void;
  completedLevelIds: string[];
}

export const LevelList: React.FC<LevelListProps> = ({ levels, currentLevelId, onSelectLevel, completedLevelIds }) => {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-lg font-bold text-slate-800 px-1">Levels</h3>
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
              w-full text-left p-4 rounded-xl border transition-all duration-200
              ${isActive 
                ? 'bg-arcade-50 border-arcade-500 shadow-md ring-1 ring-arcade-500' 
                : 'bg-white border-slate-200 hover:border-arcade-300 hover:shadow-sm'}
              ${isLocked ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}
            `}
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className={`font-semibold ${isActive ? 'text-arcade-700' : 'text-slate-800'}`}>
                  Level {index + 1}: {level.title}
                </h4>
                <p className="text-sm text-slate-500 mt-1 line-clamp-2">{level.description}</p>
              </div>
              <div className="mt-1">
                 {isCompleted ? (
                   <CheckCircle className="w-5 h-5 text-green-500" />
                 ) : isLocked ? (
                   <Lock className="w-5 h-5 text-slate-400" />
                 ) : (
                   <Play className={`w-5 h-5 ${isActive ? 'text-arcade-600' : 'text-slate-300'}`} />
                 )}
              </div>
            </div>
            {level.timeRangeStart && (
               <span className="inline-block mt-2 text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                 {level.timeRangeStart}
               </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
