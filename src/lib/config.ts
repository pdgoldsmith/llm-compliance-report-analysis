import { APIConfig } from './openRouterAPI';

// Default configuration values
const DEFAULT_CONFIG: APIConfig = {
  useLocalModel: true,
  apiKey: '',
  localEndpointUrl: 'http://localhost:11434/v1',
  localModelName: 'llama3.1:8b'
};

// Environment variable keys
const ENV_KEYS = {
  USE_LOCAL_MODEL: 'VITE_USE_LOCAL_MODEL',
  API_KEY: 'VITE_API_KEY',
  LOCAL_ENDPOINT_URL: 'VITE_LOCAL_ENDPOINT_URL',
  LOCAL_MODEL_NAME: 'VITE_LOCAL_MODEL_NAME'
} as const;

/**
 * Get configuration from environment variables with fallbacks
 */
export function getConfigFromEnv(): Partial<APIConfig> {
  const config: Partial<APIConfig> = {};

  // Parse boolean environment variable
  const useLocalModel = import.meta.env[ENV_KEYS.USE_LOCAL_MODEL];
  if (useLocalModel !== undefined) {
    config.useLocalModel = useLocalModel === 'true' || useLocalModel === '1';
  }

  // Get API key from environment
  const apiKey = import.meta.env[ENV_KEYS.API_KEY];
  if (apiKey) {
    config.apiKey = apiKey;
  }

  // Get local endpoint URL from environment
  const localEndpointUrl = import.meta.env[ENV_KEYS.LOCAL_ENDPOINT_URL];
  if (localEndpointUrl) {
    config.localEndpointUrl = localEndpointUrl;
  }

  // Get local model name from environment
  const localModelName = import.meta.env[ENV_KEYS.LOCAL_MODEL_NAME];
  if (localModelName) {
    config.localModelName = localModelName;
  }

  return config;
}

/**
 * Get complete configuration with environment variables and defaults
 */
export function getAPIConfig(overrides: Partial<APIConfig> = {}): APIConfig {
  const envConfig = getConfigFromEnv();
  
  return {
    ...DEFAULT_CONFIG,
    ...envConfig,
    ...overrides
  };
}

/**
 * Validate configuration
 */
export function validateConfig(config: APIConfig): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.apiKey && !config.useLocalModel) {
    errors.push('API key is required for OpenRouter');
  }

  if (config.useLocalModel) {
    if (!config.localEndpointUrl) {
      errors.push('Local endpoint URL is required when using local models');
    }
    
    if (!config.localModelName) {
      errors.push('Local model name is required when using local models');
    }

    // Validate URL format
    try {
      new URL(config.localEndpointUrl || '');
    } catch {
      errors.push('Invalid local endpoint URL format');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get default model based on configuration
 */
export function getDefaultModel(useLocalModel: boolean): string {
  if (useLocalModel) {
    return DEFAULT_CONFIG.localModelName || 'llama3.1:8b';
  }
  return 'google/gemini-2.0-flash-exp:free';
}



