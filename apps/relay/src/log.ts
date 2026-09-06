// Deliberately minimal. No transcripts, no reply text, no location data ever
// gets logged: the whole privacy claim is that conversation content is not
// retained, and a log file is retention. Only structural events and counts.

function ts(): string {
  return new Date().toISOString();
}

export const log = {
  info(msg: string, meta?: Record<string, unknown>) {
    console.log(`[${ts()}] INFO  ${msg}`, meta ?? "");
  },
  warn(msg: string, meta?: Record<string, unknown>) {
    console.warn(`[${ts()}] WARN  ${msg}`, meta ?? "");
  },
  error(msg: string, meta?: Record<string, unknown>) {
    console.error(`[${ts()}] ERROR ${msg}`, meta ?? "");
  },
};
