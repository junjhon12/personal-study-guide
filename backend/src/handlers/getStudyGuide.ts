import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client outside the handler to optimize connection reuse during warm starts
const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_KEY as string
);

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const fileKey = event.pathParameters?.fileKey;
    
    if (!fileKey) {
      throw new Error('A valid fileKey is required to retrieve the study guide.');
    }

    // Query the database for the specific study guide using the decoded file key
    const { data, error } = await supabase
      .from('study_guides')
      .select('content')
      .eq('file_key', decodeURIComponent(fileKey))
      .single();

    if (error) throw new Error(`Database query failed: ${error.message}`);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ studyGuide: data?.content }),
    };
  } catch (error: unknown) {
    // Type narrowing safely extracts the error message without relying on the 'any' type
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: errorMessage }),
    };
  }
};