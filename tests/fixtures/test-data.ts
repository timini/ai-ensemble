export const testPrompts = {
  simple: "What is the capital of France?",
  complex: "Explain the concept of quantum computing in simple terms, including its potential applications and current limitations.",
  creative: "Write a short story about a robot who discovers emotions.",
  technical: "Compare the performance characteristics of different database indexing strategies.",
  comparison: "Compare the advantages and disadvantages of React vs Vue.js for building modern web applications."
};

export const expectedResponseKeywords = {
  france: ["Paris", "capital", "France"],
  quantum: ["quantum", "computing", "qubit", "superposition"],
  robot: ["robot", "emotion", "story", "artificial"],
  database: ["index", "database", "performance", "query"],
  react: ["React", "Vue", "framework", "component"]
};

export const testConfigurations = {
  minimal: {
    providers: ['openai'],
    models: ['gpt-4']
  },
  standard: {
    providers: ['openai', 'google'],
    models: ['gpt-4', 'gemini-2.5-pro']
  },
  full: {
    providers: ['openai', 'google', 'anthropic', 'grok'],
    models: ['gpt-4', 'gemini-2.5-pro', 'claude-3-opus-20240229', 'grok-2']
  }
};

