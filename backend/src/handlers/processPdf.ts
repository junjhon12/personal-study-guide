import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import type { S3Event } from 'aws-lambda';
import { createClient } from '@supabase/supabase-js';

// Utilizes require syntax to bypass esbuild's ESM default export strictness for this specific CommonJS package
import pdfParse = require('pdf-parse');

// Initialize clients outside the handler to leverage connection reuse during warm starts
// Providing a fallback region satisfies strict type safety requirements
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const supabase = createClient(
  process.env.SUPABASE_URL as string, 
  process.env.SUPABASE_KEY as string
);

export const handler = async (event: S3Event): Promise<void> => {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    try {
      // Retrieve the uploaded PDF object from S3
      const getCommand = new GetObjectCommand({ Bucket: bucket, Key: key });
      const { Body } = await s3Client.send(getCommand);
      if (!Body) throw new Error('Empty body returned from S3');

      const buffer = Buffer.from(await Body.transformToByteArray());
      
      // Extract text content from the PDF buffer
      const pdfData = await pdfParse(buffer);
      const textContent = pdfData.text;

      // System prompt defines the strict JSON structure required by the frontend dashboard
      const systemPrompt = `You are an expert tutor. Analyze the following text and generate a study guide in raw JSON format. 
      The JSON must strictly follow this structure:
      {
        "title": "Document Title",
        "sections": [{ "chapterTitle": "...", "summary": "...", "keyTerms": [{ "term": "...", "definition": "..." }] }],
        "questions": [
          { "id": "1", "type": "multiple_choice", "questionText": "...", "explanation": "...", "options": ["A", "B", "C", "D"], "correctAnswer": "A" },
          { "id": "2", "type": "short_answer", "questionText": "...", "explanation": "...", "sampleAnswer": "..." }
        ]
      }
      Ensure the JSON is valid and contains no markdown code blocks.`;

      // Request study guide generation from the DeepSeek API
      const aiResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Extract a study guide from this text: ${textContent}` }
          ],
          response_format: { type: 'json_object' }
        })
      });

      if (!aiResponse.ok) throw new Error('DeepSeek API request failed');
      
      // Define expected response shape to safely extract data
      type DeepSeekResponse = { choices: { message: { content: string } }[] };
      const aiData = await aiResponse.json() as DeepSeekResponse;

      // Optional chaining securely extracts the response, mitigating potential undefined object errors
      const generatedContent = aiData?.choices?.[0]?.message?.content;
      if (!generatedContent) throw new Error('AI response did not contain valid content');

      // Persist the generated study guide into the PostgreSQL database
      const { error: dbError } = await supabase
        .from('study_guides')
        .update({ 
          content: generatedContent, 
          status: 'COMPLETED' 
        })
        .eq('file_key', key);

      if (dbError) throw new Error(`Database error: ${dbError.message}`);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Processing failed for ${key}:`, errorMessage);

      // Flag the record as failed so the frontend polling mechanism registers the error
      await supabase
        .from('study_guides')
        .update({ status: 'FAILED', error_message: errorMessage })
        .eq('file_key', key);
    }
  }
};