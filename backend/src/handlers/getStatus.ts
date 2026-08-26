import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { supabase } from "../utils/supabase";
import type { ProcessingStatusResponse } from "../types/studyGuide";

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const fileKey = event.pathParameters?.fileKey;
    
    if (!fileKey) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Missing fileKey parameter" }),
      };
    }

    const decodedKey = decodeURIComponent(fileKey);

    // Query Supabase using the SDK
    const { data, error } = await supabase
      .from("study_guides")
      .select("id, status")
      .eq("file_key", decodedKey)
      .single();

    let responsePayload: ProcessingStatusResponse;

    if (error || !data) {
      // If no record exists yet, the S3 event is still processing
      responsePayload = { status: "PROCESSING" };
    } else {
      responsePayload = {
        status: data.status as ProcessingStatusResponse["status"],
        studyGuideId: data.id,
      };
    }

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(responsePayload),
    };
  } catch (error) {
    console.error("Error fetching study guide status:", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};