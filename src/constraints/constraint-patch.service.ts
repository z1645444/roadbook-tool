import type { ConstraintDraft } from './constraint-draft.model';

const hasValue = <T>(value: T | undefined): value is T => value !== undefined;

export const applyConstraintPatch = (
  draft: ConstraintDraft,
  patch: Partial<ConstraintDraft['slots']>,
  turnId: string,
  timestampIso: string
): ConstraintDraft => {
  const changedFields = Object.keys(patch).filter(
    (field): field is keyof ConstraintDraft['slots'] =>
      hasValue(patch[field as keyof ConstraintDraft['slots']])
  );

  const nextDraft: ConstraintDraft = {
    ...draft,
    slots: {
      ...draft.slots,
      ...patch,
      waypoints: patch.waypoints ?? draft.slots.waypoints
    },
    revisionLog: [...draft.revisionLog]
  };

  for (const field of changedFields) {
    nextDraft.revisionLog.push({
      field,
      turnId,
      timestampIso
    });
  }

  return nextDraft;
};
