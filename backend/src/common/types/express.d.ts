import { AuthenticatedUser } from '@/modules/auth/application/jwt-payload';

declare global {
  namespace Express {
    interface User extends AuthenticatedUser {}

    interface Request {
      aiServiceAuth?: boolean;
    }
  }
}
