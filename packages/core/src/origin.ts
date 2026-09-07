const PRIVATE_HOST = /^(localhost|127(?:\.\d{1,3}){3}|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})$/i;

export function validatePublicTrackingOrigin(value: string, nodeEnv = process.env.NODE_ENV): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("PUBLIC_TRACKING_ORIGIN must be an absolute URL");
  }
  if (url.pathname !== "/" || url.search || url.hash) {
    throw new Error("PUBLIC_TRACKING_ORIGIN must not include a path, query, or fragment");
  }
  if (nodeEnv !== "test" && (url.protocol !== "https:" || PRIVATE_HOST.test(url.hostname))) {
    throw new Error("PUBLIC_TRACKING_ORIGIN must be a public HTTPS origin");
  }
  return url.origin;
}
