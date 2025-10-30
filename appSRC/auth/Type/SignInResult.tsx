import { AuthUser } from "./AuthUser";

export type SignInResult = 
| { ok: true; user: AuthUser } 
| { ok: false; code?: string; message?: string };