/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LOCAL_LOGIN_NAME?: string;
  readonly VITE_LOCAL_LOGIN_PASSWORD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
