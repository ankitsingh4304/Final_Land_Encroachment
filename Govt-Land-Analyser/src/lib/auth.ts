import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "./db";
import { User, type IUser, type UserRole } from "@/models/User";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_EXPIRES_IN = "7d";

export interface AuthTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signAuthToken(user: IUser) {
  const payload: AuthTokenPayload = {
    sub: user._id.toString(),
    email: user.email,
    role: user.role,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export async function getCurrentUser(): Promise<IUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
    await connectToDatabase();
    const user = await User.findById(decoded.sub);
    return user;
  } catch {
    return null;
  }
}

/** Returns the current user if they are an admin; otherwise null. Use for admin-only API routes. */
export async function requireAdmin(): Promise<IUser | null> {
  const user = await getCurrentUser();
  return user?.role === "admin" ? user : null;
}

