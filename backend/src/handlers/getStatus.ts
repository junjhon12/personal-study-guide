import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { pool } from "../utils/db";
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

    // Query the database for the file processing status
    const query = "SELECT id, status FROM study_guides WHERE file_key = $1";
    const result = await pool.query(query, [decodeURIComponent(fileKey)]);

    let responsePayload: ProcessingStatusResponse;

    if (result.rows.length === 0) {
      // If the S3 processing Lambda hasn't finished inserting the record yet, it is still processing
      responsePayload = { status: "PROCESSING" };
    } else {
      const row = result.rows[0];
      responsePayload = {
        status: row?.status as ProcessingStatusResponse["status"],
        studyGuideId: row?.id,
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