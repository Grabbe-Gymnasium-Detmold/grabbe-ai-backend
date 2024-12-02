import OpenAI from 'openai';

export default eventHandler(async (event) => {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  async function chatWithAssistant() {
    const thread = await openai.beta.threads.create({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Wer ist der Schulleiter dieser Schule?',
            },
          ],
        },
      ],
    });

    console.log('Thread created:', thread);

    const encoder = new TextEncoder();

    // Create a ReadableStream to stream the response
    const stream = new ReadableStream({
      async start(controller) {
        const run = openai.beta.threads.runs.stream(thread.id, {
          assistant_id: 'asst_TpSCnmEDecxR9gWDLdkQ7b34',
          model: 'gpt-4o-mini',
        });

        run.on('textDelta', (delta) => {
          controller.enqueue(encoder.encode(delta.value));
        });

        run.on('textDone', () => {
          controller.close();
        });
      },
    });

    return { threadId: thread.id, stream };
  }

  const { threadId, stream } = await chatWithAssistant();

  // Set the 'threadId' as a custom header in the response
  setResponseHeader(event, 'X-Thread-ID', threadId);

  // Return the stream to the client
  return new Response(stream);
});
