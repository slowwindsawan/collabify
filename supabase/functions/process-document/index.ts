import { createClient } from 'npm:@supabase/supabase-js@2.39.0';
import { Configuration, OpenAIApi } from 'npm:openai@3.3.0';
import { Document } from 'npm:langchain/document';
import { RecursiveCharacterTextSplitter } from 'npm:langchain/text_splitter';
import { processFile } from './fileProcessors.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json'
};

// Helper function to create error responses with CORS headers
const createErrorResponse = (message: string, status = 400) => {
  return new Response(
    JSON.stringify({ 
      error: true,
      message 
    }),
    { 
      status,
      headers: corsHeaders
    }
  );
};

// Helper function to create success responses with CORS headers
const createSuccessResponse = (data: any) => {
  return new Response(
    JSON.stringify({ success: true, ...data }),
    { headers: corsHeaders }
  );
};

// Validate environment variables
const validateEnv = () => {
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'OPENAI_API_KEY'
  ];
  
  for (const envVar of requiredEnvVars) {
    if (!Deno.env.get(envVar)) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    // Validate environment variables
    validateEnv();

    // Initialize clients
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const openai = new OpenAIApi(
      new Configuration({
        apiKey: Deno.env.get('OPENAI_API_KEY'),
      })
    );

    // Parse and validate request body
    const { userId, kbId, fileUrl, fileName, isTemporary } = await req.json();

    if (!userId || !kbId || !fileUrl || !fileName) {
      return createErrorResponse('Missing required parameters');
    }

    // Validate URL format
    try {
      new URL(fileUrl);
    } catch {
      return createErrorResponse('Invalid file URL format');
    }

    // Download file with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(fileUrl, {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      clearTimeout(timeout);

      if (!response.ok) {
        return createErrorResponse(`Failed to download file: ${response.statusText}`);
      }

      const fileBuffer = await response.arrayBuffer();
      
      // Check file size (10MB limit)
      if (fileBuffer.byteLength > 10 * 1024 * 1024) {
        return createErrorResponse('File size exceeds 10MB limit');
      }

      const processedText = await processFile(new Uint8Array(fileBuffer), fileName);

      if (!processedText.trim()) {
        return createErrorResponse('Document is empty or could not be processed');
      }

      // Split text into chunks
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 500,
        chunkOverlap: 100,
      });

      const docs = await splitter.createDocuments([processedText]);
      console.log(processedText)

      if (!isTemporary) {
        // Store document in the database
        const { data: document, error: docError } = await supabaseClient
          .from('documents')
          .insert({
            kb_id: kbId,
            user_id: userId,
            file_path: fileUrl,
            file_name: fileName,
            name: fileName,
            content: processedText,
          })
          .select()
          .single();

        if (docError) {
          return createErrorResponse(`Failed to store document: ${docError.message}`);
        }

        // Process and store document chunks with retry logic
        const vectors = [];
        for (let i = 0; i < docs.length; i++) {
          const chunk = docs[i];
          let retries = 3;
          
          while (retries > 0) {
            try {
              const embeddingResponse = await openai.createEmbedding({
                model: 'text-embedding-ada-002',
                input: chunk.pageContent,
              });

              const [{ embedding }] = embeddingResponse.data.data;

              const { error: vectorError } = await supabaseClient
                .from('document_vectors')
                .insert({
                  document_id: document.id,
                  user_id: userId,
                  kb_id: kbId,
                  chunk_index: i,
                  chunk_text: `File: ${fileName}\n\n${chunk.pageContent}`,
                  vector: embedding,
                });

              if (vectorError) {
                throw new Error(`Failed to store vector: ${vectorError.message}`);
              }

              vectors.push({ chunk_index: i, success: true });
              break;
            } catch (error) {
              retries--;
              if (retries === 0) {
                return createErrorResponse(`Failed to process document chunk ${i}: ${error.message}`);
              }
              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }

        return createSuccessResponse({ documentId: document.id, vectors });
      } else {
        // For temporary files, just return the chunks and embeddings
        const tempVectors = await Promise.all(
          docs.map(async (chunk, i) => {
            const embeddingResponse = await openai.createEmbedding({
              model: 'text-embedding-ada-002',
              input: chunk.pageContent,
            });

            const [{ embedding }] = embeddingResponse.data.data;

            return {
              chunk_index: i,
              chunk_text: `File: ${fileName}\n\n${chunk.pageContent}`,
              vector: embedding,
            };
          })
        );

        return createSuccessResponse({ tempVectors });
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        return createErrorResponse('File download timed out');
      }
      throw error;
    }
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : 'An unexpected error occurred'
    );
  }
});