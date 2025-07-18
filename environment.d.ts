export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // neon db url
      DATABASE_URL: string;

      // app base url
      NEXT_PUBLIC_APP_URL: string;

      // public api token
      API_PUBLIC_TOKEN: string;
    }
  }
}
