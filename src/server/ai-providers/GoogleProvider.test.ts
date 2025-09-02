import { vi } from 'vitest';
import { GoogleProvider } from './GoogleProvider';

const mockGenerateContent = vi.fn();

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel = () => ({
      generateContent: mockGenerateContent,
    });
  },
}));

describe('GoogleProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateContent', () => {
    it('should return text from the response', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => 'test-content',
        },
      });
      const provider = new GoogleProvider('test-key');
      const content = await provider.generateContent('test-prompt');
      expect(content).toBe('test-content');
    });

    it('should return empty string if no text is available', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => '',
        },
      });
      const provider = new GoogleProvider('test-key');
      const content = await provider.generateContent('test-prompt');
      expect(content).toBe('');
    });
  });

  describe('createEmbedding', () => {
    it('should return empty arrays for each input', async () => {
      const provider = new GoogleProvider('test-key');
      const embeddings = await provider.createEmbedding(['input1', 'input2']);
      expect(embeddings).toEqual([[], []]);
    });
  });
});
