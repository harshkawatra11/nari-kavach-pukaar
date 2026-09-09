import { locationFreshness, mapsLink } from "./geo";
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
    const freshness = locationFreshness(opts.point);
    const label = freshness.status === "snapshot" ? "Selected" : freshness.status === "live" ? "Current" : "Last known";
    lines.push("", `${label} location:`, mapsLink(opts.point));
  }
  lines.push("", "Live tracking:", opts.trackUrl, "", "This was sent automatically. Call her now.");
  return lines.join("\n");
}
