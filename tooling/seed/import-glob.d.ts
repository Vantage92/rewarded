// Vite's import.meta.glob, as apps/api/src/platform/importGlob.d.ts declares it. The root tsconfig
// (tooling, e2e) compiles API files through the seed imports and needs the same declaration.
interface ImportMeta {
  readonly glob: <T = unknown>(pattern: string | readonly string[], options: { eager: true; import?: string }) => Record<string, T>;
}
