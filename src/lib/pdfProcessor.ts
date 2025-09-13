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

export interface PDFInfo {
  totalPages: number;
  text: string;
  metadata?: any;
}

export class PDFProcessor {

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
      
      // Extract text from all pages
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          fullText += `\n--- Page ${pageNum} ---\n${pageText}\n`;
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
}
