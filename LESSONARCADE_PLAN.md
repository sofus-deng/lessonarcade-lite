# LessonArcade Plan

LessonArcade transforms passive video watching into active learning through AI-generated "Arcade" levels.

## User Flows

### 1. Setup (Teacher/Learner)
- User inputs YouTube URL, title, description, audience, and difficulty.
- **Gemini Action:** `generateLessonPlan` analyzes this context to create a structured JSON object (`LessonProject`) containing levels and questions.

### 2. Play Mode (Learner)
- **View:** Split screen with video on left, active game panel on right.
- **Action:** User selects a level.
- **Action:** User answers questions (MCQ or Short Answer).
- **Gemini Action:** `evaluateAnswer` compares the user's input against the generated context/rubric. It returns a score, correctness flag, and encouraging feedback.
- **Progression:** Completing levels unlocks subsequent ones.

### 3. Build Mode (Teacher)
- **View:** Read-only inspection of the generated lesson plan (Levels, Questions, Answers).
- **Action:** Export the plan as a JSON file for sharing or backup.

## Core Components

- **App.tsx:** Manages global state (`LessonProject`, `PlaySession`, `Mode`).
- **SetupForm:** Handles initial data collection and triggers the generation.
- **VideoPlayer:** Embeds the YouTube iframe.
- **ArcadePanel:** The "Game Loop" – displays questions, accepts input, calls evaluation service, shows feedback.
- **LevelList:** Sidebar navigation.
- **BuilderPanel:** A dashboard view for inspecting the AI-generated content.

## Gemini Integration

**Model:** `gemini-3-pro-preview` is used for both generation and evaluation to ensure high-quality reasoning and structured JSON output.

- **Generation:** Uses a system instruction to act as an "Educational Designer". Output is strictly enforced via `responseSchema`.
- **Evaluation:** Acts as a "Coach". It takes the question, user answer, and reference answer to produce a graded JSON result.

## Future Improvements
- Add persistent storage (LocalStorage or Database).
- Allow editing questions directly in Build Mode.
- Add "Hint" functionality using Gemini.
