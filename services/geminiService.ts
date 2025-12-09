import { GoogleGenAI, Type, Schema, GenerateContentResponse } from "@google/genai";
import { LessonProject, EvaluationResult, Audience, Difficulty } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// -- Constants --
// Default to the most capable model for best reasoning and content quality.
const PRIMARY_MODEL_ID = "gemini-3-pro-preview";
// Fallback to Flash if we hit rate limits (429) or temporary overload (503).
const FALLBACK_MODEL_ID = "gemini-2.5-flash";

// -- Helper: Retry Logic --

async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 1000
): Promise<T> {
  let attempt = 0;

  while (true) {
    try {
      return await operation();
    } catch (err: any) {
      const status = err?.status || err?.response?.status;
      const code = err?.code || err?.error?.code;
      const message = err?.message || '';

      const isRateLimit =
        status === "RESOURCE_EXHAUSTED" ||
        status === 429 ||
        code === 429 ||
        message.includes('429') ||
        message.includes('quota') ||
        message.includes('RESOURCE_EXHAUSTED');

      const isServerOverload =
        status === "UNAVAILABLE" ||
        status === 503 ||
        code === 503 ||
        message.includes('503');

      // If we've exhausted retries OR it's a non-retryable error, throw.
      if (attempt >= maxRetries || (!isRateLimit && !isServerOverload)) {
        throw err;
      }

      const delay = baseDelayMs * Math.pow(2, attempt);
      console.warn(`[Gemini Retry] Attempt ${attempt + 1} failed (${status || code}). Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      attempt += 1;
    }
  }
}

// -- Helper: Fallback Logic --

async function callModelWithFallback(
  callWithModel: (modelId: string) => Promise<GenerateContentResponse>
): Promise<GenerateContentResponse> {
  try {
    // 1. Try Primary Model (with its own retries)
    return await withRetry(() => callWithModel(PRIMARY_MODEL_ID));
  } catch (err: any) {
    const status = err?.status || err?.response?.status;
    const code = err?.code || err?.error?.code;
    const message = err?.message || '';

    const isRateLimit =
      status === "RESOURCE_EXHAUSTED" ||
      status === 429 ||
      code === 429 ||
      message.includes('429') ||
      message.includes('quota') ||
      message.includes('RESOURCE_EXHAUSTED');

    const isServerOverload =
      status === "UNAVAILABLE" ||
      status === 503 ||
      code === 503;

    // 2. Only fallback if we hit a Rate Limit or Overload
    if (isRateLimit || isServerOverload) {
      console.warn(
        `[LessonArcade Lite] Primary model (${PRIMARY_MODEL_ID}) exhausted or overloaded. Falling back to ${FALLBACK_MODEL_ID}.`
      );
      // Try Fallback Model (with its own retries)
      return await withRetry(() => callWithModel(FALLBACK_MODEL_ID));
    }

    // Otherwise, rethrow (e.g., bad request, invalid prompt, etc.)
    throw err;
  }
}

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
    const response = await callModelWithFallback((modelId) => ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: lessonPlanSchema,
        systemInstruction: "You are a precise JSON generator for educational content.",
      },
    }));

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
    const response = await callModelWithFallback((modelId) => ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: evaluationSchema,
      },
    }));

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

export async function generateVideoSummary(
  videoTitle: string,
  authorName: string,
  audience: Audience,
  difficulty: Difficulty
): Promise<string> {
  const prompt = `
    You are an educational content curator. 
    Analyze the following video metadata to help prepare a lesson plan:
    Title: "${videoTitle}"
    Channel: "${authorName}"
    Target Audience: ${audience}
    Difficulty: ${difficulty}

    Write a short, engaging 2-3 sentence summary explaining what a learner will gain from this lesson.
    Focus on learning outcomes.
    Return ONLY the plain text summary.
  `;

  try {
    const response = await callModelWithFallback((modelId) => ai.models.generateContent({
      model: modelId,
      contents: prompt,
    }));
    return response.text?.trim() || "";
  } catch (error) {
    console.error("Gemini Summary Error:", error);
    return "";
  }
}