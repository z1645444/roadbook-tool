import type { ConstraintDraftRepository } from '../constraints/constraint-draft.repository';
import { renderMarkdownRoadbook } from '../roadbook/markdown-roadbook.renderer';
import type {
  RoutingOrchestratorResult,
  RoutingOrchestratorService
} from '../routing/routing-orchestrator.service';
import type { RoadbookSkillInput, RoadbookSkillOutput } from './roadbook-skill.contract';
import type { RoadbookSkillClarification } from './roadbook-skill.types';

type RoutingOrchestratorPort = Pick<RoutingOrchestratorService, 'planRouteForSession'>;
type DraftRepositoryPort = Pick<ConstraintDraftRepository, 'createDraft'>;

export interface RoadbookSkillRuntimeDependencies {
  routingOrchestrator: RoutingOrchestratorPort;
  draftRepository: DraftRepositoryPort;
}

const toSafeFallbackMessage = (message: string | null): string => {
  const sanitized = message?.trim();
  if (sanitized && sanitized.length > 0) {
    return sanitized;
  }

  return '路线服务暂时不可用，请稍后重试。';
};

const toClarification = (
  routingResult: RoutingOrchestratorResult
): RoadbookSkillClarification => {
  if (routingResult.clarification.needed) {
    return {
      needed: true,
      slot: routingResult.clarification.slot,
      prompt: routingResult.clarification.prompt
    };
  }

  return {
    needed: true,
    slot: 'point',
    prompt: 'Please clarify this point.'
  };
};

export const createRoadbookSkillRuntime = (dependencies: RoadbookSkillRuntimeDependencies) => ({
  async execute(input: RoadbookSkillInput): Promise<RoadbookSkillOutput> {
    await dependencies.draftRepository.createDraft(input.sessionId, input.canonicalDraft);
    const routingResult = await dependencies.routingOrchestrator.planRouteForSession(input.sessionId);

    if (routingResult.routingStatus === 'ready') {
      if (!routingResult.routePlan || !routingResult.routeMetadata) {
        throw new Error('Routing ready state requires routePlan and routeMetadata.');
      }

      const roadbookMarkdown = renderMarkdownRoadbook({
        recap: input.recap,
        routePlan: routingResult.routePlan,
        routeMetadata: routingResult.routeMetadata,
        options: {
          includeValidationContext: true
        }
      });

      return {
        status: 'ready',
        routePlan: routingResult.routePlan,
        routeMetadata: routingResult.routeMetadata,
        roadbookMarkdown,
        fallbackMessage: null,
        clarification: null
      };
    }

    if (routingResult.routingStatus === 'needs_clarification') {
      return {
        status: 'needs_clarification',
        routePlan: null,
        routeMetadata: null,
        roadbookMarkdown: null,
        fallbackMessage: null,
        clarification: toClarification(routingResult)
      };
    }

    return {
      status: 'fallback',
      routePlan: null,
      routeMetadata: routingResult.routeMetadata,
      roadbookMarkdown: null,
      fallbackMessage: toSafeFallbackMessage(routingResult.fallbackMessage),
      clarification: null
    };
  }
});

