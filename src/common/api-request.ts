import { Request } from "express";
export interface ApiRequest extends Request<Record<string, string>> {
  query: any;
  user?: {
    id: number;
    fullName: string;
    username: string;
    email: string;
    role: string;
    city: string | null;
    neighborhood: string | null;
    photoUrl: string | null;
    createdAt: Date;
  };
  sessionId?: string;
  validatedQuery?: any;
}
