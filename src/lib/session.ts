import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "mockSession";

export interface MockSession {
  user_id: string;
  phone: string;
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
} as const;

export function buildSessionValue(session: MockSession): string {
  return encodeURIComponent(JSON.stringify(session));
}

export function parseSessionValue(
  value: string | undefined | null
): MockSession | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as MockSession;
    if (
      typeof parsed.user_id === "string" &&
      typeof parsed.phone === "string"
    ) {
      return parsed;
    }
  } catch {
    // Invalid cookie value - treat as not logged in
  }
  return null;
}

export async function getSession(): Promise<MockSession | null> {
  const cookieStore = await cookies();
  return parseSessionValue(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}
