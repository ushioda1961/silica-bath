import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { SessionPayload } from "./types";

const COOKIE_NAME = "silica_bath_session";
const ALG = "HS256";

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET must be set and at least 16 characters");
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: [ALG] });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function readSession(): Promise<SessionPayload | null> {
  const c = cookies();
  const token = c.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifySession(token);
}

export async function setSessionCookie(token: string) {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  cookies().set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
