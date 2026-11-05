// Versions of the texts the student accepts (docs/juridisch concept 0.3, 5 November 2026). The API
// answers TERMS_OUTDATED when these differ from its own (apps/api/src/modules/auth/legal.ts).
export const LEGAL_VERSIONS = { terms: '0.3', privacy: '0.3', research_info: '0.3' } as const;
