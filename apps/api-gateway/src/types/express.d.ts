// Extend Express Request interface to include user property from auth middleware
declare global {
  namespace Express {
    export interface Request {
      user?: {
        id: string;
        username: string;
        email: string;
      };
    }
  }
}

export {}; // This makes the file a module 