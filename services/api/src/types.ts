export type AppEnv = {
  Variables: {
    apiKey: string;
    apiKeyId: string | null;
    rateLimit: number;
    scopes: string[];
  };
};
