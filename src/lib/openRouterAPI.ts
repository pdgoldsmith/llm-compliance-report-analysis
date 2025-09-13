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
  private apiKey: string;
  private baseURL = 'https://openrouter.ai/api/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('OpenRouter API connection test failed:', error);
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

      // Optimized SOC1 analysis prompt - working version with token savings
      const systemPrompt = `Extract SOC1 compliance issues. Return JSON only.

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
      "pageNumbers": [1]
    }
  ],
  "exclusions": [
    {
      "id": "exclusion identifier",
      "description": "what is excluded",
      "reason": "reason for exclusion",
      "pageNumbers": [1]
    }
  ],
  "carveOuts": [
    {
      "id": "carveout identifier",
      "description": "sub-service provider carved out",
      "provider": "provider name",
      "reason": "reason for carve-out",
      "pageNumbers": [1]
    }
  ]
}

Only report control failures, exclusions, and carve-outs.`;

      onProgress?.(30, 'Sending request to AI model...');

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'SOC1 Compliance Analyzer',
        },
        body: JSON.stringify({
          model: modelId,
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

      const data: OpenRouterResponse = await response.json();
      
      onProgress?.(90, 'Parsing results...');

      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from AI model');
      }

      const content = data.choices[0].message.content;
      
      // Try to parse JSON from the response with multiple fallback strategies
      try {
        console.log('Raw AI response:', content); // Debug log
        
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
            let cleanedContent = content
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
        
        if (result) {
          // Transform the result to match the expected format
          const transformedResult = this.transformSOC1Result(result);
          console.log('Transformed result:', transformedResult); // Debug log
          
          onProgress?.(100, 'Analysis complete!');
          return transformedResult;
        } else {
          console.error('All JSON parsing strategies failed. Full content:', content);
          
          // Fallback: Create a basic result structure from the raw content
          console.log('Creating fallback result structure...');
          result = this.createFallbackResult(content);
          
          // Transform the fallback result too
          const transformedResult = this.transformSOC1Result(result);
          console.log('Transformed fallback result:', transformedResult);
          
          onProgress?.(100, 'Analysis complete with fallback!');
          return transformedResult;
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

  private createFallbackResult(content: string): any {
    // Create a basic result structure when JSON parsing fails
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
          description: 'Raw AI response could not be parsed as JSON. Please review the console logs for the actual response.',
          type: 'unknown',
          effectiveness: 'not_tested',
          exceptions: ['Parsing error occurred'],
          pageNumbers: [1],
          confidenceScore: 0.1
        }
      ],
      exclusions: [
        {
          id: 'fallback-exclusion-1',
          description: 'AI response parsing failed. Raw content: ' + content.substring(0, 500) + '...',
          reason: 'Please check the console logs for the full AI response and try again.',
          pageNumbers: [1],
          confidenceScore: 0.1
        }
      ],
      carveOuts: [
        {
          id: 'fallback-carveout-1',
          description: 'Unable to extract carve-outs due to parsing error',
          provider: 'Unknown',
          reason: 'Please review console logs for the actual response.',
          pageNumbers: [1],
          confidenceScore: 0.1
        }
      ]
    };
  }
}
