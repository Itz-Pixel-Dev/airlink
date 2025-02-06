import * as expressCore from 'express-serve-static-core';
import { Session, SessionData } from 'express-session';
import { User } from '@prisma/client';

declare module 'express' {
  interface Request extends expressCore.Request {
    session: Session & {
      user?: {
        id: number;
        username: string;
        isAdmin: boolean;
        email?: string;
      };
      lastActivity?: number;
    };
    user?: User;
    file?: any;
    files?: any[];
  }
}

declare module 'express-session' {
  interface SessionData {
    user?: {
      id: number;
      email: string;
      username?: string;
      isAdmin: boolean;
    };
    lastActivity?: number;
  }
}

declare module 'ws' {
  interface MessageEvent {
    data: any;
    type: string;
    target: WebSocket;
  }
}

export type Express = expressCore.Express;
export type Request = expressCore.Request;
export type Response = expressCore.Response;
export type NextFunction = expressCore.NextFunction;
export type Router = expressCore.Router;
export type RequestHandler = expressCore.RequestHandler;

export const Router: () => Router;


