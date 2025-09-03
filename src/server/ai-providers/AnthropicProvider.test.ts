import { vi } from 'vitest';
import { AnthropicProvider } from './AnthropicProvider';

const mockCreateMessage = vi.fn();

vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = {
      create: mockCreateMessage,
    };
  },
}));

describe('AnthropicProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateContent', () => {
    it('should return text from the response', async () => {
      mockCreateMessage.mockResolvedValue({
        content: [{ type: 'text', text: 'test-content' }],
      });
      const provider = new AnthropicProvider('test-key');
      const content = await provider.generateContent('test-prompt');
      expect(content).toBe('test-content');
    });

    it('should return empty string if content is not text', async () => {
      mockCreateMessage.mockResolvedValue({
        content: [{ type: 'image', source: {} }],
      });
      const provider = new AnthropicProvider('test-key');
      const content = await provider.generateContent('test-prompt');
      expect(content).toBe('');
    });
  });

  describe('createEmbedding', () => {
    it('should return empty array for createEmbedding', async () => {
      const provider = new AnthropicProvider('test-key');
      const embeddings = await provider.createEmbedding({ model: 'test-model', input: 'test-input' });
      expect(embeddings).toEqual([]);
    });
  });
});
