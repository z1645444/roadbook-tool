import type { RoadbookAgentToolRequest } from './roadbook-skill.agent-tool';
import { createMinimalRoadbookSkill } from './minimal-roadbook-skill';

const readStdin = async (): Promise<string> => {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8').trim();
};

const printJson = (payload: unknown): void => {
  process.stdout.write(`${JSON.stringify(payload)}\n`);
};

const main = async (): Promise<void> => {
  try {
    const raw = await readStdin();
    if (!raw) {
      throw new Error('Expected JSON input on stdin.');
    }

    const request = JSON.parse(raw) as RoadbookAgentToolRequest;
    const skill = createMinimalRoadbookSkill();
    const result = await skill.run(request);

    printJson(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    printJson({
      ok: false,
      error: message
    });
    process.exitCode = 1;
  }
};

void main();

