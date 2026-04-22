import readline from 'node:readline';

import { handleRoadbookSkillRpc } from './roadbook-skill.rpc';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

const writeJson = (payload: unknown): void => {
  process.stdout.write(`${JSON.stringify(payload)}\n`);
};

rl.on('line', async (line) => {
  const text = line.trim();
  if (!text) {
    return;
  }

  let request: unknown;
  try {
    request = JSON.parse(text);
  } catch {
    writeJson({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32700,
        message: 'Parse error'
      }
    });
    return;
  }

  const response = await handleRoadbookSkillRpc(request as never);
  if (!response) {
    return;
  }

  writeJson(response);

  const method =
    typeof request === 'object' && request !== null && 'method' in request
      ? String((request as { method?: unknown }).method ?? '')
      : '';
  if (method === 'exit') {
    process.exit(0);
  }
});

