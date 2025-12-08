import { GoogleGenAI, Type, Schema } from "@google/genai";
import { LessonProject, EvaluationResult, Audience, Difficulty } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// -- Schemas --

const questionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    type: { type: Type.STRING, enum: ["multiple_choice", "short_answer"] },
    question: { type: Type.STRING },
    options: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "Provide 4 options if type is multiple_choice. Empty if short_answer."
    },
    correctAnswer: { type: Type.STRING, description: "The correct option or a grading rubric/key facts for short answers." },
    explanation: { type: Type.STRING, description: "Why the answer is correct." },
    points: { type: Type.INTEGER, description: "Suggest points (e.g. 10 or 20)." }
  },
  required: ["id", "type", "question", "correctAnswer", "explanation", "points"]
};

const levelSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    timeRangeStart: { type: Type.STRING, description: "Optional timestamp e.g. '00:00'" },
    questions: {
      type: Type.ARRAY,
      items: questionSchema
    }
  },
  required: ["id", "title", "description", "questions"]
};

const lessonPlanSchema: Schema = {
  type: Type.ARRAY,
  items: levelSchema
};

const evaluationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    isCorrect: { type: Type.BOOLEAN },
    score: { type: Type.INTEGER, description: "0-100" },
    classification: { type: Type.STRING, enum: ["correct", "partially_correct", "incorrect"] },
    feedback: { type: Type.STRING, description: "Coaching feedback or explanation." }
  },
  required: ["isCorrect", "score", "classification", "feedback"]
};

// -- Public Methods --

export async function generateLessonPlan(
  videoUrl: string,
  videoTitle: string,
  videoDescription: string,
  audience: Audience,
  difficulty: Difficulty
): Promise<LessonProject> {
  const model = "gemini-3-pro-preview"; // Using Pro for complex reasoning

  const prompt = `
    You are an expert educational designer. Create a structured interactive lesson plan based on the following YouTube video context.
    
    Video URL: ${videoUrl}
    Title: ${videoTitle}
    Description: ${videoDescription}
    Target Audience: ${audience}
    Difficulty: ${difficulty}

    Instructions:
    1. Break the lesson into 3-5 distinct "Levels" representing logical progressions in the topic.
    2. For each level, generate 2-3 quiz questions. Mix multiple_choice and short_answer types.
    3. Ensure the content is appropriate for the target audience and difficulty.
    4. Return ONLY the JSON object for the list of levels.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: lessonPlanSchema,
        systemInstruction: "You are a precise JSON generator for educational content.",
      },
    });

    const levels = JSON.parse(response.text || "[]");
    
    return {
      id: crypto.randomUUID(),
      videoUrl,
      videoTitle,
      videoDescription,
      audience,
      difficulty,
      levels
    };
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw new Error("Failed to generate lesson plan. Please try again.");
  }
}

export async function evaluateAnswer(
  questionText: string,
  userAnswer: string,
  correctAnswerContext: string,
  questionType: 'multiple_choice' | 'short_answer'
): Promise<EvaluationResult> {
  const model = "gemini-3-pro-preview";

  const prompt = `
    Evaluate the student's answer.
    
    Question: "${questionText}"
    Student Answer: "${userAnswer}"
    Reference/Correct Answer/Rubric: "${correctAnswerContext}"
    Type: ${questionType}

    Task:
    - If multiple_choice, check if the answer matches the reference.
    - If short_answer, score correctness 0-100 based on the reference rubric.
    - Provide helpful, encouraging, but concise feedback.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: evaluationSchema,
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Evaluation Error:", error);
    // Fallback error result
    return {
      isCorrect: false,
      score: 0,
      classification: "incorrect",
      feedback: "We couldn't evaluate your answer due to a connection error. Please try again."
    };
  }
}
