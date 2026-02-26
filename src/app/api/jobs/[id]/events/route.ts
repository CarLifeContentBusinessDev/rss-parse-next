import { jobManager } from '@/jobs/jobManager';

export const runtime = 'nodejs';

function formatEvent(data: unknown) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = jobManager.getJob(id);

  if (!job) {
    return new Response(formatEvent({ type: 'error', error: 'job not found' }), {
      status: 404,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      let closed = false;
      let heartbeat: NodeJS.Timeout | null = null;

      const safeEnqueue = (payload: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(payload));
        } catch {
          closed = true;
        }
      };

      const close = () => {
        if (closed) return;
        closed = true;
        if (heartbeat) {
          clearInterval(heartbeat);
          heartbeat = null;
        }
        unsubscribe();
        try {
          controller.close();
        } catch {
          // no-op
        }
      };

      safeEnqueue(formatEvent({ type: 'snapshot', job }));

      const unsubscribe = jobManager.subscribe(id, (event) => {
        safeEnqueue(formatEvent(event));
        if (
          event.type === 'status' &&
          (event.status === 'succeeded' || event.status === 'failed')
        ) {
          setTimeout(close, 100);
        }
      });

      heartbeat = setInterval(() => {
        safeEnqueue(': ping\n\n');
      }, 15000);

      if (job.status === 'succeeded' || job.status === 'failed') {
        setTimeout(close, 100);
      }
    },
    cancel() {
      // client disconnected
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
