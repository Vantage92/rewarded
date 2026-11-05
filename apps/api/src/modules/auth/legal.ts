// Current versions of the documents a user accepts at onboarding. They follow the concept documents
// in docs/juridisch (version 0.3, 5 November 2026); TERMS_OUTDATED when the app sends another one.
// Overridable per environment until the founder fixes the final texts.
export interface LegalVersions {
  terms: string;
  privacy: string;
  research_info: string;
}

export function legalVersions(env: NodeJS.ProcessEnv = process.env): LegalVersions {
  return {
    terms: env.REWARDED_TERMS_VERSION || '0.3',
    privacy: env.REWARDED_PRIVACY_VERSION || '0.3',
    research_info: env.REWARDED_RESEARCH_INFO_VERSION || '0.3',
  };
}
