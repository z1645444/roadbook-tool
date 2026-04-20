import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import type { ConstraintDraft, RevisionEntry } from './constraint-draft.model';

interface ConstraintDraftStorage {
  sessions: Record<string, ConstraintDraft>;
}

const DEFAULT_STORAGE: ConstraintDraftStorage = {
  sessions: {}
};

const cloneDraft = (draft: ConstraintDraft): ConstraintDraft =>
  JSON.parse(JSON.stringify(draft)) as ConstraintDraft;

export interface ConstraintDraftRepository {
  createDraft(sessionId: string, initialDraft: ConstraintDraft): Promise<ConstraintDraft>;
  getBySessionId(sessionId: string): Promise<ConstraintDraft | null>;
  updateDraft(
    sessionId: string,
    updater: (draft: ConstraintDraft) => ConstraintDraft
  ): Promise<ConstraintDraft>;
  appendRevision(sessionId: string, revisionEntry: RevisionEntry): Promise<ConstraintDraft>;
}

export class StorageBackedConstraintDraftRepository implements ConstraintDraftRepository {
  constructor(
    private readonly storagePath: string = '.storage/constraint-drafts.json'
  ) {}

  async createDraft(sessionId: string, initialDraft: ConstraintDraft): Promise<ConstraintDraft> {
    const storage = await this.readStorage();

    storage.sessions[sessionId] = {
      ...cloneDraft(initialDraft),
      sessionId
    };

    await this.writeStorage(storage);
    return cloneDraft(storage.sessions[sessionId]);
  }

  async getBySessionId(sessionId: string): Promise<ConstraintDraft | null> {
    const storage = await this.readStorage();
    const draft = storage.sessions[sessionId];

    return draft ? cloneDraft(draft) : null;
  }

  async updateDraft(
    sessionId: string,
    updater: (draft: ConstraintDraft) => ConstraintDraft
  ): Promise<ConstraintDraft> {
    const storage = await this.readStorage();
    const current = storage.sessions[sessionId];

    if (!current) {
      throw new Error(`No draft found for sessionId ${sessionId}`);
    }

    const next = updater(cloneDraft(current));
    storage.sessions[sessionId] = {
      ...cloneDraft(next),
      sessionId
    };

    await this.writeStorage(storage);
    return cloneDraft(storage.sessions[sessionId]);
  }

  async appendRevision(
    sessionId: string,
    revisionEntry: RevisionEntry
  ): Promise<ConstraintDraft> {
    return this.updateDraft(sessionId, (draft) => ({
      ...draft,
      revisionLog: [...draft.revisionLog, revisionEntry]
    }));
  }

  private async readStorage(): Promise<ConstraintDraftStorage> {
    try {
      const raw = await readFile(this.storagePath, 'utf8');
      const parsed = JSON.parse(raw) as ConstraintDraftStorage;

      if (!parsed.sessions || typeof parsed.sessions !== 'object') {
        return cloneDraft(DEFAULT_STORAGE);
      }

      return parsed;
    } catch {
      return cloneDraft(DEFAULT_STORAGE);
    }
  }

  private async writeStorage(storage: ConstraintDraftStorage): Promise<void> {
    await mkdir(dirname(this.storagePath), { recursive: true });
    const tempPath = `${this.storagePath}.tmp`;

    await writeFile(tempPath, `${JSON.stringify(storage, null, 2)}\n`, 'utf8');
    await rename(tempPath, this.storagePath);
  }
}
