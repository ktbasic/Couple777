/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  /** Newer Supabase projects call it this. Either name works. */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  /** What older projects call the same browser-safe key. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_PUBLIC_APP_URL?: string;
  readonly VITE_ROUTER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
