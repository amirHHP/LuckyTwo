import { prisma } from "./db";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const SESSION_COOKIE = "lt_session";
const SESSION_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Generate a cryptographically secure random token.
 */
function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Create a new session for a user and set the cookie.
 */
export async function createSession(userId: string): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE);

  await prisma.session.create({
    data: { token, userId, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE / 1000,
  });

  return token;
}

/**
 * Read the session token from cookies (or Authorization header for API calls).
 */
function getTokenFromRequest(request?: NextRequest): string | null {
  // For API route handlers that receive the Request object
  if (request) {
    // Check cookie header
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
    if (match) return match[1];
    return null;
  }
  return null;
}

/**
 * Get the current session user from a request. Returns null if not authenticated.
 */
export async function getSessionUser(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) return null;
  if (new Date() > session.expiresAt) {
    // Expired — clean up
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  return session.user;
}

/**
 * Require an authenticated user. Returns the user or a 401 JSON response.
 */
export async function requireUser(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return { error: true as const, status: 401, message: "لطفاً وارد حساب کاربری شوید" };
  }
  return { error: false as const, user };
}

/**
 * Require an admin user. Returns the user or a 403 JSON response.
 */
export async function requireAdmin(request: NextRequest) {
  const result = await requireUser(request);
  if (result.error) return result;
  if (result.user.role !== "admin") {
    return { error: true as const, status: 403, message: "دسترسی مدیریتی الزامی است" };
  }
  return { error: false as const, user: result.user };
}

/**
 * Destroy a session (logout).
 */
export async function destroySession(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
