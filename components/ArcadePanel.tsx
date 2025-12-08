import React, { useState, useEffect } from 'react';
import { LessonLevel, QuizQuestion, EvaluationResult } from '../types';
import { evaluateAnswer } from '../services/geminiService';
import { Trophy, Flame, ArrowRight, RefreshCcw, Loader2 } from 'lucide-react';

interface ArcadePanelProps {
  level: LessonLevel;
  onLevelComplete: (score: number) => void;
  updateScore: (points: number) => void;
  streak: number;
  incrementStreak: () => void;
  resetStreak: () => void;
}

export const ArcadePanel: React.FC<ArcadePanelProps> = ({ 
  level, 
  onLevelComplete, 
  updateScore,
  streak,
  incrementStreak,
  resetStreak
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [levelScore, setLevelScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  // Reset state when level changes
  useEffect(() => {
    setCurrentQuestionIndex(0);
    setUserAnswer('');
    setEvaluation(null);
    setLevelScore(0);
    setCompleted(false);
  }, [level.id]);

  const currentQuestion = level.questions[currentQuestionIndex];

  const handleEvaluate = async () => {
    if (!userAnswer.trim()) return;

    setIsEvaluating(true);
    try {
      const result = await evaluateAnswer(
        currentQuestion.question,
        userAnswer,
        currentQuestion.correctAnswer || "Check for conceptual accuracy.",
        currentQuestion.type
      );
      
      setEvaluation(result);
      
      if (result.classification === 'correct' || result.isCorrect) {
        const points = currentQuestion.points || 10;
        updateScore(points);
        setLevelScore(prev => prev + points);
        incrementStreak();
      } else if (result.classification === 'partially_correct') {
         // Partial credit logic
         const points = Math.floor((currentQuestion.points || 10) * (result.score / 100));
         updateScore(points);
         setLevelScore(prev => prev + points);
         resetStreak();
      } else {
        resetStreak();
      }

    } catch (e) {
      console.error(e);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < level.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setUserAnswer('');
      setEvaluation(null);
    } else {
      setCompleted(true);
      onLevelComplete(levelScore);
    }
  };

  if (completed) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200 p-8 text-center animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
          <Trophy className="w-10 h-10 text-yellow-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Level Complete!</h2>
        <p className="text-slate-600 mb-6">You earned {levelScore} points in this level.</p>
        <div className="text-sm text-slate-500">Select the next level from the list to continue.</div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-full min-h-[500px]">
      {/* Header */}
      <div className="bg-arcade-50 border-b border-arcade-100 p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-arcade-700 bg-arcade-100 px-2 py-1 rounded-md">
                Question {currentQuestionIndex + 1} / {level.questions.length}
            </span>
            <span className="text-xs text-slate-500 font-medium">
                {currentQuestion.type === 'multiple_choice' ? 'Multiple Choice' : 'Short Answer'}
            </span>
        </div>
        <div className="flex items-center gap-2 text-orange-500 font-bold">
            <Flame className={`w-4 h-4 ${streak > 0 ? 'fill-orange-500 animate-pulse' : ''}`} />
            <span>{streak}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex-1 overflow-y-auto">
        <h3 className="text-xl font-medium text-slate-800 mb-6 leading-relaxed">
            {currentQuestion.question}
        </h3>

        {/* Input Area */}
        <div className="mb-6 space-y-4">
            {currentQuestion.type === 'multiple_choice' && currentQuestion.options ? (
                <div className="grid grid-cols-1 gap-3">
                    {currentQuestion.options.map((option, idx) => {
                        const isSelected = userAnswer === option;
                        let btnClass = "text-left p-4 rounded-lg border-2 transition-all hover:bg-slate-50";
                        
                        if (evaluation) {
                            if (option === currentQuestion.correctAnswer || (evaluation.isCorrect && isSelected)) {
                                btnClass = "bg-green-50 border-green-500 text-green-800";
                            } else if (isSelected && !evaluation.isCorrect) {
                                btnClass = "bg-red-50 border-red-500 text-red-800";
                            } else {
                                btnClass = "border-slate-100 opacity-50";
                            }
                        } else {
                            btnClass = isSelected 
                                ? "border-arcade-500 bg-arcade-50 text-arcade-900 ring-1 ring-arcade-500" 
                                : "border-slate-200 hover:border-arcade-300";
                        }

                        return (
                            <button
                                key={idx}
                                onClick={() => !evaluation && setUserAnswer(option)}
                                disabled={!!evaluation || isEvaluating}
                                className={btnClass}
                            >
                                <span className="mr-3 font-bold opacity-60">{String.fromCharCode(65 + idx)}.</span>
                                {option}
                            </button>
                        );
                    })}
                </div>
            ) : (
                <textarea
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    disabled={!!evaluation || isEvaluating}
                    placeholder="Type your answer here..."
                    className="w-full h-32 p-4 rounded-lg border border-slate-300 focus:border-arcade-500 focus:ring-1 focus:ring-arcade-500 outline-none resize-none disabled:bg-slate-50 disabled:text-slate-500"
                />
            )}
        </div>

        {/* Feedback Area */}
        {evaluation && (
            <div className={`p-5 rounded-lg border mb-6 ${
                evaluation.classification === 'correct' || evaluation.isCorrect 
                    ? 'bg-green-50 border-green-200 text-green-900' 
                    : evaluation.classification === 'partially_correct'
                    ? 'bg-yellow-50 border-yellow-200 text-yellow-900'
                    : 'bg-red-50 border-red-200 text-red-900'
            }`}>
                <div className="flex items-center gap-2 font-bold mb-2">
                    {evaluation.classification === 'correct' || evaluation.isCorrect ? (
                        <>Correct! <span className="text-sm font-normal opacity-75">(+ {currentQuestion.points} pts)</span></>
                    ) : evaluation.classification === 'partially_correct' ? (
                        <>Close! <span className="text-sm font-normal opacity-75">({evaluation.score}/100)</span></>
                    ) : (
                        <>Incorrect</>
                    )}
                </div>
                <p className="text-sm leading-relaxed">{evaluation.feedback}</p>
                {evaluation.classification !== 'correct' && !evaluation.isCorrect && currentQuestion.correctAnswer && (
                     <div className="mt-3 text-xs opacity-80 border-t border-black/10 pt-2">
                        <strong>Reference:</strong> {currentQuestion.correctAnswer}
                     </div>
                )}
            </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
        {!evaluation ? (
            <button
                onClick={handleEvaluate}
                disabled={!userAnswer || isEvaluating}
                className="bg-arcade-600 hover:bg-arcade-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
                {isEvaluating ? <Loader2 className="animate-spin w-4 h-4" /> : null}
                Check Answer
            </button>
        ) : (
            <button
                onClick={handleNext}
                className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
                {currentQuestionIndex < level.questions.length - 1 ? 'Next Question' : 'Finish Level'}
                <ArrowRight className="w-4 h-4" />
            </button>
        )}
      </div>
    </div>
  );
};
