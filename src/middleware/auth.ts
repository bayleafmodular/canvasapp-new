import jwt from 'jsonwebtoken';
import { AuthRepository, toPublicUser } from '@/repositories/auth.repository';
import { PublicUser } from '@/types/auth';

export class AuthError extends Error {
  constructor(public message: string, public status: number) {
    super(message);
    this.name = 'AuthError';
  }
}

export async function authenticateRequest(request: Request): Promise<PublicUser> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthError('No token, authorization denied', 401);
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is missing');
  }

  try {
    const decoded = jwt.verify(token, secret) as { id: string; role: string };
    const user = await AuthRepository.findUserById(decoded.id);
    if (!user) {
      throw new AuthError('User no longer exists', 401);
    }

    const publicUser = toPublicUser(user);
    if (!publicUser) {
      throw new AuthError('Failed to format user details', 500);
    }

    return publicUser;
  } catch (err: any) {
    if (err instanceof AuthError) throw err;
    throw new AuthError('Token is not valid', 401);
  }
}

export function checkRole(user: PublicUser, ...allowedRoles: string[]): void {
  if (!allowedRoles.includes(user.role)) {
    throw new AuthError('Access denied', 403);
  }
}

export function checkPermission(user: PublicUser, permission: string): void {
  if (user.role === 'admin') return;
  if (user.permissions?.[permission]) return;
  throw new AuthError('You do not have permission for this action', 403);
}
