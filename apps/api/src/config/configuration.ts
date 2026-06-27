export interface AppConfig {
  env: string;
  port: number;
  apiPrefix: string;
  corsOrigin: string;
  jwt: {
    accessSecret: string;
    accessTtl: string;
    refreshSecret: string;
    refreshTtl: string;
  };
  throttle: {
    ttl: number;
    limit: number;
  };
  storage: {
    driver: 'local' | 'gcs';
    localDir: string;
    maxFileSizeMb: number;
    gcsBucket: string;
  };
  gemini: {
    apiKey: string;
    model: string;
    enabled: boolean;
  };
}

export default (): AppConfig => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '4000', 10),
  apiPrefix: process.env.API_PREFIX ?? 'api/v1',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'change-me-access-secret',
    accessTtl: process.env.JWT_ACCESS_TTL ?? '900s',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'change-me-refresh-secret',
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '7d',
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL ?? '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '120', 10),
  },
  storage: {
    driver: (process.env.STORAGE_DRIVER as 'local' | 'gcs') ?? 'local',
    localDir: process.env.STORAGE_LOCAL_DIR ?? 'storage/uploads',
    maxFileSizeMb: parseInt(process.env.STORAGE_MAX_FILE_SIZE_MB ?? '25', 10),
    gcsBucket: process.env.GCS_BUCKET ?? '',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY ?? '',
    model: process.env.GEMINI_MODEL ?? 'gemini-1.5-flash',
    enabled: Boolean(process.env.GEMINI_API_KEY),
  },
});
