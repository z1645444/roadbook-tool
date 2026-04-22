import type { ConstraintDraft } from '../constraints/constraint-draft.model';
import type { ConstraintDraftRepository } from '../constraints/constraint-draft.repository';
import type { RoutingOrchestratorService } from '../routing/routing-orchestrator.service';
import type { RoadbookSkillInput, RoadbookSkillOutput } from './roadbook-skill.contract';
import { createRoadbookSkillRuntime } from './roadbook-skill.runtime';

export interface RoadbookAgentToolRequest {
  sessionId: string;
  canonicalDraft: ConstraintDraft;
  recap: {
    summary: string;
    assumptions: string[];
  };
}

export interface RoadbookAgentToolResponse {
  ok: true;
  status: RoadbookSkillOutput['status'];
  data: RoadbookSkillOutput;
}

type RoutingOrchestratorPort = Pick<RoutingOrchestratorService, 'planRouteForSession'>;
type DraftRepositoryPort = Pick<ConstraintDraftRepository, 'createDraft'>;

export interface RoadbookAgentToolDependencies {
  routingOrchestrator: RoutingOrchestratorPort;
  draftRepository: DraftRepositoryPort;
}

const toSkillInput = (request: RoadbookAgentToolRequest): RoadbookSkillInput => ({
  sessionId: request.sessionId,
  canonicalDraft: request.canonicalDraft,
  recap: request.recap
});

export const createRoadbookAgentTool = (dependencies: RoadbookAgentToolDependencies) => {
  const runtime = createRoadbookSkillRuntime({
    routingOrchestrator: dependencies.routingOrchestrator,
    draftRepository: dependencies.draftRepository
  });

  return {
    async run(request: RoadbookAgentToolRequest): Promise<RoadbookAgentToolResponse> {
      const output = await runtime.execute(toSkillInput(request));
      return {
        ok: true,
        status: output.status,
        data: output
      };
    }
  };
};

