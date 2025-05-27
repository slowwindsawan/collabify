import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

// Create a temporary file in memory
async function createTempFile(buffer: Uint8Array, fileName: string): Promise<string> {
  const tempPath = `/tmp/${fileName}`;
  await Deno.writeFile(tempPath, buffer);
  return tempPath;
}

async function cleanupTempFile(path: string) {
  try {
    await Deno.remove(path);
  } catch (error) {
    console.error('Error cleaning up temp file:', error);
  }
}

async function processPDF(buffer: Uint8Array): Promise<string> {
  const text = new TextDecoder().decode(buffer);
  return text
    .replace(/\f/g, '\n\n') // Form feed to double newline
    .split(/\r?\n/)
    .filter(line => line.trim().length > 0)
    .join('\n');
}

async function processDocx(buffer: Uint8Array): Promise<string> {
  const text = new TextDecoder().decode(buffer);
  return text
    .split(/\r?\n/)
    .filter(line => line.trim().length > 0)
    .join('\n');
}

async function processText(buffer: Uint8Array): Promise<string> {
  const text = new TextDecoder().decode(buffer);
  return text
    .split(/\r?\n/)
    .filter(line => line.trim().length > 0)
    .join('\n');
}

function processMarkdown(buffer: Uint8Array): string {
  const text = new TextDecoder().decode(buffer);
  return text
    .replace(/^# (.*$)/gm, '$1\n')
    .replace(/^## (.*$)/gm, '$1\n')
    .replace(/^### (.*$)/gm, '$1\n')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .split(/\r?\n/)
    .filter(line => line.trim().length > 0)
    .join('\n');
}

export async function processFile(buffer: Uint8Array, fileName: string): Promise<string> {
  const extension = fileName.split('.').pop()?.toLowerCase();

  try {
    switch (extension) {
      case 'pdf':
        return processPDF(buffer);
      case 'docx':
        return processDocx(buffer);
      case 'md':
        return processMarkdown(buffer);
      case 'txt':
      default:
        if (fileName.toLowerCase().endsWith('.txt')) {
          return processText(buffer);
        }
        throw new Error(`Unsupported file type: ${extension}`);
    }
  } catch (error) {
    console.error('Error processing file:', error);
    throw new Error(`Failed to process ${fileName}: ${error.message}`);
  }
}

export function normalizeText(text: string): string {
  return text
    .replace(/\u0000/g, '') // Remove null bytes
    .replace(/\u2028/g, '\n') // Replace line separator
    .replace(/\u2029/g, '\n\n') // Replace paragraph separator
    .replace(/[\uD800-\uDFFF]/g, '') // Remove surrogate pairs
    .replace(/[^\x20-\x7E\n\r\t]/g, '') // Keep only printable ASCII
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}