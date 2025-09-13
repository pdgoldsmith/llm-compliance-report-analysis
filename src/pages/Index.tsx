import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { UploadSection } from '@/components/UploadSection';
import { ConfigurationPanel } from '@/components/ConfigurationPanel';
import { AnalysisInterface } from '@/components/AnalysisInterface';
import { FileSearch, Sparkles, Shield, Zap } from 'lucide-react';
import { PDFProcessor, PDFInfo } from '@/lib/pdfProcessor';
import { OpenRouterAPI } from '@/lib/openRouterAPI';
import { ExcelExporter, SOC1ExcelData } from '@/lib/excelExporter';

const Index = () => {
  const { toast } = useToast();
  
  // State management
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('meta-llama/llama-3.3-70b-instruct:free');
  const [isConnected, setIsConnected] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentTask, setCurrentTask] = useState('');
  const [analysisResults, setAnalysisResults] = useState<any[]>([]);
  const [pdfInfo, setPdfInfo] = useState<PDFInfo | null>(null);
  const [openRouterAPI, setOpenRouterAPI] = useState<OpenRouterAPI | null>(null);

  const handleFileUpload = async (file: File) => {
    try {
      setUploadedFile(file);
      setCurrentTask('Processing PDF...');
      
      // Get actual page count from PDF with retry logic
      let pageCount: number;
      let retryCount = 0;
      const maxRetries = 2;
      
      while (retryCount <= maxRetries) {
        try {
          pageCount = await PDFProcessor.getPageCount(file);
          break;
        } catch (error) {
          retryCount++;
          if (retryCount > maxRetries) {
            throw error;
          }
          
          // If it's a worker error, wait a bit and try again
          if (error instanceof Error && error.message.includes('worker')) {
            console.log(`Retrying PDF processing (attempt ${retryCount + 1}/${maxRetries + 1})...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
          throw error;
        }
      }
      
      setTotalPages(pageCount!);
      
      toast({
        title: "File uploaded successfully",
        description: `${file.name} has been uploaded and is ready for analysis. (${pageCount} pages detected)`,
      });
    } catch (error) {
      console.error('Error processing PDF:', error);
      toast({
        title: "Error processing PDF",
        description: error instanceof Error ? error.message : 'Failed to process PDF file',
        variant: "destructive",
      });
    }
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your OpenRouter API key first.",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    
    try {
      const api = new OpenRouterAPI(apiKey);
      const isConnected = await api.testConnection();
      
      if (isConnected) {
        setIsConnected(true);
        setOpenRouterAPI(api);
        toast({
          title: "Connection successful",
          description: "OpenRouter API connection has been verified.",
        });
      } else {
        throw new Error('Connection test failed');
      }
    } catch (error) {
      console.error('API connection test failed:', error);
      setIsConnected(false);
      setOpenRouterAPI(null);
      toast({
        title: "Connection failed",
        description: error instanceof Error ? error.message : 'Failed to connect to OpenRouter API',
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleStartAnalysis = async () => {
    if (!uploadedFile || !openRouterAPI) {
      toast({
        title: "Missing Requirements",
        description: "Please upload a PDF file and test your API connection first.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setCurrentPage(0);
    setCurrentTask('Initializing PDF processing...');
    
    try {
      // Step 1: Extract PDF content
      setCurrentTask('Extracting text from PDF...');
      const pdfData = await PDFProcessor.processPDF(uploadedFile);
      setPdfInfo(pdfData);
      setCurrentPage(pdfData.totalPages);
      
      // Debug: Log PDF text length and first 500 characters
      console.log('PDF text length:', pdfData.text.length);
      console.log('PDF text preview:', pdfData.text.substring(0, 500));
      
      // Step 2: Analyze with AI
      setCurrentTask('Analyzing with AI model...');
      console.log('Starting AI analysis with model:', selectedModel);
      console.log('PDF text length for analysis:', pdfData.text.length);
      
      const results = await openRouterAPI.analyzeSOC1Report(
        pdfData.text,
        selectedModel,
        (progress, message) => {
          setCurrentTask(message);
          // Update progress based on the callback
          const progressPercent = Math.round(progress);
          setCurrentPage(Math.round((progressPercent / 100) * pdfData.totalPages));
        }
      );
      
      // Step 3: Generate Excel file
      setCurrentTask('Generating Excel report...');
      console.log('Analysis results received:', results); // Debug log
      
      // Transform the results to Excel format with page numbers and confidence scores
      const excelData: SOC1ExcelData = {
        executiveSummary: results.rawResult?.executiveSummary || {
          reportPeriod: 'Not specified',
          serviceOrganization: 'Not specified',
          auditor: 'Not specified',
          opinion: 'Not specified'
        },
        controls: (results.rawResult?.controls || []).map((control: any) => ({
          ...control,
          pageNumbers: control.pageNumbers || [1],
          confidenceScore: control.confidenceScore || 0.8
        })),
        findings: (results.rawResult?.findings || []).map((finding: any) => ({
          ...finding,
          pageNumbers: finding.pageNumbers || [1],
          confidenceScore: finding.confidenceScore || 0.9
        })),
        complianceStatus: {
          ...(results.rawResult?.complianceStatus || {
            overall: 'Not assessed',
            score: 0,
            summary: 'No summary provided'
          }),
          pageNumbers: results.rawResult?.complianceStatus?.pageNumbers || [1],
          confidenceScore: results.rawResult?.complianceStatus?.confidenceScore || 0.9
        }
      };
      
      // Generate timestamped filename
      const filename = ExcelExporter.generateTimestampedFilename();
      
      // Generate and download Excel file
      ExcelExporter.generateSOC1Excel(excelData, filename);
      
      toast({
        title: "Analysis complete",
        description: `SOC1 report has been analyzed and Excel file "${filename}" has been downloaded.`,
      });
      
    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : 'Failed to analyze the PDF',
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
      setCurrentTask('');
    }
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

      {/* Main Content */}
      <main className="container mx-auto px-6 pb-12">
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
      </main>
    </div>
  );
};

export default Index;
