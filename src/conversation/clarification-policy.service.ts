export const MIN_ACCEPT_CONFIDENCE = 0.85;

export type ClarificationDisposition = 'accepted' | 'ambiguous' | 'assumed';

export interface ClarificationDecision {
  disposition: ClarificationDisposition;
  accepted: boolean;
  ambiguous: boolean;
  assumed: boolean;
  clarificationNeeded: boolean;
  prompt?: string;
  assumption?: string;
}

export const evaluateClarificationNeed = (
  slot: string,
  confidence: number,
  candidateCount: number
): ClarificationDecision => {
  if (candidateCount > 1) {
    return {
      disposition: 'ambiguous',
      accepted: false,
      ambiguous: true,
      assumed: false,
      clarificationNeeded: true,
      prompt: `Found multiple candidates for ${slot}. Please choose one.`
    };
  }

  if (confidence < MIN_ACCEPT_CONFIDENCE) {
    return {
      disposition: 'ambiguous',
      accepted: false,
      ambiguous: true,
      assumed: false,
      clarificationNeeded: true,
      prompt: `Confidence for ${slot} is low. Please clarify before continuing.`
    };
  }

  if (confidence < 0.95) {
    return {
      disposition: 'assumed',
      accepted: true,
      ambiguous: false,
      assumed: true,
      clarificationNeeded: false,
      assumption: `Assumed ${slot} from nearby match (${Math.round(confidence * 100)}% confidence).`
    };
  }

  return {
    disposition: 'accepted',
    accepted: true,
    ambiguous: false,
    assumed: false,
    clarificationNeeded: false
  };
};
