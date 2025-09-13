import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Key, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface ConfigurationPanelProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  isConnected: boolean;
  isTesting: boolean;
  onTestConnection: () => void;
}

const availableModels = [
  { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI' },
  { id: 'openai/gpt-4', name: 'GPT-4', provider: 'OpenAI' },
  { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic' },
  { id: 'anthropic/claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'Anthropic' },
  { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic' },
  { id: 'google/gemini-pro', name: 'Gemini Pro', provider: 'Google' },
];

export const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  apiKey,
  setApiKey,
  selectedModel,
  setSelectedModel,
  isConnected,
  isTesting,
  onTestConnection
}) => {
  const [showApiKey, setShowApiKey] = useState(false);

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return key;
    return key.substring(0, 4) + '•'.repeat(key.length - 8) + key.substring(key.length - 4);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-lg bg-gradient-primary flex items-center justify-center">
          <Settings className="w-3 h-3 text-primary-foreground" />
        </div>
        <h2 className="text-lg font-medium text-foreground">AI Configuration</h2>
      </div>

      <Card className="bg-gradient-card border shadow-card">
        <div className="p-4 space-y-4">
          {/* API Key Section */}
          <div className="space-y-2">
            <Label htmlFor="api-key" className="text-sm font-medium text-foreground">
              OpenRouter API Key
            </Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Key className="w-4 h-4 text-muted-foreground" />
              </div>
              <Input
                id="api-key"
                type={showApiKey ? "text" : "password"}
                value={showApiKey ? apiKey : maskApiKey(apiKey)}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-or-v1-..."
                className="pl-10 pr-12 bg-background border-border"
                onFocus={() => setShowApiKey(true)}
                onBlur={() => setShowApiKey(false)}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {isConnected && (
                  <CheckCircle className="w-4 h-4 text-success" />
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Your API key is stored locally and never sent to our servers.{' '}
              <a 
                href="https://openrouter.ai/keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Get your key from OpenRouter
              </a>
            </p>
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <Label htmlFor="model-select" className="text-sm font-medium text-foreground">
              AI Model
            </Label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger id="model-select" className="bg-background border-border">
                <SelectValue placeholder="Select an AI model" />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{model.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">{model.provider}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Test Connection */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={onTestConnection}
              disabled={!apiKey || !selectedModel || isTesting}
              variant={isConnected ? "success" : "outline"}
            >
              {isTesting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : isConnected ? (
                <CheckCircle className="w-4 h-4 mr-2" />
              ) : (
                <AlertCircle className="w-4 h-4 mr-2" />
              )}
              {isTesting ? 'Testing...' : isConnected ? 'Connected' : 'Test Connection'}
            </Button>
            
            {isConnected && (
              <div className="flex items-center gap-2 text-sm text-success">
                <CheckCircle className="w-4 h-4" />
                <span>API connection verified</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};