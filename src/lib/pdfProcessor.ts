import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker with fallback options
if (typeof window !== 'undefined') {
  const setupWorker = () => {
    // Try local copy first, then fallback to CDN with different approach
    const workerOptions = [
      '/assets/pdf.worker.min.mjs', // Local copy (preferred)
      `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`, // Fallback
    ];
    
    // Use local copy as primary option
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerOptions[0];
  };
  
  setupWorker();
}

export interface TableCell {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  row: number;
  col: number;
}

export interface Table {
  id: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rows: number;
  columns: number;
  cells: TableCell[];
  rawText: string;
}

export interface PDFInfo {
  totalPages: number;
  text: string;
  tables: Table[];
  metadata?: any;
}

export class PDFProcessor {
  private static readonly TABLE_DETECTION_THRESHOLD = 0.9; // Increased threshold for more conservative detection
  private static readonly MIN_TABLE_ROWS = 3; // Increased minimum rows
  private static readonly MIN_TABLE_COLS = 3; // Increased minimum columns
  private static readonly CELL_OVERLAP_THRESHOLD = 0.1;

  static async processPDF(file: File): Promise<PDFInfo> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Add timeout and better error handling
      const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        // Add some options to help with problematic PDFs
        disableAutoFetch: false,
        disableStream: false,
        disableRange: false,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: false
      });
      
      const pdf = await loadingTask.promise;
      
      const totalPages = pdf.numPages;
      let fullText = '';
      let allTables: Table[] = [];
      
      // Extract text and tables from all pages
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const viewport = page.getViewport({ scale: 1.0 });
          
          // Extract plain text
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          fullText += `\n--- Page ${pageNum} ---\n${pageText}\n`;
          
          // Extract and detect tables
          const pageTables = this.extractTablesFromPage(textContent, viewport, pageNum);
          allTables.push(...pageTables);
          
        } catch (pageError) {
          console.warn(`Error processing page ${pageNum}:`, pageError);
          fullText += `\n--- Page ${pageNum} ---\n[Error reading page content]\n`;
        }
      }
      
      // Get metadata
      let metadata = null;
      try {
        const metadataResult = await pdf.getMetadata();
        metadata = metadataResult.info;
      } catch (metadataError) {
        console.warn('Error getting PDF metadata:', metadataError);
      }
      
      return {
        totalPages,
        text: fullText.trim(),
        tables: allTables,
        metadata
      };
    } catch (error) {
      console.error('Error processing PDF:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('worker')) {
          throw new Error('PDF processing is blocked by browser security settings. Please try one of these solutions:\n\n1. Refresh the page and try again\n2. Use a different browser (Chrome, Firefox, Safari)\n3. Disable CORS in your browser (for development only)\n4. Use the application in a different environment\n\nThis is a known limitation when loading PDF.js workers from external CDNs.');
        } else if (error.message.includes('Invalid PDF')) {
          throw new Error('The uploaded file is not a valid PDF or is corrupted.');
        } else if (error.message.includes('password')) {
          throw new Error('This PDF is password-protected and cannot be processed.');
        }
      }
      
      throw new Error(`Failed to process PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  static async getPageCount(file: File): Promise<number> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Try with different loading options to work around worker issues
      const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        disableAutoFetch: false,
        disableStream: false,
        disableRange: false,
        // Add these options to help with worker issues
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: false
      });
      
      const pdf = await loadingTask.promise;
      return pdf.numPages;
    } catch (error) {
      console.error('Error getting page count:', error);
      
      // If worker fails, provide helpful error message
      if (error instanceof Error && error.message.includes('worker')) {
        console.log('Worker failed due to CORS restrictions');
        throw new Error('PDF processing is blocked by browser security settings. Please try one of these solutions:\n\n1. Refresh the page and try again\n2. Use a different browser (Chrome, Firefox, Safari)\n3. Disable CORS in your browser (for development only)\n4. Use the application in a different environment\n\nThis is a known limitation when loading PDF.js workers from external CDNs.');
      }
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('Invalid PDF')) {
          throw new Error('The uploaded file is not a valid PDF or is corrupted.');
        } else if (error.message.includes('password')) {
          throw new Error('This PDF is password-protected and cannot be processed.');
        }
      }
      
      throw new Error(`Failed to get page count: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract tables from a single page using spatial analysis
   */
  private static extractTablesFromPage(textContent: any, viewport: any, pageNumber: number): Table[] {
    const textItems = textContent.items.filter((item: any) => item.str && item.str.trim().length > 0);
    
    if (textItems.length === 0) {
      return [];
    }

    // Group text items by similar Y coordinates (rows)
    const rows = this.groupTextItemsIntoRows(textItems);
    
    // Detect table structures
    const tableCandidates = this.detectTableStructures(rows);
    
    // Convert candidates to Table objects
    const tables: Table[] = [];
    tableCandidates.forEach((candidate, index) => {
      const table = this.createTableFromCandidate(candidate, pageNumber, index);
      if (table && table.rows >= this.MIN_TABLE_ROWS && table.columns >= this.MIN_TABLE_COLS) {
        tables.push(table);
      }
    });

    return tables;
  }

  /**
   * Group text items into rows based on Y coordinate similarity
   */
  private static groupTextItemsIntoRows(textItems: any[]): any[][] {
    const rows: any[][] = [];
    const yTolerance = 3; // pixels

    textItems.forEach(item => {
      const itemY = item.transform[5]; // Y coordinate from transform matrix
      
      // Find existing row with similar Y coordinate
      let foundRow = false;
      for (const row of rows) {
        if (row.length > 0) {
          const rowY = row[0].transform[5];
          if (Math.abs(itemY - rowY) <= yTolerance) {
            row.push(item);
            foundRow = true;
            break;
          }
        }
      }
      
      // Create new row if no similar Y coordinate found
      if (!foundRow) {
        rows.push([item]);
      }
    });

    // Sort rows by Y coordinate (top to bottom)
    rows.sort((a, b) => b[0].transform[5] - a[0].transform[5]);
    
    // Sort items within each row by X coordinate (left to right)
    rows.forEach(row => {
      row.sort((a, b) => a.transform[4] - b.transform[4]);
    });

    return rows;
  }

  /**
   * Detect table structures from grouped rows
   */
  private static detectTableStructures(rows: any[][]): any[] {
    const tableCandidates: any[] = [];
    
    for (let i = 0; i < rows.length - 1; i++) {
      const currentRow = rows[i];
      const nextRow = rows[i + 1];
      
      // Check if current row could be part of a table
      if (this.isTableRow(currentRow) && this.isTableRow(nextRow)) {
        // Find consecutive table rows
        const tableRows = [currentRow];
        let j = i + 1;
        
        while (j < rows.length && this.isTableRow(rows[j])) {
          tableRows.push(rows[j]);
          j++;
        }
        
        if (tableRows.length >= this.MIN_TABLE_ROWS) {
          tableCandidates.push({
            rows: tableRows,
            startIndex: i,
            endIndex: j - 1
          });
        }
        
        i = j - 1; // Skip processed rows
      }
    }
    
    return tableCandidates;
  }

  /**
   * Check if a row has characteristics of a table row
   */
  private static isTableRow(row: any[]): boolean {
    if (row.length < this.MIN_TABLE_COLS) {
      return false;
    }

    // Check for consistent spacing between items
    const xPositions = row.map(item => item.transform[4]);
    const gaps = [];
    
    for (let i = 1; i < xPositions.length; i++) {
      gaps.push(xPositions[i] - xPositions[i - 1]);
    }
    
    // Calculate gap consistency
    if (gaps.length === 0) return false;
    
    const avgGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
    const consistentGaps = gaps.filter(gap => Math.abs(gap - avgGap) / avgGap < 0.5).length;
    
    return consistentGaps / gaps.length >= this.TABLE_DETECTION_THRESHOLD;
  }

  /**
   * Create a Table object from a table candidate
   */
  private static createTableFromCandidate(candidate: any, pageNumber: number, index: number): Table | null {
    const rows = candidate.rows;
    if (rows.length === 0) return null;

    // Calculate table boundaries
    const allItems = rows.flat();
    const xPositions = allItems.map((item: any) => item.transform[4]);
    const yPositions = allItems.map((item: any) => item.transform[5]);
    
    const minX = Math.min(...xPositions);
    const maxX = Math.max(...xPositions.map((x: number, i: number) => x + (allItems[i].width || 0)));
    const minY = Math.min(...yPositions);
    const maxY = Math.max(...yPositions);

    // Create cells
    const cells: TableCell[] = [];
    let maxCols = 0;

    rows.forEach((row: any[], rowIndex: number) => {
      maxCols = Math.max(maxCols, row.length);
      
      row.forEach((item: any, colIndex: number) => {
        cells.push({
          text: item.str,
          x: item.transform[4],
          y: item.transform[5],
          width: item.width || 0,
          height: item.height || 0,
          row: rowIndex,
          col: colIndex
        });
      });
    });

    // Generate raw text representation
    const rawText = rows.map((row: any[]) => 
      row.map((item: any) => item.str).join('\t')
    ).join('\n');

    return {
      id: `table_${pageNumber}_${index}`,
      pageNumber,
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      rows: rows.length,
      columns: maxCols,
      cells,
      rawText
    };
  }

  /**
   * Get structured table data as HTML for AI analysis
   */
  static getTablesAsStructuredData(tables: Table[]): string {
    if (tables.length === 0) {
      return '';
    }

    // Only include tables that are likely to contain relevant SOC1 data
    const relevantTables = tables.filter(table => 
      table.rows >= 2 && table.columns >= 2 && table.rawText.length > 50
    );

    if (relevantTables.length === 0) {
      return '';
    }

    let htmlTables = '\n\n=== DETECTED TABLES ===\n';
    
    relevantTables.forEach(table => {
      htmlTables += `\nTable ${table.id} (Page ${table.pageNumber}):\n`;
      htmlTables += this.convertTableToHTML(table);
      htmlTables += '\n';
    });

    return htmlTables + '\n';
  }

  /**
   * Convert table cells to a 2D array representation
   */
  private static convertTableToArray(table: Table): string[][] {
    const result: string[][] = [];
    
    for (let row = 0; row < table.rows; row++) {
      const rowData: string[] = [];
      for (let col = 0; col < table.columns; col++) {
        const cell = table.cells.find(c => c.row === row && c.col === col);
        rowData.push(cell ? cell.text : '');
      }
      result.push(rowData);
    }
    
    return result;
  }

  /**
   * Convert table to HTML format for AI analysis
   */
  private static convertTableToHTML(table: Table): string {
    let html = '<table>\n';
    
    for (let row = 0; row < table.rows; row++) {
      html += '  <tr>\n';
      for (let col = 0; col < table.columns; col++) {
        const cell = table.cells.find(c => c.row === row && c.col === col);
        const cellText = cell ? cell.text.trim() : '';
        const tag = row === 0 ? 'th' : 'td'; // Use th for header row
        html += `    <${tag}>${cellText}</${tag}>\n`;
      }
      html += '  </tr>\n';
    }
    
    html += '</table>';
    return html;
  }
}
