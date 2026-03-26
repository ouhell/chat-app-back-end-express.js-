import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { ENV } from "../config/env";

const DEFAULT_AWS_REGION = "YOUR_AWS_REGION";
const DEFAULT_AWS_ACCESS_KEY_ID = "YOUR_AWS_ACCESS_KEY_ID";
const DEFAULT_AWS_SECRET_ACCESS_KEY = "YOUR_AWS_SECRET_ACCESS_KEY";
const DEFAULT_AWS_BUCKET_NAME = "YOUR_AWS_BUCKET_NAME";

const AWS_REGION = ENV.AWS_REGION || DEFAULT_AWS_REGION;
const AWS_ACCESS_KEY_ID = ENV.AWS_ACCESS_KEY_ID || DEFAULT_AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY =
  ENV.AWS_SECRET_ACCESS_KEY || DEFAULT_AWS_SECRET_ACCESS_KEY;
const AWS_S3_BUCKET_NAME = ENV.AWS_S3_BUCKET_NAME || DEFAULT_AWS_BUCKET_NAME;
const AWS_S3_ENDPOINT = ENV.AWS_S3_ENDPOINT?.trim();
const AWS_S3_FORCE_PATH_STYLE =
  (ENV.AWS_S3_FORCE_PATH_STYLE || "true").toLowerCase() === "true";

const s3ClientConfig: ConstructorParameters<typeof S3Client>[0] = {
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
};

if (AWS_S3_ENDPOINT) {
  s3ClientConfig.endpoint = AWS_S3_ENDPOINT;
  s3ClientConfig.forcePathStyle = AWS_S3_FORCE_PATH_STYLE;
}

export const s3Client = new S3Client(s3ClientConfig);

type UploadToS3Input = {
  key: string;
  body: Buffer;
  contentType: string;
  metadata?: Record<string, string>;
};

const getPublicObjectUrl = (key: string) => {
  const encodedKey = key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  if (AWS_S3_ENDPOINT) {
    const normalizedEndpoint = AWS_S3_ENDPOINT.replace(/\/+$/, "");

    if (AWS_S3_FORCE_PATH_STYLE) {
      return `${normalizedEndpoint}/${AWS_S3_BUCKET_NAME}/${encodedKey}`;
    }

    const url = new URL(normalizedEndpoint);
    url.hostname = `${AWS_S3_BUCKET_NAME}.${url.hostname}`;
    url.pathname = `/${encodedKey}`;
    return url.toString();
  }

  if (AWS_REGION === "us-east-1") {
    return `https://${AWS_S3_BUCKET_NAME}.s3.amazonaws.com/${encodedKey}`;
  }

  return `https://${AWS_S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${encodedKey}`;
};

export async function uploadToS3({
  key,
  body,
  contentType,
  metadata,
}: UploadToS3Input) {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: AWS_S3_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
      Metadata: metadata,
    }),
  );

  return {
    key,
    url: getPublicObjectUrl(key),
  };
}

export async function deleteFromS3(key: string) {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: AWS_S3_BUCKET_NAME,
      Key: key,
    }),
  );
}
