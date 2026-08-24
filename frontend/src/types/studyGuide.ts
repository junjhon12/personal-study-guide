// Types of practice questions
export type QuestionType = 'multiple_choice' | 'short_answer' | 'true_or_false' | 'matching' | 'fill_in_the_blank';

// Blueprint for the Base Question
export interface BaseQuestion {
  id: string;
  type: QuestionType;
  questionText: string;
  explanation: string;
}

// Multiple choice questions blueprint
export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple_choice';
  options: string[];
  correctAnswer: string;
}

// Short Answer questions blueprint
export interface ShortAnswerQuestion extends BaseQuestion {
  type: 'short_answer';
  sampleAnswer: string;
}

// Seperate union for dynamic rendering
export type Question = MultipleChoiceQuestion | ShortAnswerQuestion;

// Chapter/Section breakdown pf the study guide
export interface StudyGuideSection {
  chapterTitle: string;
  summary: string;
  keyTerms: {term: string; definition: string}[];
}

// Main study guide object
export interface StudyGuide {
  id: string;
  title: string;
  originalFileName: string;
  sections: StudyGuideSection[];
  questions: Question[];
}

// API Request/Response types for tracking upload state
export interface UploadResponse {
  uploadURL : string;
  fileKey: string;
}

// Response status
export interface ProcessingStatusResponse {
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | "FAILED";
  studyGuideId?: string;
  error?: string;
}