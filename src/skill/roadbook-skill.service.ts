import { Inject, Injectable } from '@nestjs/common';

import {
  CONSTRAINT_DRAFT_REPOSITORY,
  type ConstraintDraftRepository
} from '../constraints/constraint-draft.repository';
import {
  ROUTING_ORCHESTRATOR,
  type RoutingOrchestratorService
} from '../routing/routing-orchestrator.service';
import type { RoadbookSkillInput, RoadbookSkillOutput } from './roadbook-skill.contract';
import { createRoadbookSkillRuntime } from './roadbook-skill.runtime';

@Injectable()
export class RoadbookSkillService {
  private readonly runtime;

  constructor(
    @Inject(ROUTING_ORCHESTRATOR)
    private readonly routingOrchestrator: RoutingOrchestratorService,
    @Inject(CONSTRAINT_DRAFT_REPOSITORY)
    private readonly draftRepository: ConstraintDraftRepository
  ) {
    this.runtime = createRoadbookSkillRuntime({
      routingOrchestrator: this.routingOrchestrator,
      draftRepository: this.draftRepository
    });
  }

  async execute(input: RoadbookSkillInput): Promise<RoadbookSkillOutput> {
    return this.runtime.execute(input);
  }
}
