export interface TranscriptSegment { id: string; text: string; at: number; final: boolean; }

export function createTranscriptWindow() {
  let segments: TranscriptSegment[] = [];
  let lastEventAt: number | null = null;
  function reset() { segments = []; lastEventAt = null; }
  function text() { return segments.map((segment) => segment.text.trim()).join(" ").split(/\s+/u).filter(Boolean).slice(-64).join(" "); }
  function upsert(next: TranscriptSegment): string {
    if (!next.id || !next.text.trim() || !Number.isFinite(next.at)) return text();
    if (lastEventAt !== null && next.at < lastEventAt) return text();
    if (lastEventAt !== null && next.at - lastEventAt > 8000) reset();
    lastEventAt = next.at;
    segments = segments.filter((segment) => next.at - segment.at <= 12000);
    const existing = segments.find((segment) => segment.id === next.id);
    if (existing?.final) return text();
    if (!next.final) segments = segments.filter((segment) => segment.final || segment.id === next.id);
    const index = segments.findIndex((segment) => segment.id === next.id);
    if (index >= 0) segments[index] = { ...next }; else segments.push({ ...next });
    const finalIds = segments.filter((segment) => segment.final).slice(-3).map((segment) => segment.id);
    segments = segments.filter((segment) => !segment.final || finalIds.includes(segment.id));
    return text();
  }
  return { upsert, reset };
}
