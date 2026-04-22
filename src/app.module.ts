import { Module } from '@nestjs/common';

import {
  CONSTRAINT_DRAFT_REPOSITORY,
  StorageBackedConstraintDraftRepository
} from './constraints/constraint-draft.repository';
import { IntakeController } from './conversation/intake.controller';
import { AmapProvider } from './map-provider/amap.provider';
import { MAP_PROVIDER } from './map-provider/map-provider.port';
import {
  ROUTING_ORCHESTRATOR,
  RoutingOrchestratorService
} from './routing/routing-orchestrator.service';

@Module({
  controllers: [IntakeController],
  providers: [
    {
      provide: ROUTING_ORCHESTRATOR,
      useClass: RoutingOrchestratorService
    },
    {
      provide: MAP_PROVIDER,
      useFactory: () => new AmapProvider()
    },
    {
      provide: CONSTRAINT_DRAFT_REPOSITORY,
      useFactory: () => new StorageBackedConstraintDraftRepository()
    }
  ]
})
export class AppModule {}
