import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { UploadSection } from '@/components/UploadSection';
import { ConfigurationPanel } from '@/components/ConfigurationPanel';
import { AnalysisInterface } from '@/components/AnalysisInterface';
import { ResultsDisplay } from '@/components/ResultsDisplay';
import { FileSearch, Sparkles, Shield, Zap } from 'lucide-react';

const Index = () => {
  const { toast } = useToast();
  
  // State management
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('openai/gpt-4-turbo');
  const [isConnected, setIsConnected] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentTask, setCurrentTask] = useState('');
  const [analysisResults, setAnalysisResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    setTotalPages(Math.floor(Math.random() * 100) + 50); // Mock page count
    toast({
      title: "File uploaded successfully",
      description: `${file.name} has been uploaded and is ready for analysis.`,
    });
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    
    // Mock API test
    setTimeout(() => {
      setIsConnected(true);
      setIsTesting(false);
      toast({
        title: "Connection successful",
        description: "OpenRouter API connection has been verified.",
      });
    }, 2000);
  };

  const handleStartAnalysis = () => {
    setIsAnalyzing(true);
    setCurrentPage(1);
    setCurrentTask('Initializing PDF processing...');
    
    // Mock analysis progress
    const mockAnalysis = () => {
      const tasks = [
        'Extracting text from PDF pages...',
        'Detecting table structures...',
        'Processing with AI model...',
        'Extracting control information...',
        'Analyzing exceptions and deviations...',
        'Finalizing results...'
      ];
      
      let taskIndex = 0;
      let pageCount = 1;
      
      const interval = setInterval(() => {
        setCurrentPage(pageCount);
        setCurrentTask(tasks[taskIndex % tasks.length]);
        
        pageCount += Math.floor(Math.random() * 3) + 1;
        
        if (pageCount >= totalPages) {
          clearInterval(interval);
          setIsAnalyzing(false);
          setShowResults(true);
          setCurrentTask('Analysis complete');
          toast({
            title: "Analysis complete",
            description: "SOC1 report has been successfully analyzed.",
          });
        }
        
        taskIndex++;
      }, 1500);
    };
    
    mockAnalysis();
  };

  const handlePauseAnalysis = () => {
    setIsAnalyzing(false);
    setCurrentTask('Analysis paused');
    toast({
      title: "Analysis paused",
      description: "You can resume the analysis at any time.",
    });
  };

  const handleStopAnalysis = () => {
    setIsAnalyzing(false);
    setCurrentPage(0);
    setCurrentTask('');
    toast({
      title: "Analysis stopped",
      description: "Analysis has been stopped and reset.",
    });
  };

  const handleExport = (format: 'json' | 'csv' | 'pdf') => {
    toast({
      title: `Exporting to ${format.toUpperCase()}`,
      description: "Your analysis results are being prepared for download.",
    });
  };

  const isReady = uploadedFile && apiKey && isConnected;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
                <FileSearch className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">SOC1 Analysis Tool</h1>
                <p className="text-sm text-muted-foreground">AI-powered audit report analysis</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Shield className="w-4 h-4 mr-2" />
                Security
              </Button>
              <Button variant="ghost" size="sm">
                Documentation
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      {!showResults && (
        <section className="container mx-auto px-6 py-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-3 bg-gradient-hero bg-clip-text text-transparent">
              Transform SOC1 Reports into Structured Insights
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Upload your SOC1 audit reports and extract key information with AI precision. 
              Tables, exceptions, and control details are automatically identified and organized.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <Card className="bg-gradient-card border shadow-card">
              <div className="p-4 text-center">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <FileSearch className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-medium text-foreground mb-1">Smart Extraction</h3>
                <p className="text-xs text-muted-foreground">Automatically detect and extract tables, control objectives, and exceptions</p>
              </div>
            </Card>
            
            <Card className="bg-gradient-card border shadow-card">
              <div className="p-4 text-center">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-5 h-5 text-success" />
                </div>
                <h3 className="font-medium text-foreground mb-1">Audit Ready</h3>
                <p className="text-xs text-muted-foreground">Professional-grade analysis with page references and confidence scores</p>
              </div>
            </Card>
            
            <Card className="bg-gradient-card border shadow-card">
              <div className="p-4 text-center">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-5 h-5 text-warning" />
                </div>
                <h3 className="font-medium text-foreground mb-1">Fast Processing</h3>
                <p className="text-xs text-muted-foreground">Process 100+ page reports in under 2 minutes with OpenRouter AI</p>
              </div>
            </Card>
          </div>
        </section>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-6 pb-12">
        {!showResults ? (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Upload Section */}
            <div>
              <UploadSection
                onFileUpload={handleFileUpload}
                uploadedFile={uploadedFile}
                isProcessing={isAnalyzing}
              />
            </div>
            
            {/* Configuration Section */}
            <div>
              <ConfigurationPanel
                apiKey={apiKey}
                setApiKey={setApiKey}
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
                isConnected={isConnected}
                isTesting={isTesting}
                onTestConnection={handleTestConnection}
              />
            </div>

            {/* Analysis Section */}
            <div>
              <AnalysisInterface
                isReady={isReady}
                isAnalyzing={isAnalyzing}
                currentPage={currentPage}
                totalPages={totalPages}
                onStartAnalysis={handleStartAnalysis}
                onPauseAnalysis={handlePauseAnalysis}
                onStopAnalysis={handleStopAnalysis}
                currentTask={currentTask}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setShowResults(false)}
              >
                ← Back to Analysis
              </Button>
            </div>
            
            <ResultsDisplay
              findings={[]}
              categories={[]}
              onExport={handleExport}
              isLoading={false}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
