export interface OpenRouterModel {
  id: string;
  name: string;
  provider: string;
  pricing?: {
    prompt: string;
    completion: string;
  };
  context_length?: number;
  isFree?: boolean;
}

export interface LocalModel {
  id: string;
  name: string;
  provider: string;
  context_length?: number;
  isLocal?: boolean;
}

export interface APIConfig {
  useLocalModel: boolean;
  apiKey: string;
  localEndpointUrl?: string;
  localModelName?: string;
}

export interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Common local models for OpenAI-compatible endpoints
export const LOCAL_MODELS: LocalModel[] = [
  {
    id: 'llama3.1:8b',
    name: 'Llama 3.1 8B',
    provider: 'Meta (Local)',
    context_length: 128000,
    isLocal: true
  },
  {
    id: 'llama3.1:70b',
    name: 'Llama 3.1 70B',
    provider: 'Meta (Local)',
    context_length: 128000,
    isLocal: true
  },
  {
    id: 'codellama:7b',
    name: 'Code Llama 7B',
    provider: 'Meta (Local)',
    context_length: 16000,
    isLocal: true
  },
  {
    id: 'codellama:13b',
    name: 'Code Llama 13B',
    provider: 'Meta (Local)',
    context_length: 16000,
    isLocal: true
  },
  {
    id: 'mistral:7b',
    name: 'Mistral 7B',
    provider: 'Mistral AI (Local)',
    context_length: 32000,
    isLocal: true
  },
  {
    id: 'mixtral:8x7b',
    name: 'Mixtral 8x7B',
    provider: 'Mistral AI (Local)',
    context_length: 32000,
    isLocal: true
  },
  {
    id: 'qwen2.5:7b',
    name: 'Qwen 2.5 7B',
    provider: 'Alibaba (Local)',
    context_length: 32000,
    isLocal: true
  },
  {
    id: 'gemma2:9b',
    name: 'Gemma 2 9B',
    provider: 'Google (Local)',
    context_length: 8192,
    isLocal: true
  }
];

// Top 10 models by usage (as of 2024-2025) + best free model
export const AVAILABLE_MODELS: OpenRouterModel[] = [
  // Free Model with largest context window
  { 
    id: 'google/gemini-2.0-flash-exp:free', 
    name: 'Gemini 2.0 Flash (Free)', 
    provider: 'Google',
    isFree: true,
    context_length: 1000000
  },
  
  // Top 10 Models by Usage
  { 
    id: 'x-ai/grok-beta-2', 
    name: 'Grok Code Fast 1', 
    provider: 'x-ai',
    context_length: 128000
  },
  { 
    id: 'anthropic/claude-3.5-sonnet', 
    name: 'Claude Sonnet 4', 
    provider: 'Anthropic',
    context_length: 200000
  },
  { 
    id: 'openrouter/sonoma-sky-alpha', 
    name: 'Sonoma Sky Alpha', 
    provider: 'OpenRouter',
    context_length: 128000
  },
  { 
    id: 'openai/gpt-4o-mini', 
    name: 'GPT-4.1 Mini', 
    provider: 'OpenAI',
    context_length: 128000
  },
  { 
    id: 'openai/gpt-5', 
    name: 'GPT-5', 
    provider: 'OpenAI',
    context_length: 128000
  },
  { 
    id: 'qwen/qwen-2.5-coder-32b-instruct', 
    name: 'Qwen3 Coder 480B A35B', 
    provider: 'Qwen',
    context_length: 32768
  },
  { 
    id: 'openrouter/sonoma-dusk-alpha', 
    name: 'Sonoma Dusk Alpha', 
    provider: 'OpenRouter',
    context_length: 128000
  },
  { 
    id: 'google/gemini-2.5-flash', 
    name: 'Gemini 2.5 Flash', 
    provider: 'Google',
    context_length: 1000000
  },
  { 
    id: 'google/gemini-2.5-pro', 
    name: 'Gemini 2.5 Pro', 
    provider: 'Google',
    context_length: 2000000
  },
  { 
    id: 'deepseek/deepseek-v3.1', 
    name: 'DeepSeek V3.1', 
    provider: 'DeepSeek',
    context_length: 128000
  }
];

export class OpenRouterAPI {
  private config: APIConfig;
  private baseURL: string;

