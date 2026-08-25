import OpenAi from "openai";
import type { StudyGuide } from "../types/studyGuide";

const openai = new OpenAi({
  baseURL: "https://api.deepseek.com",
  apiKey: process.env.DEEPSEEK_API_KEY,
});

export async function generateStudyGuideWithDeepSeek(
  extractedText: string,
  fileName: string
): Promise<StudyGuide> {
  const systemPrompt = `
  You are an expert academic tutor. Analyze the provided textbook text and generate a structured study guide.
You must return ONLY a raw JSON object with NO markdown formatting (no \`\`\`json wrappers).

The JSON object must match this schema:
{
  "id": "string (unique uuid)",
  "title": "string (topic or chapter title)",
  "originalFileName": "${fileName}",
  "createdAt": "string (ISO date)",
  "sections": [
    {
      "chapterTitle": "string",
      "summary": "string",
      "keyTerms": [
        { "term": "string", "definition": "string" }
      ]
    }
  ],
  "questions": [
    {
      "id": "string",
      "type": "multiple_choice",
      "questionText": "string",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "string (exact match to one of the options)",
      "explanation": "string"
    },
    {
      "id": "string",
      "type": "short_answer",
      "questionText": "string",
      "sampleAnswer": "string",
      "explanation": "string"
    }
  ]
}
  `;

  const userPrompt = `Extract key concepts and build practice questions from the following text:\n\n${extractedText}`;

  const response = await openai.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      {role: "system", content: systemPrompt},
      { role: "user", content: userPrompt }, 
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const content = response.choices[0]?.message.content;

  if (!content) {
    throw new Error("Failed to recieve output from DeepSeek AI.")
  }

  return JSON.parse(content) as StudyGuide;
}