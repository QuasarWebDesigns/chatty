import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.TOGETHER_API_KEY,
  baseURL: 'https://api.together.xyz/v1',
});

export const sendOpenAi = async (
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  userId: number,
  max = 100,
  temp = 1
) => {
  console.log('Ask GPT >>>');
  messages.forEach((m) =>
    console.log(` - ${m.role.toUpperCase()}: ${m.content}`)
  );

  try {
    const response = await client.chat.completions.create({
      model: 'meta-llama/Llama-3-8b-chat-hf',
      messages: messages,
      max_tokens: max,
      temperature: temp,
      user: userId.toString(),
    });

    const answer = response.choices[0].message.content;
    const usage = response.usage;

    console.log('>>> ' + answer);
    if (usage) {
      console.log(
        `TOKENS USED: ${usage.total_tokens} (prompt: ${usage.prompt_tokens} / response: ${usage.completion_tokens})`
      );
    }
    console.log('\n');

    return answer;
  } catch (error) {
    console.error('GPT Error:', error);
    throw new Error(`GPT Error: ${error.message}`);
  }
};
