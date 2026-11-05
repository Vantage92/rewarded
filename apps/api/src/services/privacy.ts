// PrivacyService (architecture §10.7, §12.2; implementation WP-6). Every module with personal data
// registers an eraser and an exporter for its own tables; DELETE /me and GET /me/export call them all.
import type { ApiModuleName } from '@rewarded/contracts';
import type { Db } from '../db/types.ts';

export type Eraser = (tx: Db, userId: string) => void;
export type Exporter = (userId: string) => unknown;

export interface PrivacyService {
  registerEraser(module: ApiModuleName, eraser: Eraser): void;
  registerExporter(module: ApiModuleName, exporter: Exporter): void;
  /** Runs every eraser in registration order inside `tx`; one failure rolls back the whole deletion. */
  eraseUser(tx: Db, userId: string): readonly ApiModuleName[];
  /** One section per module (the `modules` object of the export file). */
  exportUser(userId: string): Record<string, unknown>;
  registeredModules(): { erasers: readonly ApiModuleName[]; exporters: readonly ApiModuleName[] };
}

/** In-memory registry; also usable as the real implementation's registry. */
export class FakePrivacyService implements PrivacyService {
  private readonly erasers = new Map<ApiModuleName, Eraser>();
  private readonly exporters = new Map<ApiModuleName, Exporter>();

  registerEraser(module: ApiModuleName, eraser: Eraser): void {
    if (this.erasers.has(module)) throw new Error(`Eraser for ${module} already registered`);
    this.erasers.set(module, eraser);
  }
  registerExporter(module: ApiModuleName, exporter: Exporter): void {
    if (this.exporters.has(module)) throw new Error(`Exporter for ${module} already registered`);
    this.exporters.set(module, exporter);
  }
  eraseUser(tx: Db, userId: string): readonly ApiModuleName[] {
    const done: ApiModuleName[] = [];
    for (const [module, erase] of this.erasers) {
      erase(tx, userId);
      done.push(module);
    }
    return done;
  }
  exportUser(userId: string): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [module, exp] of this.exporters) out[module] = exp(userId);
    return out;
  }
  registeredModules() {
    return { erasers: [...this.erasers.keys()], exporters: [...this.exporters.keys()] };
  }
}
