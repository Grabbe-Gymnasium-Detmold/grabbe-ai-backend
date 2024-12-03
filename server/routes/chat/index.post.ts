import OpenAI from 'openai';

export default eventHandler(async (event) => {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Lese die Frage aus dem Request-Body
  const body = await readBody(event);
  const userQuestion = body?.question;

  if (!userQuestion) {
    return Response.json({ error: "No question provided in request body." }, { status: 400 });
  }

  async function chatWithAssistant() {
    // Erstelle einen neuen Thread mit der Frage des Nutzers
    const thread = await openai.beta.threads.create({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: userQuestion,
            },
          ],
        },
      ],
    });

    console.log('Thread created:', thread);

    const encoder = new TextEncoder();

    // Erstelle einen ReadableStream für die Antwort
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

  try {
    const { threadId, stream } = await chatWithAssistant();

    // Setze die Thread-ID als Header
    setResponseHeader(event, 'X-Thread-ID', threadId);

    // Rückgabe des Streams
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: "Failed to process the request." }, { status: 500 });
  }
});
