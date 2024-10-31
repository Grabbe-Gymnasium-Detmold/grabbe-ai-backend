import OpenAI from 'openai';

export default eventHandler((event) => {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  type UserMessage = {
    role: 'user';
    content: string;
  };

  type AssistantMessage = {
    role: 'assistant';
    content: string;
  };

  type FunctionMessage = {
    role: 'function';
    name: string;
    content: string;
  };

  type ChatCompletionMessage = UserMessage | AssistantMessage | FunctionMessage;

  function getWeather(location: string) {
    return {
      location,
      temperature: '20°C',
      condition: 'klarer Himmel',
    };
  }

  async function chatWithAssistant() {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-0613', 
        messages: [
          { role: 'user', content: 'Wie ist das Wetter in Berlin?' },
        ] as ChatCompletionMessage[],
        functions: [
          {
            name: 'getWeather',
            description: 'Gibt das Wetter für einen bestimmten Ort zurück',
            parameters: {
              type: 'object',
              properties: {
                location: {
                  type: 'string',
                  description: 'Der Ort, für den das Wetter abgefragt wird',
                },
              },
              required: ['location'],
            },
          },
        ],
        function_call: 'auto', 
      });

      const message = response.choices[0].message;

      if (message?.function_call) {
        const functionName = message.function_call.name;
        const functionArguments = JSON.parse(message.function_call.arguments || '{}');

        if (functionName === 'getWeather') {
          const weatherInfo = getWeather(functionArguments.location);

          const followUpResponse = await openai.chat.completions.create({
            model: 'gpt-4-0613',
            messages: [
              { role: 'user', content: 'Wie ist das Wetter in Berlin?' },
              {
                role: 'function',
                name: 'getWeather',
                content: JSON.stringify(weatherInfo),
              },
            ] as ChatCompletionMessage[],
          });

          console.log(followUpResponse.choices[0].message?.content);
        }
      } else {
        console.log(message?.content); 
      }
    } catch (error) {
      console.error('Fehler bei der API-Anfrage:', error);
    }
  }

  chatWithAssistant();
});
