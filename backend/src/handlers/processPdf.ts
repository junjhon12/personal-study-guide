import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import type { Readable } from "node:stream"; 
import type { S3Event, S3Handler } from "aws-lambda";
import pdfParse from "pdf-parse";
import { generateStudyGuideWithDeepSeek } from "../services/deepseekService";

const s3 = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });

export const handler: S3Handler = async (event: S3Event): Promise<void> => {
  try {
    const record = event.Records[0];
    if (!record) {
      throw new Error("No S3 record found in payload event.");
    }

    const bucketName = record.s3.bucket.name;
    const fileKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));
    console.log(`Processing file: ${fileKey} from bucket: ${bucketName}`);

    // 1. Fetch PDF from S3
    const getObjectCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
    });

    const s3Response = await s3.send(getObjectCommand);
    const stream = s3Response.Body as Readable;

    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk as Uint8Array));
    }
    const pdfBuffer = Buffer.concat(chunks);

    // 2. Extract raw text from PDF
    const parsePdf = await pdfParse(pdfBuffer);
    const rawText = parsePdf.text;
    console.log(`Successfully extracted ${rawText.length} characters from PDF.`);

    // 3. Step 4: Send extracted text to DeepSeek AI service
    const studyGuide = await generateStudyGuideWithDeepSeek(rawText, fileKey);
    console.log("Successfully generated study guide via DeepSeek:", studyGuide.title);

    // 4. Save to PostgreSQL
    const insertQuery = `
      INSERT INTO study_guides (id, file_key, title, status, data)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO NOTHING
    `;
    
    const values = [
      studyGuide.id,
      fileKey,
      studyGuide.title,
      "COMPLETED", // Maps to your ProcessingStatusResponse[cite: 11]
      JSON.stringify(studyGuide) // Saved natively as JSONB in Postgres
    ];

    await pool.query(insertQuery, values);
    console.log(`Successfully saved study guide ${studyGuide.id} to database.`);

  } catch (error) {
    // If an error occurs, we should ideally log a 'FAILED' status to the DB here so the frontend knows to stop polling
    console.error("Error processing PDF in Lambda pipeline:", error);
    throw error;
  }
};