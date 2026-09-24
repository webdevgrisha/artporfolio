export interface AuthUser {
  email: string | null;
  uid: string;
}

export interface CreatedSession {
  sessionCookie: string;
  user: AuthUser;
}
