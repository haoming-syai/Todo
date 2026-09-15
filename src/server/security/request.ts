import { env } from "~/env";

export function getClientIp(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded ?? headers.get("x-real-ip")?.trim() ?? "unknown";
}

export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  let actual: URL;
  try {
    actual = new URL(origin);
  } catch {
    return false;
  }

  const configured = new URL(env.APP_URL);
  if (actual.origin === configured.origin) return true;

  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") ?? "http";
  return Boolean(host && actual.origin === `${protocol}://${host}`);
}
