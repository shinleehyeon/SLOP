export interface JwtPayload {
  sub: string;
  email?: string;
  role?: string;
  sid?: string;
}

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role: string;
  roles: string[];
  aiService?: boolean;
}
