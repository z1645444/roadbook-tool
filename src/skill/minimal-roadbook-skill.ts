import { StorageBackedConstraintDraftRepository } from '../constraints/constraint-draft.repository';
import { AmapProvider } from '../map-provider/amap.provider';
import { RoutingOrchestratorService } from '../routing/routing-orchestrator.service';
import {
  createRoadbookAgentTool,
  type RoadbookAgentToolDependencies,
  type RoadbookAgentToolRequest,
  type RoadbookAgentToolResponse
} from './roadbook-skill.agent-tool';

export interface MinimalRoadbookSkillOptions {
  amapApiKey?: string;
  storagePath?: string;
}

export interface MinimalRoadbookSkill {
  run(request: RoadbookAgentToolRequest): Promise<RoadbookAgentToolResponse>;
}

const resolveApiKey = (amapApiKey?: string): string => {
  const fromOption = amapApiKey?.trim();
  if (fromOption && fromOption.length > 0) {
    return fromOption;
  }

  const fromEnv = process.env.AMAP_API_KEY?.trim();
  if (fromEnv && fromEnv.length > 0) {
    return fromEnv;
  }

  throw new Error('AMAP_API_KEY is required for minimal roadbook skill.');
};

const buildDependencies = (
  options: MinimalRoadbookSkillOptions = {}
): RoadbookAgentToolDependencies => {
  const provider = new AmapProvider(resolveApiKey(options.amapApiKey));
  const draftRepository = new StorageBackedConstraintDraftRepository(
    options.storagePath ?? '.storage/constraint-drafts.json'
  );
  const routingOrchestrator = new RoutingOrchestratorService(provider, draftRepository);

  return {
    routingOrchestrator,
    draftRepository
  };
};

export const createMinimalRoadbookSkill = (
  options: MinimalRoadbookSkillOptions = {},
  overrides?: Partial<RoadbookAgentToolDependencies>
): MinimalRoadbookSkill => {
  const dependencies = {
    ...buildDependencies(options),
    ...overrides
  } as RoadbookAgentToolDependencies;

  return createRoadbookAgentTool(dependencies);
};

