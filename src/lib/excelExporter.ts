import * as XLSX from 'xlsx';

export interface SOC1ExcelData {
  executiveSummary: {
    reportPeriod: string;
    serviceOrganization: string;
    auditor: string;
    opinion: string;
  };
  controls: Array<{
    id: string;
    description: string;
    type: string;
    effectiveness: string;
    exceptions: string[];
    pageNumbers: number[];
    confidenceScore: number;
  }>;
  findings: Array<{
    id: string;
    description: string;
    severity: string;
    category: string;
    recommendation: string;
    pageNumbers: number[];
    confidenceScore: number;
  }>;
  complianceStatus: {
    overall: string;
    score: number;
    summary: string;
    pageNumbers: number[];
    confidenceScore: number;
  };
}

export class ExcelExporter {
  static generateSOC1Excel(data: SOC1ExcelData, filename: string = 'SOC1_Analysis_Results.xlsx'): void {
    const workbook = XLSX.utils.book_new();

    // 1. Executive Summary Sheet
    const executiveSummaryData = [
      ['SOC1 Report Executive Summary'],
      [''],
      ['Report Period', data.executiveSummary.reportPeriod || 'Not specified'],
      ['Service Organization', data.executiveSummary.serviceOrganization || 'Not specified'],
      ['Auditor', data.executiveSummary.auditor || 'Not specified'],
      ['Opinion', data.executiveSummary.opinion || 'Not specified']
    ];
    
    const executiveSummarySheet = XLSX.utils.aoa_to_sheet(executiveSummaryData);
    XLSX.utils.book_append_sheet(workbook, executiveSummarySheet, 'Executive Summary');

    // 2. Controls Sheet
    const controlsData = [
      ['SOC1 Controls Analysis'],
      [''],
      ['Control ID', 'Description', 'Type', 'Effectiveness', 'Exceptions', 'Page Numbers', 'Confidence Score']
    ];
    
    data.controls.forEach(control => {
      controlsData.push([
        control.id || '',
        control.description || '',
        control.type || '',
        control.effectiveness || '',
        control.exceptions ? control.exceptions.join('; ') : '',
        control.pageNumbers ? control.pageNumbers.join(', ') : '',
        control.confidenceScore || 0
      ]);
    });
    
    const controlsSheet = XLSX.utils.aoa_to_sheet(controlsData);
    XLSX.utils.book_append_sheet(workbook, controlsSheet, 'Controls');

    // 3. Findings Sheet
    const findingsData = [
      ['SOC1 Findings Analysis'],
      [''],
      ['Finding ID', 'Description', 'Severity', 'Category', 'Recommendation', 'Page Numbers', 'Confidence Score']
    ];
    
    data.findings.forEach(finding => {
      findingsData.push([
        finding.id || '',
        finding.description || '',
        finding.severity || '',
        finding.category || '',
        finding.recommendation || '',
        finding.pageNumbers ? finding.pageNumbers.join(', ') : '',
        finding.confidenceScore || 0
      ]);
    });
    
    const findingsSheet = XLSX.utils.aoa_to_sheet(findingsData);
    XLSX.utils.book_append_sheet(workbook, findingsSheet, 'Findings');

    // 4. Compliance Status Sheet
    const complianceData = [
      ['SOC1 Compliance Status'],
      [''],
      ['Overall Status', data.complianceStatus.overall || 'Not assessed'],
      ['Compliance Score', data.complianceStatus.score || 0],
      ['Summary', data.complianceStatus.summary || 'No summary provided'],
      ['Page Numbers', data.complianceStatus.pageNumbers ? data.complianceStatus.pageNumbers.join(', ') : ''],
      ['Confidence Score', data.complianceStatus.confidenceScore || 0]
    ];
    
    const complianceSheet = XLSX.utils.aoa_to_sheet(complianceData);
    XLSX.utils.book_append_sheet(workbook, complianceSheet, 'Compliance Status');

    // 5. Summary Dashboard Sheet
    const summaryData = [
      ['SOC1 Analysis Summary Dashboard'],
      [''],
      ['Total Controls', data.controls.length],
      ['Effective Controls', data.controls.filter(c => c.effectiveness === 'effective').length],
      ['Ineffective Controls', data.controls.filter(c => c.effectiveness === 'ineffective').length],
      ['Not Tested Controls', data.controls.filter(c => c.effectiveness === 'not_tested').length],
      [''],
      ['Total Findings', data.findings.length],
      ['Critical Findings', data.findings.filter(f => f.severity === 'critical').length],
      ['High Severity Findings', data.findings.filter(f => f.severity === 'high').length],
      ['Medium Severity Findings', data.findings.filter(f => f.severity === 'medium').length],
      ['Low Severity Findings', data.findings.filter(f => f.severity === 'low').length],
      [''],
      ['Overall Compliance', data.complianceStatus.overall || 'Not assessed'],
      ['Compliance Score', data.complianceStatus.score || 0]
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary Dashboard');

    // Generate and download the Excel file
    XLSX.writeFile(workbook, filename);
  }

  static generateTimestampedFilename(baseName: string = 'SOC1_Analysis'): string {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    return `${baseName}_${timestamp}.xlsx`;
  }
}
