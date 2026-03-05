// instrumentation.ts - Runs once when the Next.js server starts
// https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[instrumentation] Initializing server...');
  }
}
