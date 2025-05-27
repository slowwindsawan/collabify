
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: "" // This is the default and can be omitted
});

const response = await client.responses.create({
  model: 'gpt-4o',
  temperature: 0.3,
  instructions: `write in 1000 words about the topic "`,
  input: 'Write a report on market analysis.',
});

console.log(response.output_text);