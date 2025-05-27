
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: "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" // This is the default and can be omitted
});

const response = await client.responses.create({
  model: 'gpt-4o',
  temperature: 0.3,
  instructions: `write in 1000 words about the topic "`,
  input: 'Write a report on market analysis.',
});

console.log(response.output_text);