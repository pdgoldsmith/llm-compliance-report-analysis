import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, Square, Brain, FileText, Loader2 } from 'lucide-react';

interface AnalysisInterfaceProps {
  isReady: boolean;
  isAnalyzing: boolean;
  currentPage: number;
  totalPages: number;
  onStartAnalysis: () => void;
  onPauseAnalysis: () => void;
  onStopAnalysis: () => void;
  currentTask: string;
}

export const AnalysisInterface: React.FC<AnalysisInterfaceProps> = ({
  isReady,
  isAnalyzing,
  currentPage,
  totalPages,
  onStartAnalysis,
  onPauseAnalysis,
  onStopAnalysis,
  currentTask
}) => {
  const progress = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
          <Brain className="w-4 h-4 text-primary-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Analysis Control</h2>
      </div>

      <Card className="bg-gradient-card border shadow-card">
        <div className="p-6 space-y-6">
          {/* Status Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-foreground">Analysis Status</h3>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                isAnalyzing 
                  ? 'bg-primary/10 text-primary border border-primary/20' 
                  : isReady 
                    ? 'bg-success/10 text-success border border-success/20'
                    : 'bg-muted text-muted-foreground'
              }`}>
                {isAnalyzing ? 'Processing' : isReady ? 'Ready' : 'Pending Setup'}
              </div>
            </div>

            {isAnalyzing && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{currentTask}</span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Page {currentPage} of {totalPages}</span>
                  <span>{Math.round(progress)}% complete</span>
                </div>
              </div>
            )}
          </div>

          {/* Analysis Controls */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {!isAnalyzing ? (
                <Button
                  onClick={onStartAnalysis}
                  disabled={!isReady}
                  variant="hero"
                  size="lg"
                  className="flex-1"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Analysis
                </Button>
              ) : (
                <>
                  <Button
                    onClick={onPauseAnalysis}
                    variant="warning"
                    size="lg"
                    className="flex-1"
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </Button>
                  <Button
                    onClick={onStopAnalysis}
                    variant="destructive"
                    size="lg"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Stop
                  </Button>
                </>
              )}
            </div>

            {!isReady && (
              <div className="bg-muted/30 rounded-lg p-4">
                <h4 className="font-medium text-foreground mb-2">Requirements</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
                    <span className="text-muted-foreground">Upload SOC1 PDF report</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
                    <span className="text-muted-foreground">Configure OpenRouter API</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
                    <span className="text-muted-foreground">Test API connection</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Processing Info */}
          {isAnalyzing && (
            <Card className="bg-primary/5 border-primary/20">
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">AI Analysis in Progress</h4>
                    <p className="text-sm text-muted-foreground">
                      Extracting structured data from your SOC1 report using advanced AI models
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </Card>
    </div>
  );
};