import type { ConstraintDraft } from '../constraints/constraint-draft.model';
import type { RouteGenerationMetadata } from '../constraints/constraint-draft.model';
import type {
  RoadbookSkillClarification,
  RoadbookSkillRecap,
  RoadbookSkillRoutePlan
} from './roadbook-skill.types';

export type RoadbookSkillStatus = 'ready' | 'needs_clarification' | 'fallback';

export interface RoadbookSkillInput {
  sessionId: string;
  canonicalDraft: ConstraintDraft;
  recap: RoadbookSkillRecap;
}

interface RoadbookSkillReadyOutput {
  status: 'ready';
  routePlan: RoadbookSkillRoutePlan;
  routeMetadata: RouteGenerationMetadata;
  roadbookMarkdown: string;
  fallbackMessage: null;
  clarification: null;
}

interface RoadbookSkillNeedsClarificationOutput {
  status: 'needs_clarification';
  routePlan: null;
  routeMetadata: null;
  roadbookMarkdown: null;
  fallbackMessage: null;
  clarification: RoadbookSkillClarification;
}

interface RoadbookSkillFallbackOutput {
  status: 'fallback';
  routePlan: null;
  routeMetadata: RouteGenerationMetadata | null;
  roadbookMarkdown: null;
  fallbackMessage: string;
  clarification: null;
}

export type RoadbookSkillOutput =
  | RoadbookSkillReadyOutput
  | RoadbookSkillNeedsClarificationOutput
  | RoadbookSkillFallbackOutput;

