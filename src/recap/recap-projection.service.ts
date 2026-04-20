import type { ConstraintDraft } from '../constraints/constraint-draft.model';
import type { ConstraintDraftRepository } from '../constraints/constraint-draft.repository';

export interface ConstraintRecap {
  summary: string;
  sections: string[];
  assumptionNotes: string[];
  correctionPath: string;
}

const formatPoint = (label: string, raw?: string): string => `${label}: ${raw ?? 'missing'}`;

const formatRideWindow = (draft: ConstraintDraft): string => {
  const normalized = draft.slots.rideWindow?.normalized;
  if (!normalized) {
    return 'Ride window: missing';
  }

  return `Ride window: ${normalized.start}-${normalized.end} (${normalized.minutes} min)`;
};

const buildSummary = (sections: string[]): string => sections.join(' | ');

export const buildConstraintRecap = (draft: ConstraintDraft): ConstraintRecap => {
  const sections = [
    formatPoint('Origin', draft.slots.origin?.raw),
    formatPoint('Destination', draft.slots.destination?.raw),
    `Waypoints: ${draft.slots.waypoints.map((item) => item.raw).join(', ') || 'none'}`,
    `Date range: ${draft.slots.dateRange?.raw ?? 'missing'}`,
    `Trip days: ${draft.slots.tripDays?.raw ?? 'missing'}`,
    formatRideWindow(draft),
    `Intensity: ${draft.slots.intensity?.raw ?? 'missing'}`
  ];

  const assumptionNotes = Object.entries(draft.assumptions ?? {}).map(
    ([field, value]) => `${field} assumption: ${value}`
  );

  return {
    summary: buildSummary(sections),
    sections,
    assumptionNotes,
    correctionPath:
      'Correction path: reply with "revise <field>: <value>" to overwrite any assumption.'
  };
};

export const regenerateFullRecap = (draft: ConstraintDraft): ConstraintRecap =>
  buildConstraintRecap(draft);

export const buildConstraintRecapFromRepository = async (
  repository: ConstraintDraftRepository,
  sessionId: string
): Promise<ConstraintRecap> => {
  const draft = await repository.getBySessionId(sessionId);

  if (!draft) {
    throw new Error(`No canonical draft found for session ${sessionId}`);
  }

  return buildConstraintRecap(draft);
};
