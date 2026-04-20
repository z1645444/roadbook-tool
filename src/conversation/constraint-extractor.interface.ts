import type { IntakeTurnDto, ProposedSlotDto } from '../shared/validation/intake-turn.dto';

export interface ExtractedConstraint {
  key: string;
  raw: string;
  confidence: number;
  providerId?: string;
}

export interface ConstraintExtractor {
  extractConstraints(input: IntakeTurnDto): ExtractedConstraint[];
}

export class ParserFirstConstraintExtractor implements ConstraintExtractor {
  extractConstraints(input: IntakeTurnDto): ExtractedConstraint[] {
    return input.proposedSlots.map((slot: ProposedSlotDto) => ({
      key: slot.key,
      raw: slot.value,
      confidence: slot.confidence ?? 1,
      providerId: slot.providerId
    }));
  }
}
