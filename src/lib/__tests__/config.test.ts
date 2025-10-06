import { getAPIConfig, getConfigFromEnv, validateConfig, getDefaultModel } from '../config';

// Mock import.meta.env
const mockEnv = {
  VITE_USE_LOCAL_MODEL: 'true',
  VITE_API_KEY: 'test-key',
  VITE_LOCAL_ENDPOINT_URL: 'http://localhost:8080/v1',
  VITE_LOCAL_MODEL_NAME: 'test-model'
};

// Mock import.meta.env
Object.defineProperty(import.meta, 'env', {
  value: mockEnv,
  writable: true
});

describe('Configuration System', () => {
  test('should get configuration from environment variables', () => {
    const config = getConfigFromEnv();
    
    expect(config.useLocalModel).toBe(true);
    expect(config.apiKey).toBe('test-key');
    expect(config.localEndpointUrl).toBe('http://localhost:8080/v1');
    expect(config.localModelName).toBe('test-model');
  });

  test('should get complete configuration with defaults', () => {
    const config = getAPIConfig();
    
    expect(config.useLocalModel).toBe(true);
    expect(config.apiKey).toBe('test-key');
    expect(config.localEndpointUrl).toBe('http://localhost:8080/v1');
    expect(config.localModelName).toBe('test-model');
  });

  test('should validate configuration correctly', () => {
    const validConfig = {
      useLocalModel: false,
      apiKey: 'valid-key',
      localEndpointUrl: 'http://localhost:11434/v1',
      localModelName: 'llama3.1:8b'
    };

    const invalidConfig = {
      useLocalModel: false,
      apiKey: '',
      localEndpointUrl: 'http://localhost:11434/v1',
      localModelName: 'llama3.1:8b'
    };

    const validResult = validateConfig(validConfig);
    const invalidResult = validateConfig(invalidConfig);

    expect(validResult.isValid).toBe(true);
    expect(validResult.errors).toHaveLength(0);
    
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.errors).toContain('API key is required for OpenRouter');
  });

  test('should get default model based on configuration', () => {
    const openRouterModel = getDefaultModel(false);
    const localModel = getDefaultModel(true);

    expect(openRouterModel).toBe('google/gemini-2.0-flash-exp:free');
    expect(localModel).toBe('llama3.1:8b');
  });
});



