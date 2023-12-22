declare global {
  namespace NodeJS {
    interface ProcessEnv {
      ACCESS_TOKEN_SECRET: string;
      REFRESH_TOKEN_SECRET: string;
      DATABASE_CONNECTION_URI: string;
      PORT: string;
      ENCRYPTING_VECTOR: string;
      ENCRYPTING_SECURITY_KEY: string;
      environment: "development" | "production";
    }
  }
}

export {};
