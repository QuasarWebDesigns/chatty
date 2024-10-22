import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.TOGETHER_API_KEY,
  baseURL: 'https://api.together.xyz/v1',
});

export const sendOpenAi = async (
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  userId: number,
  context: string,
  max = 100,
  temp = 1
) => {
  console.log('Ask GPT >>>');
  messages.forEach((m) =>
    console.log(` - ${m.role.toUpperCase()}: ${m.content}`)
  );

  // Log the context being passed to the chatbot
  console.log('Context passed to chatbot:');
  console.log(context);

  try {
    const systemMessage: OpenAI.Chat.ChatCompletionMessageParam = {
      role: 'system',
      content: `You are a helpful assistant. Use the provided context to answer the user's question. If you can't find a direct answer in the context, use the information to provide the best possible response or explanation. Context:\n${context}`
    };

    const allMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      systemMessage,
      ...messages.map(m => ({ role: m.role, content: m.content }))
    ];

    // Log the full messages array being sent to the API
    console.log('Full messages array sent to API:');
    console.log(JSON.stringify(allMessages, null, 2));

    const response = await client.chat.completions.create({
      model: 'meta-llama/Llama-3-8b-chat-hf',
      messages: allMessages,
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
