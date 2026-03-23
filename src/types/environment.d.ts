declare global {
  namespace NodeJS {
    interface ProcessEnv {
      ACCESS_TOKEN_SECRET: string;
      REFRESH_TOKEN_SECRET: string;
      DATABASE_CONNECTION_URI: string;
      PORT: string;
      ENCRYPTING_VECTOR: string;
      ENCRYPTING_SECURITY_KEY: string;
      AWS_REGION?: string;
      AWS_ACCESS_KEY_ID?: string;
      AWS_SECRET_ACCESS_KEY?: string;
      AWS_S3_BUCKET_NAME?: string;
      AWS_S3_ENDPOINT?: string;
      AWS_S3_FORCE_PATH_STYLE?: string;
      environment: "development" | "production";
    }
  }
}

export {};
