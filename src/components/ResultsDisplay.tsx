import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  BarChart3, 
  Search, 
  Download, 
  FileText, 
  AlertTriangle, 
  CheckCircle,
  ExternalLink,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Finding {
  id: string;
  attributeName: string;
  description: string;
  value: any;
  pageNumbers: number[];
  confidence: number;
  category: string;
  dataType: string;
  critical?: boolean;
  sourceTable?: string;
}

interface DetectedTable {
  id: string;
  page: number;
  type: string;
  summary: string;
  relevantData: string[];
}

interface ResultsDisplayProps {
  findings: Finding[];
  categories: any[];
  detectedTables?: DetectedTable[];
  onExport: (format: 'json' | 'csv' | 'pdf') => void;
  isLoading: boolean;
}

const mockFindings: Finding[] = [
  {
    id: '1',
    attributeName: 'Service Auditor',
    description: 'Independent auditor who performed the examination',
    value: 'Ernst & Young LLP',
    pageNumbers: [1, 3],
    confidence: 0.95,
    category: 'basic_info',
    dataType: 'text'
  },
  {
    id: '2',
    attributeName: 'Report Period',
    description: 'Time period covered by the report',
    value: 'January 1, 2024 to December 31, 2024',
    pageNumbers: [1, 2],
    confidence: 0.92,
    category: 'basic_info',
    dataType: 'dateRange'
  },
  {
    id: '3',
    attributeName: 'Control Exceptions',
    description: 'Identified exceptions to control operations',
    value: [
      {
        'Control': 'Access Control Review',
        'Exception Description': 'Quarterly review not performed in Q2',
        'Frequency': '1 instance',
        'Management Response': 'Process updated to include automated reminders'
      },
      {
        'Control': 'Data Backup Verification',
        'Exception Description': 'Backup verification failed for 3 days in July',
        'Frequency': '3 instances',
        'Management Response': 'Additional monitoring implemented'
      }
    ],
    pageNumbers: [45, 46, 47],
    confidence: 0.88,
    category: 'exceptions',
    dataType: 'table',
    critical: true
  }
];

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  findings = mockFindings,
  categories = [],
  detectedTables = [],
  onExport,
  isLoading
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredFindings = findings.filter(finding => {
    const matchesSearch = finding.attributeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         finding.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || finding.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedFindings = filteredFindings.reduce((acc, finding) => {
    if (!acc[finding.category]) {
      acc[finding.category] = [];
    }
    acc[finding.category].push(finding);
    return acc;
  }, {} as Record<string, Finding[]>);

  const renderValue = (finding: Finding) => {
    if (finding.dataType === 'table' && Array.isArray(finding.value)) {
      return (
        <div className="mt-3">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border rounded-lg">
              <thead className="bg-muted/50">
                <tr>
                  {Object.keys(finding.value[0] || {}).map(key => (
                    <th key={key} className="px-3 py-2 text-left font-medium border-b border-border">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {finding.value.map((row: any, index: number) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                    {Object.values(row).map((cell: any, cellIndex: number) => (
                      <td key={cellIndex} className="px-3 py-2 border-b border-border/50">
                        {String(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (Array.isArray(finding.value)) {
      return (
        <ul className="mt-2 space-y-1">
          {finding.value.map((item, index) => (
            <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
              {String(item)}
            </li>
          ))}
        </ul>
      );
    }

    return <p className="mt-2 text-foreground font-medium">{String(finding.value)}</p>;
  };

  const getCategoryName = (categoryId: string) => {
    const categoryNames: Record<string, string> = {
      basic_info: 'Basic Information',
      control_environment: 'Control Environment',
      exceptions: 'Exceptions & Deviations',
      subservice_organizations: 'Subservice Organizations'
    };
    return categoryNames[categoryId] || categoryId;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Analysis Results</h2>
        </div>
        
        <Card className="bg-gradient-card border shadow-card">
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-subtle flex items-center justify-center">
              <BarChart3 className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">Analyzing Report</h3>
            <p className="text-muted-foreground">Results will appear here as analysis completes</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Analysis Results</h2>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onExport('json')}>
            <Download className="w-4 h-4 mr-2" />
            JSON
          </Button>
          <Button variant="outline" size="sm" onClick={() => onExport('csv')}>
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => onExport('pdf')}>
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <Card className="bg-gradient-card border shadow-card">
        <div className="p-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search findings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>
      </Card>

      {/* Results Content */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All ({findings.length})</TabsTrigger>
          <TabsTrigger value="basic_info">Basic Info</TabsTrigger>
          <TabsTrigger value="control_environment">Controls</TabsTrigger>
          <TabsTrigger value="exceptions">Exceptions</TabsTrigger>
          <TabsTrigger value="subservice_organizations">Subservice</TabsTrigger>
          <TabsTrigger value="tables">Tables ({detectedTables.length})</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCategory} className="space-y-4">
          {selectedCategory === 'tables' ? (
            // Tables tab content
            detectedTables.length === 0 ? (
              <Card className="bg-gradient-card border shadow-card">
                <div className="p-8 text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Tables Detected</h3>
                  <p className="text-muted-foreground">No structured tables were found in the document</p>
                </div>
              </Card>
            ) : (
              <Card className="bg-gradient-card border shadow-card">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    Detected Tables
                    <Badge variant="secondary">{detectedTables.length}</Badge>
                  </h3>
                  
                  <div className="space-y-4">
                    {detectedTables.map((table) => (
                      <div key={table.id} className="border border-border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-foreground">{table.id}</h4>
                              <Badge variant="outline" className="text-xs">
                                {table.type}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{table.summary}</p>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            <Badge variant="secondary" className="text-xs">
                              Page {table.page}
                            </Badge>
                          </div>
                        </div>

                        {table.relevantData.length > 0 && (
                          <div className="mt-3">
                            <h5 className="text-sm font-medium text-foreground mb-2">Key Data Points:</h5>
                            <ul className="space-y-1">
                              {table.relevantData.map((data, index) => (
                                <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                                  {data}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )
          ) : Object.entries(groupedFindings).length === 0 ? (
            <Card className="bg-gradient-card border shadow-card">
              <div className="p-8 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Results Found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
              </div>
            </Card>
          ) : (
            Object.entries(groupedFindings).map(([category, categoryFindings]) => (
              <Card key={category} className="bg-gradient-card border shadow-card">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    {getCategoryName(category)}
                    <Badge variant="secondary">{categoryFindings.length}</Badge>
                  </h3>
                  
                  <div className="space-y-6">
                    {categoryFindings.map((finding) => (
                      <div key={finding.id} className="border-l-4 border-primary/20 pl-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-foreground">{finding.attributeName}</h4>
                              {finding.critical && (
                                <Badge variant="destructive" className="text-xs">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  Critical
                                </Badge>
                              )}
                              {finding.sourceTable && (
                                <Badge variant="outline" className="text-xs">
                                  From Table: {finding.sourceTable}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{finding.description}</p>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            <Badge 
                              variant={finding.confidence >= 0.9 ? "default" : finding.confidence >= 0.7 ? "secondary" : "destructive"}
                              className="text-xs"
                            >
                              {Math.round(finding.confidence * 100)}% confidence
                            </Badge>
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {renderValue(finding)}

                        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                          <FileText className="w-3 h-3" />
                          <span>Pages: {finding.pageNumbers.join(', ')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};