// Web Worker for streaming graph operations
// This file should only be executed in a Web Worker context

// Exit early if not in a Web Worker environment
if (typeof self === 'undefined' || typeof importScripts === 'undefined') {
  // This file is being processed in a non-worker environment (likely server-side)
  // Do nothing to prevent errors
} else {
  // Dynamic imports to prevent server-side execution
  (async () => {
    const { createClient } = await import("@/hooks/utils");
    const { StreamConfig } = await import("./streamWorker.types");

    // Since workers can't directly access the client SDK, you'll need to recreate/import necessary parts
    const ctx: Worker = self as any;

    ctx.addEventListener("message", async (event: MessageEvent<any>) => {
  try {
    const { threadId, assistantId, input, modelName, modelConfigs } =
      event.data;

    const client = createClient();

    const stream = client.runs.stream(threadId, assistantId, {
      input: input as Record<string, unknown>,
      streamMode: "events",
      config: {
        configurable: {
          customModelName: modelName,
          modelConfig: modelConfigs[modelName as keyof typeof modelConfigs],
        },
      },
    });

    for await (const chunk of stream) {
      // Serialize the chunk and post it back to the main thread
      ctx.postMessage({
        type: "chunk",
        data: JSON.stringify(chunk),
      });
    }

    ctx.postMessage({ type: "done" });
  } catch (error: any) {
      ctx.postMessage({
        type: "error",
        error: error.message,
      });
    }
    });
  })();
}