  constructor(config: APIConfig) {
    this.config = config;
    
    // Use backend proxy for local models, direct connection for OpenRouter
    if (config.useLocalModel) {
      this.baseURL = '/api/local'; // Frontend will proxy to backend
    } else {
      this.baseURL = 'https://openrouter.ai/api/v1';
    }
  }

  // Get available models based on configuration
  static getAvailableModels(useLocalModel: boolean): (OpenRouterModel | LocalModel)[] {
    return useLocalModel ? LOCAL_MODELS : AVAILABLE_MODELS;
  }

  async testConnection(): Promise<boolean> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // For local endpoints, don't include Authorization header
      if (!this.config.useLocalModel) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      // Use the correct endpoint based on provider
      const endpoint = this.config.useLocalModel ? '/v1/models' : '/models';
      
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error(`${this.config.useLocalModel ? 'Local' : 'OpenRouter'} API connection test failed:`, error);
      return false;
    }
  }

  async analyzeSOC1Report(
    pdfText: string, 
    modelId: string,
    onProgress?: (progress: number, message: string) => void
  ): Promise<any> {
    try {
      onProgress?.(5, 'Preparing analysis request...');

      // Estimate token count (rough approximation: 1 token ≈ 4 characters)
      const estimatedTokens = Math.ceil(pdfText.length / 4);
      const maxTokensPerChunk = 25000; // Conservative limit for API calls
      
      if (estimatedTokens <= maxTokensPerChunk) {
        // Single API call for smaller documents
        return await this.analyzeSingleChunk(pdfText, modelId, onProgress);
      } else {
        // Multiple API calls for larger documents
        return await this.analyzeMultipleChunks(pdfText, modelId, onProgress);
      }
    } catch (error) {
      console.error('OpenRouter API analysis failed:', error);
      throw error;
    }
  }

  private async analyzeSingleChunk(
    pdfText: string, 
    modelId: string,
    onProgress?: (progress: number, message: string) => void
  ): Promise<any> {
    try {
      onProgress?.(10, 'Preparing analysis request...');

      // Enhanced SOC1 analysis prompt with HTML table structure awareness
      const systemPrompt = this.config.useLocalModel 
        ? `You are a SOC1 compliance analyst. Analyze the SOC1 report and extract the following information. The document may contain HTML tables in "=== DETECTED TABLES ===" sections. These tables preserve the original structure and relationships. Use both the regular text and HTML table data for analysis. Return your response in this EXACT JSON format with no additional text:

{
  "executiveSummary": {
    "reportPeriod": "extract the report period from the document",
    "serviceOrganization": "extract the service organization name",
    "auditor": "extract the auditor firm name",
    "opinion": "extract the opinion type (unqualified, qualified, adverse, disclaimer)"
  },
  "controlFailures": [
    {
      "id": "CO-1",
      "description": "describe the control failure",
      "type": "preventive or detective or corrective",
      "effectiveness": "ineffective or not_tested",
      "exceptions": ["list any exceptions found"],
      "pageNumbers": [1],
      "sourceTable": "table_id_if_from_structured_data"
    }
  ],
  "exclusions": [
    {
      "id": "EX-1", 
      "description": "describe what is excluded",
      "reason": "reason for exclusion",
      "pageNumbers": [1],
      "sourceTable": "table_id_if_from_structured_data"
    }
  ],
  "carveOuts": [
    {
      "id": "CO-1",
      "description": "describe the sub-service provider carved out", 
      "provider": "provider name",
      "reason": "reason for carve-out",
      "pageNumbers": [1],
      "sourceTable": "table_id_if_from_structured_data"
    }
  ],
  "detectedTables": [
    {
      "id": "table_id",
      "page": 1,
      "type": "control_matrix or exception_list or other",
      "summary": "brief description of table contents",
      "relevantData": ["key data points from table"]
    }
  ]
}

IMPORTANT: 
- Pay special attention to HTML tables in "=== DETECTED TABLES ===" sections
- HTML tables preserve the original structure with <table>, <tr>, <th>, and <td> tags
- For table data, include the table ID in the "sourceTable" field
- Extract control failures, exclusions, and carve-outs from both text and HTML tables
- Include detected tables in the "detectedTables" array with their type and summary
- Use page numbers from the original text or table metadata
- Start your response with { and end with }
- Use proper JSON syntax with quotes around all keys and string values
- If no control failures, exclusions, or carve-outs are found, use empty arrays []
- Extract actual information from the document, don't use placeholder text
- Return ONLY the JSON, no other text`
        : `Extract SOC1 compliance issues from the document. The document may contain HTML tables in "=== DETECTED TABLES ===" sections. These tables preserve the original structure and relationships. Use both the regular text and HTML table data for analysis. Return JSON only.

{
  "executiveSummary": {
    "reportPeriod": "extract report period",
    "serviceOrganization": "extract organization name",
    "auditor": "extract auditor name",
    "opinion": "extract opinion type"
  },
  "controlFailures": [
    {
      "id": "control identifier",
      "description": "control description",
      "type": "preventive or detective or corrective",
      "effectiveness": "ineffective or not_tested",
      "exceptions": ["list exceptions"],
      "pageNumbers": [1],
      "sourceTable": "table_id_if_from_structured_data"
    }
  ],
  "exclusions": [
    {
      "id": "exclusion identifier",
      "description": "what is excluded",
      "reason": "reason for exclusion",
      "pageNumbers": [1],
      "sourceTable": "table_id_if_from_structured_data"
    }
  ],
  "carveOuts": [
    {
      "id": "carveout identifier",
      "description": "sub-service provider carved out",
      "provider": "provider name",
      "reason": "reason for carve-out",
      "pageNumbers": [1],
      "sourceTable": "table_id_if_from_structured_data"
    }
  ],
  "detectedTables": [
    {
      "id": "table_id",
      "page": 1,
      "type": "control_matrix or exception_list or other",
      "summary": "brief description of table contents",
      "relevantData": ["key data points from table"]
    }
  ]
}

Instructions:
1. Pay special attention to HTML tables in "=== DETECTED TABLES ===" sections
2. HTML tables preserve the original structure with <table>, <tr>, <th>, and <td> tags
3. For table data, include the table ID in the "sourceTable" field
4. Extract control failures, exclusions, and carve-outs from both text and HTML tables
5. Include detected tables in the "detectedTables" array with their type and summary
6. Use page numbers from the original text or table metadata
7. Only report actual control failures, exclusions, and carve-outs found in the document.`;

      onProgress?.(30, 'Sending request to AI model...');

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // For local endpoints, don't include Authorization header
      if (!this.config.useLocalModel) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        headers['HTTP-Referer'] = window.location.origin;
        headers['X-Title'] = 'SOC1 Compliance Analyzer';
      }

      // Use the correct model ID based on configuration
      const actualModelId = this.config.useLocalModel 
        ? (this.config.localModelName || modelId)
        : modelId;

      // Use the correct endpoint based on provider
      const endpoint = this.config.useLocalModel ? '/v1/chat/completions' : '/chat/completions';

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: actualModelId,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: `Please analyze this SOC1 report:\n\n${pdfText}`
            }
          ],
          temperature: 0.1,
          max_tokens: 4000,
          // Ensure non-streaming responses from local OpenAI-compatible servers
          // Some local servers default to streaming which leaves message.content empty
          stream: false,
          // Hint JSON mode where supported (ignored by servers that don't support it)
          response_format: { type: 'json_object' }
        }),
      });

      onProgress?.(70, 'Processing AI response...');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Check for specific error types
        if (response.status === 400) {
          const errorMessage = errorData.error?.message || '';
          
          // Check for token length related errors
          if (errorMessage.includes('token') || 
              errorMessage.includes('length') || 
              errorMessage.includes('context') ||
              errorMessage.includes('too long') ||
              errorMessage.includes('exceeded')) {
            throw new Error('The PDF document is too large for analysis. Please try with a shorter document or split it into smaller sections.');
          }
          
          // Check for rate limiting
          if (errorMessage.includes('rate') || errorMessage.includes('limit')) {
            throw new Error('API rate limit exceeded. Please wait a moment and try again.');
          }
        }
        
        // Check for server errors that might indicate connection issues
        if (response.status >= 500) {
          throw new Error('The AI service is temporarily unavailable. Please try again later.');
        }
        
        throw new Error(`API request failed: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data: any = await response.json();
      
      onProgress?.(90, 'Parsing results...');

      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from AI model');
      }

      // Safe JSON stringification that handles circular references and large objects
      const safeStringify = (obj: any, maxDepth: number = 3): string => {
        const seen = new WeakSet();
        let depth = 0;
        
        const replacer = (key: string, value: any) => {
          if (depth > maxDepth) {
            return '[Max Depth Reached]';
          }
          
          if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
              return '[Circular Reference]';
            }
            seen.add(value);
            depth++;
          }
          
          // Handle large strings
          if (typeof value === 'string' && value.length > 1000) {
            return value.substring(0, 1000) + '...[Truncated]';
          }
          
          // Handle large arrays
          if (Array.isArray(value) && value.length > 100) {
            return value.slice(0, 100).concat(['[Array Truncated - showing first 100 items]']);
          }
          
          return value;
        };
        
        try {
          return JSON.stringify(obj, replacer, 2);
        } catch (error) {
          return `[Stringify Error: ${error instanceof Error ? error.message : 'Unknown error'}]`;
        }
      };

      // Normalize content across various OpenAI-compatible servers
      const normalizeContent = (payload: any): string => {
        try {
          const choice = payload?.choices?.[0] ?? {};
          const message = choice.message ?? {};

          // Common: string content
          if (typeof message.content === 'string' && message.content.trim()) {
            return message.content;
          }

          // Some providers: choice.content exists directly
          if (typeof choice.content === 'string' && choice.content.trim()) {
            return choice.content;
          }

          // Some servers: content as array of parts
          if (Array.isArray(message.content)) {
            const joined = message.content
              .map((part: any) => (typeof part === 'string' ? part : part?.text ?? ''))
              .join('');
            if (joined.trim()) return joined;
          }

          // If we have a tool call or non-empty message object, safely stringify it
          if (message && Object.keys(message).length > 0) {
            return safeStringify(message);
          }

          // Fallback: safely stringify the full payload (last resort)
          return safeStringify(payload);
        } catch (_e) {
          return '';
        }
      };

      const content = normalizeContent(data);
      
      // Try to parse JSON from the response with multiple fallback strategies
      try {
        console.log('Raw AI response:', content); // Debug log
        console.log('Response length:', typeof content === 'string' ? content.length : 0);
        if (typeof content === 'string') {
          console.log('First 200 chars:', content.substring(0, 200));
          console.log('Last 200 chars:', content.substring(Math.max(0, content.length - 200)));
        }
        
        let result: any = null;
        
        // Strategy 1: Try to find JSON object in the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            result = JSON.parse(jsonMatch[0]);
            console.log('Parsed AI result (Strategy 1):', result);
          } catch (e) {
            console.warn('Strategy 1 failed, trying Strategy 2...');
          }
        }
        
        // Strategy 2: Try to parse the entire content as JSON
        if (!result) {
          try {
            result = JSON.parse(content);
            console.log('Parsed AI result (Strategy 2):', result);
          } catch (e) {
            console.warn('Strategy 2 failed, trying Strategy 3...');
          }
        }
        
        // Strategy 3: Try to extract JSON from code blocks
        if (!result) {
          const codeBlockMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
          if (codeBlockMatch) {
            try {
              result = JSON.parse(codeBlockMatch[1]);
              console.log('Parsed AI result (Strategy 3):', result);
            } catch (e) {
              console.warn('Strategy 3 failed, trying Strategy 4...');
            }
          }
        }
        
        // Strategy 4: Try to clean and parse the content
        if (!result) {
          try {
            // Remove common prefixes/suffixes that might interfere
            const cleanedContent = content
              .replace(/^[^{]*/, '') // Remove everything before first {
              .replace(/[^}]*$/, '') // Remove everything after last }
              .trim();
            
            if (cleanedContent.startsWith('{') && cleanedContent.endsWith('}')) {
              result = JSON.parse(cleanedContent);
              console.log('Parsed AI result (Strategy 4):', result);
            }
          } catch (e) {
            console.warn('Strategy 4 failed');
          }
        }

        // Strategy 5: Enhanced parsing for local models (more aggressive cleaning)
        if (!result && this.config.useLocalModel) {
          try {
            // More aggressive cleaning for local models
            let cleanedContent = content
              .replace(/^[^{]*/, '') // Remove everything before first {
              .replace(/[^}]*$/, '') // Remove everything after last }
              .replace(/\n\s*\n/g, '\n') // Remove extra newlines
              .replace(/,\s*}/g, '}') // Remove trailing commas
              .replace(/,\s*]/g, ']') // Remove trailing commas in arrays
              .trim();
            
            // Try to fix common JSON issues
            cleanedContent = cleanedContent
              .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Add quotes around unquoted keys
              .replace(/:\s*([^",{\[\s][^,}\]]*?)([,}\]])/g, ': "$1"$2'); // Add quotes around unquoted string values (fixed regex)
            
            if (cleanedContent.startsWith('{') && cleanedContent.endsWith('}')) {
              result = JSON.parse(cleanedContent);
              console.log('Parsed AI result (Strategy 5 - Local Model Enhanced):', result);
            }
          } catch (e) {
            console.warn('Strategy 5 failed:', e.message);
          }
        }
        
        if (result) {
          // Transform the result to match the expected format
          const transformedResult = this.transformSOC1Result(result);
          console.log('Transformed result:', transformedResult); // Debug log
          
          onProgress?.(100, 'Analysis complete!');
          return transformedResult;
        } else {
          console.error('All JSON parsing strategies failed. Full content:', content);
          
          // Fallback: Try to extract information from natural language response
          console.log('Attempting to extract information from natural language response...');
          result = this.extractFromNaturalLanguage(content);
          
          if (result) {
            console.log('Successfully extracted information from natural language:', result);
            const transformedResult = this.transformSOC1Result(result);
            onProgress?.(100, 'Analysis complete with natural language extraction!');
            return transformedResult;
          } else {
            // Final fallback: Create a basic result structure from the raw content
            console.log('Creating fallback result structure...');
            result = this.createFallbackResult(content);
            
            // Transform the fallback result too
            const transformedResult = this.transformSOC1Result(result);
            console.log('Transformed fallback result:', transformedResult);
            
            onProgress?.(100, 'Analysis complete with fallback!');
            return transformedResult;
          }
        }
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', parseError);
        console.log('Raw AI response:', content);
        throw new Error(`AI response could not be parsed as valid JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }

    } catch (error) {
      console.error('OpenRouter API analysis failed:', error);
      
      // Handle specific error types
      if (error instanceof Error) {
        // Check for network/connection errors
        if (error.message.includes('fetch') || 
            error.message.includes('network') || 
            error.message.includes('timeout') ||
            error.message.includes('connection') ||
            error.message.includes('Failed to fetch')) {
          throw new Error('Network connection failed. Please check your internet connection and try again.');
        }
        
        // Check for token length errors (already handled above, but catch any that slip through)
        if (error.message.includes('token') || 
            error.message.includes('length') || 
            error.message.includes('context') ||
            error.message.includes('too large')) {
          throw new Error('The PDF document is too large for analysis. Please try with a shorter document or split it into smaller sections.');
        }
        
        // Re-throw the original error if it's already a user-friendly message
        throw error;
      }
      
      // Handle unknown errors
      throw new Error('An unexpected error occurred during analysis. Please try again.');
    }
  }

  private async analyzeMultipleChunks(
    pdfText: string, 
    modelId: string,
    onProgress?: (progress: number, message: string) => void
  ): Promise<any> {
    try {
      onProgress?.(10, 'Splitting document into chunks...');
      
      // Split the PDF text into chunks
      const chunks = this.splitTextIntoChunks(pdfText, 25000);
      const totalChunks = chunks.length;
      
      onProgress?.(15, `Analyzing ${totalChunks} document sections...`);
      
      const chunkResults: any[] = [];
      
      // Analyze each chunk
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const progressPercent = 15 + ((i / totalChunks) * 70); // 15% to 85%
        
        onProgress?.(progressPercent, `Analyzing section ${i + 1} of ${totalChunks}...`);
        
        try {
          const chunkResult = await this.analyzeSingleChunk(chunk, modelId, (chunkProgress, message) => {
            // Update progress within the chunk
            const chunkProgressPercent = progressPercent + ((chunkProgress / 100) * (70 / totalChunks));
            onProgress?.(chunkProgressPercent, `Section ${i + 1}: ${message}`);
          });
          
          chunkResults.push(chunkResult);
        } catch (error) {
          console.warn(`Failed to analyze chunk ${i + 1}:`, error);
          // Continue with other chunks even if one fails
        }
      }
      
      onProgress?.(90, 'Combining results from all sections...');
      
      // Combine results from all chunks
      const combinedResult = this.combineChunkResults(chunkResults);
      
      onProgress?.(100, 'Analysis complete!');
      return combinedResult;
      
    } catch (error) {
      console.error('Multi-chunk analysis failed:', error);
      throw error;
    }
  }

  private splitTextIntoChunks(text: string, maxTokens: number): string[] {
    // Rough approximation: 1 token ≈ 4 characters
    const maxChars = maxTokens * 4;
    const chunks: string[] = [];
    
    // Try to split at natural boundaries (paragraphs, pages, etc.)
    const paragraphs = text.split(/\n\s*\n/);
    let currentChunk = '';
    
    for (const paragraph of paragraphs) {
      // If adding this paragraph would exceed the limit, start a new chunk
      if (currentChunk.length + paragraph.length > maxChars && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = paragraph;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      }
    }
    
    // Add the last chunk if it has content
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    // If we still have chunks that are too large, split them further
    const finalChunks: string[] = [];
    for (const chunk of chunks) {
      if (chunk.length > maxChars) {
        // Split large chunks by sentences
        const sentences = chunk.split(/[.!?]+\s+/);
        let currentSubChunk = '';
        
        for (const sentence of sentences) {
          if (currentSubChunk.length + sentence.length > maxChars && currentSubChunk.length > 0) {
            finalChunks.push(currentSubChunk.trim());
            currentSubChunk = sentence;
          } else {
            currentSubChunk += (currentSubChunk ? '. ' : '') + sentence;
          }
        }
        
        if (currentSubChunk.trim()) {
          finalChunks.push(currentSubChunk.trim());
        }
      } else {
        finalChunks.push(chunk);
      }
    }
    
    return finalChunks;
  }

  private combineChunkResults(chunkResults: any[]): any {
    if (chunkResults.length === 0) {
      throw new Error('No valid results from any document sections');
    }
    
    // Initialize combined result structure
    const combined: any = {
      executiveSummary: null,
      controlFailures: [],
      exclusions: [],
      carveOuts: []
    };
    
    // Combine results from all chunks
    for (const result of chunkResults) {
      if (!result || !result.rawResult) continue;
      
      const raw = result.rawResult;
      
      // Use the first executive summary found
      if (raw.executiveSummary && !combined.executiveSummary) {
        combined.executiveSummary = raw.executiveSummary;
      }
      
      // Combine all control failures
      if (raw.controlFailures && Array.isArray(raw.controlFailures)) {
        combined.controlFailures.push(...raw.controlFailures);
      }
      
      // Combine all exclusions
      if (raw.exclusions && Array.isArray(raw.exclusions)) {
        combined.exclusions.push(...raw.exclusions);
      }
      
      // Combine all carve-outs
      if (raw.carveOuts && Array.isArray(raw.carveOuts)) {
        combined.carveOuts.push(...raw.carveOuts);
      }
    }
    
    // Remove duplicates based on ID
    const uniqueControlFailures = this.removeDuplicates(combined.controlFailures, 'id');
    const uniqueExclusions = this.removeDuplicates(combined.exclusions, 'id');
    const uniqueCarveOuts = this.removeDuplicates(combined.carveOuts, 'id');
    
    combined.controlFailures = uniqueControlFailures;
    combined.exclusions = uniqueExclusions;
    combined.carveOuts = uniqueCarveOuts;
    
    // Transform the combined result
    return this.transformSOC1Result(combined);
  }

  private removeDuplicates(items: any[], idField: string): any[] {
    const seen = new Set();
    return items.filter(item => {
      const id = item[idField];
      if (seen.has(id)) {
        return false;
      }
      seen.add(id);
      return true;
    });
  }

  private transformSOC1Result(aiResult: any): any {
    // Transform the AI result to match the expected ResultsDisplay format
    const findings: any[] = [];
    
    // Extract findings from control failures
    if (aiResult.controlFailures && Array.isArray(aiResult.controlFailures)) {
      aiResult.controlFailures.forEach((control: any, index: number) => {
        findings.push({
          id: `control-failure-${index}`,
          attributeName: control.id || `Control Failure ${index + 1}`,
          description: control.description || 'Control failure description not provided',
          value: control.effectiveness || 'Not specified',
          pageNumbers: control.pageNumbers || [1],
          confidence: control.confidenceScore || 0.8,
          category: 'Control Failures',
          dataType: 'string',
          critical: control.effectiveness === 'ineffective'
        });
      });
    }
    
    // Extract findings from exclusions
    if (aiResult.exclusions && Array.isArray(aiResult.exclusions)) {
      aiResult.exclusions.forEach((exclusion: any, index: number) => {
        findings.push({
          id: `exclusion-${index}`,
          attributeName: exclusion.id || `Exclusion ${index + 1}`,
          description: exclusion.description || 'Exclusion description not provided',
          value: exclusion.reason || 'No reason provided',
          pageNumbers: exclusion.pageNumbers || [1],
          confidence: exclusion.confidenceScore || 0.9,
          category: 'Exclusions',
          dataType: 'string',
          critical: false
        });
      });
    }
    
    // Extract findings from carve-outs
    if (aiResult.carveOuts && Array.isArray(aiResult.carveOuts)) {
      aiResult.carveOuts.forEach((carveOut: any, index: number) => {
        findings.push({
          id: `carveout-${index}`,
          attributeName: carveOut.id || `Carve-Out ${index + 1}`,
          description: carveOut.description || 'Carve-out description not provided',
          value: `${carveOut.provider || 'Unknown Provider'} - ${carveOut.reason || 'No reason provided'}`,
          pageNumbers: carveOut.pageNumbers || [1],
          confidence: carveOut.confidenceScore || 0.9,
          category: 'Carve-Outs',
          dataType: 'string',
          critical: false
        });
      });
    }
    
    // Add executive summary as a finding
    if (aiResult.executiveSummary) {
      const summary = aiResult.executiveSummary;
      findings.push({
        id: 'executive-summary',
        attributeName: 'Executive Summary',
        description: 'SOC1 Report Executive Summary',
        value: {
          reportPeriod: summary.reportPeriod || 'Not specified',
          serviceOrganization: summary.serviceOrganization || 'Not specified',
          auditor: summary.auditor || 'Not specified',
          opinion: summary.opinion || 'Not specified'
        },
        pageNumbers: [1],
        confidence: 1.0,
        category: 'Executive Summary',
        dataType: 'object',
        critical: false
      });
    }
    
    return {
      findings,
      categories: ['Control Failures', 'Exclusions', 'Carve-Outs', 'Executive Summary'],
      rawResult: aiResult // Keep the original result for debugging
    };
  }

  private extractFromNaturalLanguage(content: string): any | null {
    try {
      console.log('Extracting information from natural language response...');
      
      // Initialize result structure
      const result: any = {
        executiveSummary: {
          reportPeriod: 'Not specified',
          serviceOrganization: 'Not specified',
          auditor: 'Not specified',
          opinion: 'Not specified'
        },
        controlFailures: [],
        exclusions: [],
        carveOuts: []
      };

      // Extract Service Organization (multiple patterns)
      const serviceOrgPatterns = [
        /service organization[:\s]*([^.\n]+)/i,
        /organization[:\s]*([^.\n]+)/i,
        /company[:\s]*([^.\n]+)/i,
        /entity[:\s]*([^.\n]+)/i
      ];
      
      for (const pattern of serviceOrgPatterns) {
        const match = content.match(pattern);
        if (match && match[1].trim().length > 2) {
          result.executiveSummary.serviceOrganization = match[1].trim();
          break;
        }
      }

      // Extract Auditor (multiple patterns)
      const auditorPatterns = [
        /auditor[:\s]*([^.\n]+)/i,
        /audit firm[:\s]*([^.\n]+)/i,
        /cpa firm[:\s]*([^.\n]+)/i,
        /examiner[:\s]*([^.\n]+)/i
      ];
      
      for (const pattern of auditorPatterns) {
        const match = content.match(pattern);
        if (match && match[1].trim().length > 2) {
          result.executiveSummary.auditor = match[1].trim();
          break;
        }
      }

      // Extract Report Period (multiple patterns)
      const periodPatterns = [
        /report period[:\s]*([^.\n]+)/i,
        /period[:\s]*([^.\n]+)/i,
        /as of[:\s]*([^.\n]+)/i,
        /through[:\s]*([^.\n]+)/i
      ];
      
      for (const pattern of periodPatterns) {
        const match = content.match(pattern);
        if (match && match[1].trim().length > 2) {
          result.executiveSummary.reportPeriod = match[1].trim();
          break;
        }
      }

      // Extract Opinion (multiple patterns)
      const opinionPatterns = [
        /opinion[:\s]*([^.\n]+)/i,
        /unqualified/i,
        /qualified/i,
        /adverse/i,
        /disclaimer/i
      ];
      
      for (const pattern of opinionPatterns) {
        const match = content.match(pattern);
        if (match) {
          if (match[1]) {
            result.executiveSummary.opinion = match[1].trim();
          } else {
            result.executiveSummary.opinion = match[0].trim();
          }
          break;
        }
      }

      // Extract Control Failures
      const controlFailureMatches = content.match(/control failure[^.]*?([^.\n]+)/gi);
      if (controlFailureMatches) {
        controlFailureMatches.forEach((match, index) => {
          result.controlFailures.push({
            id: `extracted-control-failure-${index + 1}`,
            description: match.trim(),
            type: 'unknown',
            effectiveness: 'not_tested',
            exceptions: ['Extracted from natural language'],
            pageNumbers: [1],
            confidenceScore: 0.7
          });
        });
      }

      // Extract Exclusions
      const exclusionMatches = content.match(/exclusion[^.]*?([^.\n]+)/gi);
      if (exclusionMatches) {
        exclusionMatches.forEach((match, index) => {
          result.exclusions.push({
            id: `extracted-exclusion-${index + 1}`,
            description: match.trim(),
            reason: 'Extracted from natural language response',
            pageNumbers: [1],
            confidenceScore: 0.7
          });
        });
      }

      // Extract Carve-outs
      const carveOutMatches = content.match(/carve.out[^.]*?([^.\n]+)/gi);
      if (carveOutMatches) {
        carveOutMatches.forEach((match, index) => {
          result.carveOuts.push({
            id: `extracted-carveout-${index + 1}`,
            description: match.trim(),
            provider: 'Unknown',
            reason: 'Extracted from natural language response',
            pageNumbers: [1],
            confidenceScore: 0.7
          });
        });
      }

      // Check if we extracted any meaningful information
      const hasContent = result.executiveSummary.serviceOrganization !== 'Not specified' ||
                        result.executiveSummary.auditor !== 'Not specified' ||
                        result.controlFailures.length > 0 ||
                        result.exclusions.length > 0 ||
                        result.carveOuts.length > 0;

      if (hasContent) {
        console.log('Successfully extracted information from natural language');
        return result;
      } else {
        console.log('No meaningful information could be extracted from natural language');
        return null;
      }

    } catch (error) {
      console.error('Error extracting from natural language:', error);
      return null;
    }
  }

  private createFallbackResult(content: string): any {
    // Create a basic result structure when JSON parsing fails
    const truncatedContent = content.length > 1000 ? content.substring(0, 1000) + '...' : content;
    
    return {
      executiveSummary: {
        reportPeriod: 'Unable to extract - see raw content',
        serviceOrganization: 'Unable to extract - see raw content',
        auditor: 'Unable to extract - see raw content',
        opinion: 'Unable to extract - see raw content'
      },
      controlFailures: [
        {
          id: 'fallback-control-failure-1',
          description: `Raw AI response could not be parsed as JSON. Response length: ${content.length} characters. Check console for full response.`,
          type: 'unknown',
          effectiveness: 'not_tested',
          exceptions: ['JSON parsing failed'],
          pageNumbers: [1],
          confidenceScore: 0.1
        }
      ],
      exclusions: [
        {
          id: 'fallback-exclusion-1',
          description: `AI response parsing failed. Raw content preview: ${truncatedContent}`,
          reason: 'The local model may not be following the expected JSON format. Check console logs for the full response.',
          pageNumbers: [1],
          confidenceScore: 0.1
        }
      ],
      carveOuts: [
        {
          id: 'fallback-carveout-1',
          description: 'Unable to extract carve-outs due to JSON parsing error',
          provider: 'Unknown',
          reason: 'Local model response format issue. Check console for actual response.',
          pageNumbers: [1],
          confidenceScore: 0.1
        }
      ]
    };
  }
}
