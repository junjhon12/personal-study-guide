import React, { useState } from 'react';
import type { Question } from '../types/studyGuide';

export default function QuestionCard({ question }: { question: Question}) {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div className='p-5 mb-5 bg-white border border-gray-200 rounded-xl shadow-sm'>
      <div className='flex items-center justify-between mb-5'>
        <span className='px-5 py-5 text-xs font-semibold text-blue-500 bg-blue-100 rounded-full'>
          {question.type.replace('_', ' ').toUpperCase()}
        </span>
      </div>
      <p className='mb-5 text-lg text-gray-800'>{question.questionText}</p>

      {/* Dynamic rendering based on discriminated unions */}
      {/** Multiple choice */}
      {question.type === 'multiple_choice' && (
        <div className='space-y-5 mb-5'>
          {question.options.map((option, idx) => (
            <button key={idx} className='w-full px-5 py-5 text-left border rounded-lg hover:bg-gray-50'>{option}</button>
          ))}
        </div>
      )}
      {/** Short answer */}
      {question.type === 'short_answer' && (
        <textarea className='w-full p-5 mb-5 border rounded-lg focus:ring-2 focus:ring-blue-500' rows={3} placeholder='Type your answer here...'/>
      )}
      {/* Explanation */}
      <button onClick={() => setShowAnswer(!showAnswer)} className='text-sm font-medium text-blue-500 hover:underline'>
        {showAnswer ? 'Hide Explanation' : 'Show Explanation'}
      </button>

      {showAnswer && (
        <div className="p-5 mt-5 text-sm text-gray-700 bg-gray-50 rounded-lg">
          <p className="font-semibold">Explanation:</p>
          <p>{question.explanation}</p>
        </div>
      )}
    </div>
  );
}