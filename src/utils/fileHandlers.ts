import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export async function handleDocxFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  return result.value;
}

export async function handlePdfFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += `<p>${pageText}</p>`;
  }
  
  return fullText;
}

export async function handleTextFile(file: File): Promise<string> {
  const text = await file.text();
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => `<p>${line}</p>`)
    .join('');
}

export async function handleMarkdownFile(file: File): Promise<string> {
  const text = await file.text();
  // Basic MD to HTML conversion
  return text
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => line.startsWith('<') ? line : `<p>${line}</p>`)
    .join('');
}

export async function processFile(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  try {
    switch (extension) {
      case 'docx':
        return handleDocxFile(file);
      case 'pdf':
        return handlePdfFile(file);
      case 'md':
        return handleMarkdownFile(file);
      case 'txt':
        return handleTextFile(file);
      default:
        if (file.type.startsWith('text/')) {
          return handleTextFile(file);
        }
        throw new Error(`Unsupported file type: ${extension}`);
    }
  } catch (error) {
    console.error('Error processing file:', error);
    throw new Error(`Failed to process ${file.name}: ${error.message}`);
  }
}

// Helper function to clean and normalize text
export function normalizeText(text: string): string {
  return text
    .replace(/\u0000/g, '') // Remove null bytes
    .replace(/\u2028/g, '\n') // Replace line separator
    .replace(/\u2029/g, '\n\n') // Replace paragraph separator
    .replace(/[\uD800-\uDFFF]/g, '') // Remove surrogate pairs
    .replace(/[^\x20-\x7E\n\r\t]/g, '') // Keep only printable ASCII
    .trim();
}