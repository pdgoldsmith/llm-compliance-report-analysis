import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Settings, Key, CheckCircle, AlertCircle, Loader2, Server, Cloud } from 'lucide-react';
import { AVAILABLE_MODELS, LOCAL_MODELS, OpenRouterModel, LocalModel } from '@/lib/openRouterAPI';

interface ConfigurationPanelProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  isConnected: boolean;
  isTesting: boolean;
  onTestConnection: () => void;
  useLocalModel: boolean;
  setUseLocalModel: (useLocal: boolean) => void;
  localEndpointUrl: string;
  setLocalEndpointUrl: (url: string) => void;
  localModelName: string;
  setLocalModelName: (name: string) => void;
}

// Use the updated model list from OpenRouter API

export const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  apiKey,
  setApiKey,
  selectedModel,
  setSelectedModel,
  isConnected,
  isTesting,
  onTestConnection,
  useLocalModel,
  setUseLocalModel,
  localEndpointUrl,
  setLocalEndpointUrl,
  localModelName,
  setLocalModelName
}) => {
  const [showApiKey, setShowApiKey] = useState(false);

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return key;
    return key.substring(0, 4) + '•'.repeat(key.length - 8) + key.substring(key.length - 4);
  };

  const availableModels = useLocalModel ? LOCAL_MODELS : AVAILABLE_MODELS;

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
          {/* Model Type Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Model Provider
            </Label>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                <Cloud className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">OpenRouter</span>
              </div>
              <Switch
                checked={useLocalModel}
                onCheckedChange={setUseLocalModel}
                className="data-[state=checked]:bg-primary"
              />
              <div className="flex items-center space-x-2">
                <Server className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Local / Privately Hosted</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {useLocalModel 
                ? 'Using local or privately hosted OpenAI-compatible endpoint'
                : 'Using OpenRouter cloud service'
              }
            </p>
          </div>
          {/* API Key Section */}
          {!useLocalModel && (
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
          )}

          {/* Local Endpoint Configuration */}
          {useLocalModel && (
            <>
              <div className="space-y-2">
                <Label htmlFor="local-endpoint" className="text-sm font-medium text-foreground">
                  Local Endpoint URL
                </Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <Server className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <Input
                    id="local-endpoint"
                    type="url"
                    value={localEndpointUrl}
                    onChange={(e) => setLocalEndpointUrl(e.target.value)}
                    placeholder="http://localhost:11434/v1"
                    className="pl-10 bg-background border-border"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  URL of your local OpenAI-compatible endpoint (e.g., Ollama, llama.cpp)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="local-model" className="text-sm font-medium text-foreground">
                  Local Model Name
                </Label>
                <Input
                  id="local-model"
                  type="text"
                  value={localModelName}
                  onChange={(e) => setLocalModelName(e.target.value)}
                  placeholder="llama3.1:8b"
                  className="bg-background border-border"
                />
                <p className="text-xs text-muted-foreground">
                  Model identifier as recognized by your local endpoint
                </p>
              </div>
            </>
          )}

          {/* Model Selection - Only show for OpenRouter */}
          {!useLocalModel && (
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
                        <div className="flex items-center gap-2">
                          <span>{model.name}</span>
                          {'isFree' in model && model.isFree && (
                            <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                              FREE
                            </span>
                          )}
                          {'isLocal' in model && model.isLocal && (
                            <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                              LOCAL
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground ml-2">{model.provider}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Test Connection */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={onTestConnection}
              disabled={(!useLocalModel && !apiKey) || (!useLocalModel && !selectedModel) || (useLocalModel && !localModelName) || isTesting}
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
                <span>{useLocalModel ? 'Local/private endpoint' : 'API'} connection verified</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};