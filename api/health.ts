import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Is there a serverless function here at all?
 *
 * The smallest possible one, with no imports, no key and nothing to fail —
 * so that "the API is not deployed" can be told apart from "the API is
 * deployed and something inside it is wrong" by opening one URL.
 *
 * GET /api/health should answer {"ok":true,...}. If it answers with the app's
 * home screen instead, no function is deployed and the problem is the build or
 * the project settings, not this code.
 */
export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    ok: true,
    build: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local',
    // Whether the key reached the function. Never the key itself.
    memoryAiKey: Boolean(process.env.MEMORY_AI_API_KEY || process.env.ANTHROPIC_API_KEY),
    node: process.version,
  });
}
