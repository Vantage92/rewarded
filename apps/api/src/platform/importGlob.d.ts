// Vite's import.meta.glob (transformed at build and test time). Under plain Node it does not exist;
// callers catch the TypeError and fall back to reading the directory (jobs/scheduler.ts).
interface ImportMeta {
  readonly glob: <T = unknown>(pattern: string | readonly string[], options: { eager: true; import?: string }) => Record<string, T>;
}
