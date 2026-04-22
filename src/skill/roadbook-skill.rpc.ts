import { safeParseConstraintDraft } from '../shared/validation/constraint-draft.schema';
import { createMinimalRoadbookSkill } from './minimal-roadbook-skill';
import { ROADBOOK_SKILL_MANIFEST } from './roadbook-skill.manifest';
import type { RoadbookAgentToolRequest, RoadbookAgentToolResponse } from './roadbook-skill.agent-tool';

interface JsonRpcRequest {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: unknown;
}

interface JsonRpcSuccess {
  jsonrpc: '2.0';
  id: string | number | null;
  result: unknown;
}

interface JsonRpcError {
  jsonrpc: '2.0';
  id: string | number | null;
  error: {
    code: number;
    message: string;
    data?: unknown;
  };
}

type JsonRpcResponse = JsonRpcSuccess | JsonRpcError;

const ok = (id: string | number | null, result: unknown): JsonRpcSuccess => ({
  jsonrpc: '2.0',
  id,
  result
});

const fail = (
  id: string | number | null,
  code: number,
  message: string,
  data?: unknown
): JsonRpcError => ({
  jsonrpc: '2.0',
  id,
  error: {
    code,
    message,
    data
  }
});

const parseInvokeParams = (params: unknown) => {
  if (!params || typeof params !== 'object') {
    throw new Error('params must be an object');
  }

  const payload = params as {
    sessionId?: unknown;
    canonicalDraft?: unknown;
    recap?: unknown;
  };

  if (typeof payload.sessionId !== 'string' || payload.sessionId.trim().length === 0) {
    throw new Error('params.sessionId must be a non-empty string');
  }

  const draftResult = safeParseConstraintDraft(payload.canonicalDraft);
  if (!draftResult.success) {
    throw new Error(`params.canonicalDraft invalid: ${draftResult.error.issues[0]?.message ?? 'invalid'}`);
  }

  const recap = payload.recap;
  if (!recap || typeof recap !== 'object') {
    throw new Error('params.recap must be an object');
  }

  const recapValue = recap as {
    summary?: unknown;
    assumptions?: unknown;
  };
  if (typeof recapValue.summary !== 'string') {
    throw new Error('params.recap.summary must be a string');
  }
  if (!Array.isArray(recapValue.assumptions)) {
    throw new Error('params.recap.assumptions must be a string array');
  }
  if (recapValue.assumptions.some((item) => typeof item !== 'string')) {
    throw new Error('params.recap.assumptions must be a string array');
  }

  return {
    sessionId: payload.sessionId,
    canonicalDraft: draftResult.data,
    recap: {
      summary: recapValue.summary,
      assumptions: recapValue.assumptions as string[]
    }
  };
};

export const handleRoadbookSkillRpc = async (
  request: JsonRpcRequest,
  options?: {
    invokeSkill?: (request: RoadbookAgentToolRequest) => Promise<RoadbookAgentToolResponse>;
  }
): Promise<JsonRpcResponse | null> => {
  if (!request || request.jsonrpc !== '2.0' || typeof request.method !== 'string') {
    return fail(request?.id ?? null, -32600, 'Invalid Request');
  }

  const id = request.id ?? null;

  if (request.method === 'initialize') {
    return ok(id, {
      name: ROADBOOK_SKILL_MANIFEST.name,
      version: ROADBOOK_SKILL_MANIFEST.version,
      protocol: ROADBOOK_SKILL_MANIFEST.protocol,
      methods: ROADBOOK_SKILL_MANIFEST.methods
    });
  }

  if (request.method === 'ping') {
    return ok(id, { pong: true });
  }

  if (request.method === 'skill.describe') {
    return ok(id, ROADBOOK_SKILL_MANIFEST);
  }

  if (request.method === 'skill.invoke') {
    try {
      const params = parseInvokeParams(request.params);
      const invokeSkill =
        options?.invokeSkill ??
        (async (invokeRequest: RoadbookAgentToolRequest) => {
          const skill = createMinimalRoadbookSkill({
            storagePath: process.env.ROADBOOK_STORAGE_PATH
          });
          return skill.run(invokeRequest);
        });
      const result = await invokeSkill(params);
      return ok(id, result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown invoke error';
      return fail(id, -32000, message);
    }
  }

  if (request.method === 'shutdown' || request.method === 'exit') {
    return ok(id, { ok: true });
  }

  return fail(id, -32601, `Method not found: ${request.method}`);
};
