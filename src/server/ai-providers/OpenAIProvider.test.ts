import { vi } from 'vitest';
import { OpenAIProvider } from './OpenAIProvider';

const mockCreateChatCompletion = vi.fn();
const mockCreateEmbedding = vi.fn();

vi.mock('openai', () => ({
  default: class {
    chat = {
      completions: {
        create: mockCreateChatCompletion,
      },
    };
    embeddings = {
      create: mockCreateEmbedding,
    };
  },
}));

describe('OpenAIProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateContent', () => {
    it('should return content from the first choice', async () => {
      mockCreateChatCompletion.mockResolvedValue({
        choices: [{ message: { content: 'test-content' } }],
      });
      const provider = new OpenAIProvider('test-key');
      const content = await provider.generateContent('test-prompt');
      expect(content).toBe('test-content');
    });

    it('should return empty string if no choices are available', async () => {
      mockCreateChatCompletion.mockResolvedValue({ choices: [] });
      const provider = new OpenAIProvider('test-key');
      const content = await provider.generateContent('test-prompt');
      expect(content).toBe('');
    });
  });

  describe('createEmbedding', () => {
    it('should return embeddings for the input', async () => {
      mockCreateEmbedding.mockResolvedValue({
        data: [{ embedding: [1, 2, 3] }, { embedding: [4, 5, 6] }],
      });
      const provider = new OpenAIProvider('test-key');
      const embeddings = await provider.createEmbedding(['input1', 'input2']);
      expect(embeddings).toEqual([
        [1, 2, 3],
        [4, 5, 6],
      ]);
    });
  });
});
