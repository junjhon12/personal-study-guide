import React, { useState, useEffect } from "react";
import UploadZone from "../components/UploadContent";
import QuestionCard from "../components/QuestionCard";
import type { StudyGuide, Question } from "../types/studyGuide";

export default function Dashboard() {
  const [completedFileKey, setCompletedFileKey] = useState<string | null>(null);
  const [studyGuide, setStudyGuide] = useState<StudyGuide | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Automatically fetch the study guide data once the upload and AI processing complete
  useEffect(() => {
    if (!completedFileKey) return;

    const fetchStudyGuide = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/dev';
        const response = await fetch(`${apiUrl}/study-guide/${encodeURIComponent(completedFileKey)}`);
        
        if (!response.ok) throw new Error('Failed to load study guide data.');
        
        const data = await response.json();
        
        // Parse the AI-generated JSON string into the strict TypeScript interface
        const parsedGuide: StudyGuide = JSON.parse(data.studyGuide);
        setStudyGuide(parsedGuide);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to parse study guide.';
        setError(errorMessage);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudyGuide();
  }, [completedFileKey]);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="px-5 py-5 mx-auto max-w-5xl sm:px-10 lg:px-15">
          <h1 className="text-2xl font-bold text-gray-500">My Personal Study Guide Gen.</h1>
        </div>
      </header>
      <main className="px-5 py-10 mx-auto max-w-7xl sm:px-10 lg:px-15">
        
        {!completedFileKey ? (
          <div className="mb-10">
            <h2 className="mb-5 text-xl font-semibold text-gray-500">Upload Course Material</h2>
            {/* Pass a callback to the UploadZone to receive the fileKey upon completion */}
            <UploadZone onUploadComplete={(fileKey: string) => setCompletedFileKey(fileKey)} />
          </div>
        ) : (
          <div className="p-5 bg-white border border-gray-300 rounded-xl">
            <h2 className="mb-5 text-xl font-semibold text-gray-500">
              {studyGuide?.title || "Your Study Space"}
            </h2>
            
            {isLoading && <p className="text-blue-500 animate-pulse">Loading your custom study guide...</p>}
            {error && <p className="text-red-500">{error}</p>}
            
            {studyGuide && (
              <div className="mt-8 space-y-6">
                {studyGuide.questions.map((question: Question) => (
                  <QuestionCard key={question.id} question={question} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}