import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.39.0';
import { Configuration, OpenAIApi } from 'npm:openai@3.3.0';
import Exa from "npm:exa-js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Request-Headers': '*',
};

// Validate environment variables
const requiredEnvVars = {
  SUPABASE_URL: Deno.env.get('SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
  OPENAI_API_KEY: Deno.env.get('OPENAI_API_KEY'),
  EXA_KEY: Deno.env.get('EXA_KEY')
};

const exa = new Exa(requiredEnvVars.EXA_KEY);

const missingEnvVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

interface SearchResult {
  title: string;
  snippet: string;
  url: string;
}

// Helper function for web search using DuckDuckGo
async function performWebSearch(query) {
  try {
    // Invoke Exa's searchAndContents method
    const response = await exa.searchAndContents(query, {
      type: 'auto',
      text: { maxCharacters: 1000 }
    });
    
    const raw = response;
    console.log("For Query ",query,"Exa raaw ",response)
    if (!raw || !Array.isArray(raw.results)) {
      throw new Error('Malformed Exa response');
    }

    // Map Exa results to our SearchResult format
    const results = raw.results.map(item => ({
      title: item.title || 'unknown',
      snippet: item.text
        ? item.text.trim().slice(0, 300) + (item.text.length > 300 ? '…' : '')
        : 'unknown',
      url: item.url || item.id || 'unknown'
    }));

    // Build a combined searchText output
    const searchText = results
      .map(r => `Title: ${r.title}\nSummary: ${r.snippet}\nSource: ${r.url}`)
      .join('\n\n');

    return { results, searchText };
  } catch (error) {
    console.error('Web search error:', error);
    return {
      results: [],
      searchText: 'Unable to perform web search at this time.'
    };
  }
}

// Helper function to decode HTML entities
function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/<[^>]*>/g, '');  // Remove any remaining HTML tags
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Check for missing environment variables before proceeding
    if (missingEnvVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}. Please configure these in your Supabase project settings.`);
    }

    const supabaseClient = createClient(
      requiredEnvVars.SUPABASE_URL,
      requiredEnvVars.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        }
      }
    );

    const openai = new OpenAIApi(
      new Configuration({
        apiKey: requiredEnvVars.OPENAI_API_KEY,
      })
    );

    const { userId, kbId, query, editorContent = '', tempVectors = [], chatHistory = '', forceWebSearch = false } = await req.json();

    // Get query embedding
    const embeddingResponse = await openai.createEmbedding({
      model: 'text-embedding-ada-002',
      input: query,
    });

    const [{ embedding }] = embeddingResponse.data.data;

    // Search for similar chunks in the database
    const { data: chunks, error } = await supabaseClient.rpc('match_documents', {
      query_embedding: embedding,
      match_threshold: 0.78,
      match_count: 10,
      p_user_id: userId,
      p_kb_id: kbId,
    });

    console.log("Documents matched: ", chunks)

    if (error) throw error;

    // Combine DB chunks with temporary vectors if any
    let relevantChunks = chunks;
    if (tempVectors.length > 0) {
      const tempSimilarities = tempVectors.map(tv => ({
        chunk_text: tv.chunk_text,
        similarity: cosineSimilarity(embedding, tv.vector),
      }));

      relevantChunks = [...chunks, ...tempSimilarities]
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 10);
    }

    // Format context for the chat
    const context = relevantChunks
      .map(chunk => chunk.chunk_text)
      .join('\n\n');
    console.log("Context extracted: ",context)

    // Determine if we need web search
    let needsWebSearch = forceWebSearch;
    if (!needsWebSearch) {
      const needsWebSearchCompletion = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant. Your task is to determine if additional web information would be helpful for answering this query. Consider the following information carefully and respond with ONLY "YES" or "NO".

Available Information:
${context ? `Knowledge Base Context:\n${context}\n\n` : ''}
${chatHistory ? `Chat History:\n${chatHistory}\n\n` : ''}
${editorContent ? `Current Editor Content:\n${editorContent}\n\n` : ''}

User Query: ${query}

If there are adequate data to answer then do not search web and respond NO. If data is not adequate and need a web search for more information then respond with YES.`,
          }
        ],
        temperature: 0.3,
      });

      needsWebSearch = needsWebSearchCompletion.data.choices[0].message?.content?.toUpperCase().includes('YES');
    }
    
    let webSearchResults = { results: [], searchText: '' };
    if (needsWebSearch) {
      webSearchResults = await performWebSearch(query);
      console.log("Web search results: ",webSearchResults)
    }

    // Prepare the system message
    const systemMessage = `Assume the role of a thesis advisor with a specialization in academic writing.

Available Context:
${context ? `Knowledge Base Context:\n${context}\n\n` : ''}
${chatHistory ? `Chat History:\n${chatHistory}\n\n` : ''}
${webSearchResults.searchText ? `Web Search Results:\n${webSearchResults.searchText}\n\n` : ''}
${editorContent ? `Current Editor Content:\n${editorContent}\n\n` : ''}

Instructions:
1. Provide clear and concise reponse.
2. Reference relevant information from the available context
3. If you're unsure about something, acknowledge it.
4. If you are asked to improve then make required changes in the current editor content.
5. Always answer in JSON format {"answer":"", "suggestedChanges":""}. Make sure the double quotes. Strictly follow.
6. Provide a "suggestedChanges" field if you think the user needs to make changes to their current editor content. Refine, enhance and make it construcitve and helpful. Use proper heading and bullet points where needed.`;

    // Get chat completion
    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: query },
      ],
      temperature: 0.7,
    });

    const aiResponse = completion.data.choices[0].message?.content || '';
    console.log("_____________ai ",aiResponse)
    let t = {};
    let aiAnswer = "Something went wrong! Could not answer at the moment.";
    let aiSuggestion = "";
    try {
      if (typeof aiResponse == "object") {
        t = aiResponse;
      } else {
        t = JSON.parse(aiResponse);
      }
      if (t.answer) {
        aiAnswer = t.answer;
      }
      if (t.suggestedChanges) {
        aiSuggestion = t.suggestedChanges;
      }
    } catch (e) {
      console.log("Error parsing AI response to JSON: ", e);
    }
    let res = {
      answer: aiAnswer,
      relevantChunks,
      usedWebSearch: needsWebSearch,
      webSources: webSearchResults.results
    };
    if (aiSuggestion) {
      res["suggestedChanges"] = aiSuggestion;
    }
    return new Response(
      JSON.stringify(res),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in chat function:', error);
    return new Response(
      JSON.stringify({ 
        error: true,
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Helper function for cosine similarity
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0);
  const normA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
  const normB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));
  return dotProduct / (normA * normB);
}