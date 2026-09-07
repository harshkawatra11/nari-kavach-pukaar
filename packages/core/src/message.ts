import { mapsLink } from "./geo";
import type { GeoPoint } from "./types";

/** The WhatsApp alert body. Kept plain: no emoji, no markdown, because the
 *  automation pastes through the OS clipboard and WhatsApp's composer
 *  interprets some formatting characters differently than a typed message. */
export function buildAlertMessage(opts: {
  userName: string;
  timeHHMM: string;
  point: GeoPoint | null;
  trackUrl: string;
  testMode?: boolean;
}): string {
  const lines = opts.testMode ? ["PUKAAR TEST: No emergency."] : [];
  lines.push(`Pukaar alert. ${opts.userName} said her safe word at ${opts.timeHHMM}.`);
  if (opts.point) {
    lines.push(`Live location: ${mapsLink(opts.point)}`);
  }
  lines.push(`Follow her here: ${opts.trackUrl}`);
  lines.push("This was sent automatically. Call her now.");
  return lines.join("\n");
}
