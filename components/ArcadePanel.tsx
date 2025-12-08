
import React, { useState, useEffect } from 'react';
import { LessonLevel, EvaluationResult } from '../types';
import { evaluateAnswer } from '../services/geminiService';
import { Trophy, Flame, ArrowRight, Loader2, Sparkles, HelpCircle } from 'lucide-react';

interface ArcadePanelProps {
  level: LessonLevel;
  isLastLevel: boolean;
  onLevelComplete: (score: number, correctCount: number, totalQuestions: number) => void;
  updateScore: (points: number) => void;
  streak: number;
  incrementStreak: () => void;
  resetStreak: () => void;
}

const DonutChart: React.FC<{ correct: number; total: number }> = ({ correct, total }) => {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const percentage = total > 0 ? correct / total : 0;
  const strokeDashoffset = circumference - percentage * circumference;
  
  // Color based on percentage
  const color = percentage >= 0.8 ? 'text-green-500' : percentage >= 0.5 ? 'text-yellow-500' : 'text-red-500';

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 36 36">
        {/* Background Circle */}
        <path
          className="text-slate-200"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        />
        {/* Progress Circle */}
        <path
          className={`${color} transition-all duration-1000 ease-out`}
          strokeDasharray={`${circumference}, ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
         <span className={`text-xl font-bold ${color}`}>{Math.round(percentage * 100)}%</span>
      </div>
    </div>
  );
};

export const ArcadePanel: React.FC<ArcadePanelProps> = ({ 
  level, 
  isLastLevel,
  onLevelComplete, 
  updateScore,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  
  // Level Local State
  const [levelScore, setLevelScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [stats, setStats] = useState({
    correct: 0,
    incorrect: 0,
    maxStreak: 0,
    currentStreak: 0
  });

  // Reset state when level changes
  useEffect(() => {
    setCurrentQuestionIndex(0);
    setUserAnswer('');
    setEvaluation(null);
    setLevelScore(0);
    setCompleted(false);
    setStats({ correct: 0, incorrect: 0, maxStreak: 0, currentStreak: 0 });
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
      
      let points = 0;
      let isAnswerCorrect = false;

      if (result.classification === 'correct' || result.isCorrect) {
        points = currentQuestion.points || 10;
        isAnswerCorrect = true;
      } else if (result.classification === 'partially_correct') {
         points = Math.floor((currentQuestion.points || 10) * (result.score / 100));
      }

      // Update Scores
      updateScore(points);
      setLevelScore(prev => prev + points);

      // Update Stats & Streak
      setStats(prev => {
        const newCurrentStreak = isAnswerCorrect ? prev.currentStreak + 1 : 0;
        return {
            correct: isAnswerCorrect ? prev.correct + 1 : prev.correct,
            incorrect: !isAnswerCorrect ? prev.incorrect + 1 : prev.incorrect,
            currentStreak: newCurrentStreak,
            maxStreak: Math.max(prev.maxStreak, newCurrentStreak)
        };
      });

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
      // Pass stats up to parent
      const totalQ = level.questions.length;
      onLevelComplete(levelScore, stats.correct, totalQ);
    }
  };

  if (completed) {
    const accuracy = Math.round((stats.correct / level.questions.length) * 100);
    let message = "Nice work. Consider reviewing this level to improve your score.";
    if (accuracy >= 80) message = "Great job! You're ready for the next level.";
    else if (accuracy === 100) message = "Perfect score! You've mastered this section.";

    return (
      <div className="h-full flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 p-8 text-center animate-in fade-in zoom-in duration-300 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-white opacity-50"></div>
        <div className="relative z-10 w-full max-w-md">
          <div className="flex items-center justify-center mb-6">
             <DonutChart correct={stats.correct} total={level.questions.length} />
          </div>
          
          <h2 className="text-3xl font-black text-slate-900 mb-2">Level Complete!</h2>
          <p className="text-slate-600 mb-6 font-medium">
             You answered {stats.correct} out of {level.questions.length} questions correctly.
          </p>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-xs font-bold text-slate-400 uppercase mb-1">Points Earned</div>
                  <div className="text-2xl font-black text-arcade-600">+{levelScore}</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-xs font-bold text-slate-400 uppercase mb-1">Best Streak</div>
                  <div className="text-2xl font-black text-orange-500 flex items-center justify-center gap-1">
                      <Flame className="w-5 h-5 fill-orange-500" /> {stats.maxStreak}
                  </div>
              </div>
          </div>

          <p className="text-sm text-slate-500 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 mb-6 italic">
             "{message}"
          </p>

          <div className="text-sm font-medium text-slate-400">
            {isLastLevel ? "Select 'Finish Course' to see your final results." : "Select the next level to continue."}
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-50/50 via-purple-50/50 to-pink-50/50 rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/40 flex flex-col h-full min-h-[500px] overflow-hidden relative">
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
        
        {/* Streak Chip */}
        <div 
            className="flex items-center gap-1.5 text-orange-600 font-bold bg-orange-50 px-3 py-1 rounded-full border border-orange-100 shadow-sm cursor-help transition-transform hover:scale-105"
            title="Your current streak of correct answers in this level."
        >
            <div className={`p-1 bg-white rounded-full shadow-sm ${stats.currentStreak > 0 ? 'animate-pulse' : ''}`}>
                <Flame className={`w-3.5 h-3.5 ${stats.currentStreak > 0 ? 'fill-orange-500 text-orange-500' : 'text-slate-300'}`} />
            </div>
            <span className="text-sm">Streak {stats.currentStreak}</span>
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
                {currentQuestionIndex < level.questions.length - 1 
                    ? 'Next Question' 
                    : isLastLevel ? 'Finish Course' : 'Finish Level'}
                <ArrowRight className="w-4 h-4" />
            </button>
        )}
      </div>
    </div>
  );
};
