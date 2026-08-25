import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

const s3 = new S3Client({ region: process.env.AWS_REGION || "us-east-1"});
const BUCKET_NAME = process.env.UPLOAD_BUCKET_NAME!;

export const handler = async (event: unknown) => {
  try {
    // Generate unique filek ey for the uploaded PDF
    const fileId = uuidv4();
    const fileKey = 'uploads/${fileId}.pdf';

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      ContentType: "application/pdf",
    });

    // Generate temporary URL
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300});

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*"},
      body: JSON.stringify({ uploadUrl, fileKey }),
    };
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not generate upload URL"}),
    };
  }
};