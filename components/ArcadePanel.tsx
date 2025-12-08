import React, { useState, useEffect } from 'react';
import { LessonLevel, QuizQuestion, EvaluationResult } from '../types';
import { evaluateAnswer } from '../services/geminiService';
import { Trophy, Flame, ArrowRight, RefreshCcw, Loader2, Sparkles, HelpCircle } from 'lucide-react';

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
      <div className="h-full flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 p-8 text-center animate-in fade-in zoom-in duration-300 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 to-orange-50 opacity-50"></div>
        <div className="relative z-10">
          <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-6 mx-auto shadow-lg shadow-yellow-200/50 ring-4 ring-white">
            <Trophy className="w-12 h-12 text-yellow-500 animate-bounce" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">Level Complete!</h2>
          <p className="text-slate-600 mb-8 text-lg">You earned <span className="font-bold text-arcade-600">{levelScore} points</span> in this level.</p>
          <div className="text-sm font-medium text-slate-400 bg-slate-50 px-4 py-2 rounded-full inline-block">Select the next level to continue</div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-50/50 via-purple-50/50 to-pink-50/50 rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/40 flex flex-col h-full min-h-[500px] overflow-hidden relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#6d28d9 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
      
      {/* Header */}
      <div className="relative z-10 bg-white/40 backdrop-blur-sm border-b border-white/50 p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-arcade-100/80 text-arcade-700 px-3 py-1.5 rounded-full border border-arcade-200 shadow-sm">
                <HelpCircle className="w-3.5 h-3.5" />
                <span className="text-xs font-bold uppercase tracking-wider">
                   Question {currentQuestionIndex + 1} / {level.questions.length}
                </span>
            </div>
            <span className="text-xs text-slate-500 font-medium bg-white/50 px-2 py-1 rounded-md border border-white">
                {currentQuestion.type === 'multiple_choice' ? 'Multiple Choice' : 'Short Answer'}
            </span>
        </div>
        <div className="flex items-center gap-1.5 text-orange-500 font-black bg-orange-50 px-3 py-1 rounded-full border border-orange-100 shadow-sm">
            <Flame className={`w-4 h-4 ${streak > 0 ? 'fill-orange-500 animate-pulse' : ''}`} />
            <span>{streak}</span>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 flex-1 overflow-y-auto">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-white/60 mb-6">
            <h3 className="text-xl font-medium text-slate-800 leading-relaxed">
                {currentQuestion.question}
            </h3>
        </div>

        {/* Input Area */}
        <div className="mb-6 space-y-4">
            {currentQuestion.type === 'multiple_choice' && currentQuestion.options ? (
                <div className="grid grid-cols-1 gap-3">
                    {currentQuestion.options.map((option, idx) => {
                        const isSelected = userAnswer === option;
                        const letter = String.fromCharCode(65 + idx);
                        
                        let cardClass = "group w-full text-left p-3 rounded-xl border-2 transition-all duration-200 flex items-start gap-4 relative overflow-hidden ";
                        let badgeClass = "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ";
                        
                        if (evaluation) {
                            if (option === currentQuestion.correctAnswer || (evaluation.isCorrect && isSelected)) {
                                cardClass += "bg-green-50 border-green-400 shadow-sm";
                                badgeClass += "bg-green-500 text-white";
                            } else if (isSelected && !evaluation.isCorrect) {
                                cardClass += "bg-red-50 border-red-400 shadow-sm";
                                badgeClass += "bg-red-500 text-white";
                            } else {
                                cardClass += "bg-white/40 border-slate-200 opacity-60";
                                badgeClass += "bg-slate-100 text-slate-400";
                            }
                        } else {
                            if (isSelected) {
                                cardClass += "bg-arcade-50 border-arcade-500 shadow-md scale-[1.01]";
                                badgeClass += "bg-arcade-500 text-white shadow-sm";
                            } else {
                                cardClass += "bg-white/60 border-white hover:border-arcade-300 hover:bg-white hover:shadow-sm hover:scale-[1.01]";
                                badgeClass += "bg-slate-100 text-slate-500 group-hover:bg-arcade-100 group-hover:text-arcade-600";
                            }
                        }

                        return (
                            <button
                                key={idx}
                                onClick={() => !evaluation && setUserAnswer(option)}
                                disabled={!!evaluation || isEvaluating}
                                className={cardClass}
                            >
                                <div className={badgeClass}>{letter}</div>
                                <span className={`pt-1 font-medium ${isSelected || (evaluation && option === currentQuestion.correctAnswer) ? 'text-slate-900' : 'text-slate-600'}`}>
                                    {option}
                                </span>
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
                    className="w-full h-32 p-5 rounded-2xl border-2 border-slate-200 bg-white/80 focus:bg-white focus:border-arcade-500 focus:ring-4 focus:ring-arcade-500/10 outline-none resize-none disabled:bg-slate-50 disabled:text-slate-500 transition-all text-lg font-medium"
                />
            )}
        </div>

        {/* Feedback Area */}
        {evaluation && (
            <div className={`p-5 rounded-2xl border-2 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ${
                evaluation.classification === 'correct' || evaluation.isCorrect 
                    ? 'bg-green-50/90 border-green-200 text-green-900' 
                    : evaluation.classification === 'partially_correct'
                    ? 'bg-yellow-50/90 border-yellow-200 text-yellow-900'
                    : 'bg-red-50/90 border-red-200 text-red-900'
            }`}>
                <div className="flex items-center gap-2 font-bold mb-2">
                    {evaluation.classification === 'correct' || evaluation.isCorrect ? (
                        <><Sparkles className="w-5 h-5" /> Correct! <span className="text-sm font-normal opacity-75">(+ {currentQuestion.points} pts)</span></>
                    ) : evaluation.classification === 'partially_correct' ? (
                        <>Close! <span className="text-sm font-normal opacity-75">({evaluation.score}/100)</span></>
                    ) : (
                        <>Incorrect</>
                    )}
                </div>
                <p className="text-sm leading-relaxed font-medium opacity-90">{evaluation.feedback}</p>
                {evaluation.classification !== 'correct' && !evaluation.isCorrect && currentQuestion.correctAnswer && (
                     <div className="mt-3 text-xs bg-black/5 p-3 rounded-lg border border-black/5">
                        <strong className="block mb-1 opacity-70 uppercase tracking-wider text-[10px]">Reference Answer</strong>
                        {currentQuestion.correctAnswer}
                     </div>
                )}
            </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="relative z-10 p-4 border-t border-white/50 bg-white/60 backdrop-blur-md flex justify-end">
        {!evaluation ? (
            <button
                onClick={handleEvaluate}
                disabled={!userAnswer || isEvaluating}
                className="bg-gradient-to-r from-arcade-600 to-arcade-500 hover:from-arcade-500 hover:to-arcade-400 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-arcade-500/20 hover:scale-[1.02] active:scale-[0.98]"
            >
                {isEvaluating ? <Loader2 className="animate-spin w-4 h-4" /> : null}
                Check Answer
            </button>
        ) : (
            <button
                onClick={handleNext}
                className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            >
                {currentQuestionIndex < level.questions.length - 1 ? 'Next Question' : 'Finish Level'}
                <ArrowRight className="w-4 h-4" />
            </button>
        )}
      </div>
    </div>
  );
};