import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import type { Readable } from "node:stream"; 
import type { S3Event, S3Handler } from "aws-lambda";
import pdfParse from "pdf-parse"; 

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

    // Call pdfParse directly as a function
    const parsePdf = await pdfParse(pdfBuffer);
    const rawText = parsePdf.text;

    console.log(`Successfully extracted ${rawText.length} characters from PDF.`);

    // Note: S3 event triggers do not return HTTP responses. 
    // The process simply finishes or passes data to the next service (like your AI API or Database).

  } catch (error) {
    console.error("Error processing PDF in Lambda pipeline:", error);
    throw error;
  }
};