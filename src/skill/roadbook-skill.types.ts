import type { RoadbookRenderDay } from '../roadbook/roadbook-render.types';

export interface RoadbookSkillRecap {
  summary: string;
  assumptions: string[];
}

export interface RoadbookSkillClarification {
  needed: true;
  slot: string;
  prompt: string;
}

export type RoadbookSkillRoutePlan = RoadbookRenderDay[];

