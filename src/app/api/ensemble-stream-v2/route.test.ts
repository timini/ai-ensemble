import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import * as ensemble from '@/server/api/routers/ensemble';
import { OpenAIProvider } from '@/server/ai-providers/OpenAIProvider';

// Mock providers to intercept instance creation and streaming
vi.spyOn(OpenAIProvider.prototype, 'generateContentStream').mockImplementation(async function* () { /* no chunks */ });
vi.spyOn(OpenAIProvider.prototype, 'createEmbedding').mockImplementation(async () => [0.1, 0.2, 0.3]);

vi.mock('@/server/ai-providers/GoogleProvider', () => {
  return {
    GoogleProvider: vi.fn().mockImplementation(() => ({
      generateContentStream: vi.fn(async function* () { yield 'google response'; }),
    })),
  };
});

vi.mock('@/server/ai-providers/AnthropicProvider', () => {
  return {
    AnthropicProvider: vi.fn().mockImplementation(() => ({
      generateContentStream: vi.fn(async function* () { /* no chunks */ }),
    })),
  };
});

vi.mock('@/server/ai-providers/GrokProvider', () => {
  return {
    GrokProvider: vi.fn().mockImplementation(() => ({
      generateContentStream: vi.fn(async function* () { /* no chunks */ }),
    })),
  };
});

vi.mock('@/server/api/routers/ensemble');
const mockedEnsemble = vi.mocked(ensemble);

// Capture last summarizer prompt for assertions
let lastSummarizerPrompt = '';

function textFromSSE(response: Response): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const reader = response.body?.getReader();
      if (!reader) return resolve('');
      const decoder = new TextDecoder();
      let out = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        out += decoder.decode(value);
      }
      resolve(out);
    } catch (e) {
      reject(e);
    }
  });
}

describe('ensemble-stream-v2 manual short-circuit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lastSummarizerPrompt = '';
    mockedEnsemble.calculateAgreement.mockResolvedValue([]);
  });

  it('skips generation when existingResponses has the config id and emits start/complete', async () => {
    const body = {
      prompt: 'Test prompt',
      configurations: [
        { id: 'cfgA', name: 'Manual A', provider: 'openai', model: 'gpt-4o-mini' },
        { id: 'cfgB', name: 'Google B', provider: 'google', model: 'gemini-1.5-flash' },
      ],
      keys: {
        cfgA: 'key-openai',
        cfgB: 'key-google',
      },
      models: {
        cfgA: 'gpt-4o-mini',
        cfgB: 'gemini-1.5-flash',
      },
      summarizer: { configId: 'cfgA', provider: 'openai', model: 'gpt-4o-mini' },
      existingResponses: {
        cfgA: 'This is a manual response for A',
        mOnly: 'Manual-only response text',
      },
    } as const;

    const req = {
      json: async () => body,
    } as unknown as Request;

    const res = (await POST(req as any)) as Response;
    expect(res.headers.get('Content-Type')).toContain('text/event-stream');

    const sse = await textFromSSE(res);

    // It should emit config_start and config_complete for cfgA (manual), but no chunk lines for cfgA
    expect(sse).toContain('\"type\":\"config_start\"');
    expect(sse).toContain('\"configId\":\"cfgA\"');
    expect(sse).toContain('\"type\":\"config_complete\"');
    expect(sse).toContain('This is a manual response for A');

    // Ensure no chunk events for cfgA
    const cfgAChunkRegex = /\{"type":"chunk","configId":"cfgA"/g;
    expect(cfgAChunkRegex.test(sse)).toBe(false);

    // Ensure the provider for cfgA did NOT stream with the original prompt (manual short-circuit),
    // but may be called later for consensus summarization.
    const calledWithOriginalPrompt = vi.spyOn(OpenAIProvider.prototype, 'generateContentStream').mock.calls.some((args) => args?.[0] === 'Test prompt');
    expect(calledWithOriginalPrompt).toBe(false);

    // And the non-manual provider (cfgB) should stream with the original prompt
    const { GoogleProvider } = await import('@/server/ai-providers/GoogleProvider');
    const googleInstance = (GoogleProvider as unknown as vi.Mock).mock.results[0]?.value as { generateContentStream: vi.Mock };
    const googleCalledWithOriginalPrompt = googleInstance.generateContentStream.mock.calls.some((args) => args?.[0] === 'Test prompt');
    expect(googleCalledWithOriginalPrompt).toBe(true);

    // Agreement error should be actionable if no OpenAI for embeddings (not the case here since cfgA exists),
    // but we still assert that the agreement_start event is present.
    expect(sse).toContain('\"type\":\"agreement_start\"');

    // Consensus should include manual-only response as well
    expect(sse).toContain('Manual-only response text');

    // Agreement should be called with both cfgA (manual) and cfgB (api), plus manual-only mOnly if present during success
    // We mock success by ensuring calculateAgreement is invoked once with successfulResponses map containing cfgA/cfgB/mOnly
    expect(mockedEnsemble.calculateAgreement).toHaveBeenCalled();
    const args = mockedEnsemble.calculateAgreement.mock.calls[0]?.[1] as Record<
      string,
      string
    >;
    expect(args).toBeTruthy();
    expect(Object.keys(args)).toEqual(expect.arrayContaining(['cfgA', 'cfgB', 'mOnly']));
  });
});


