declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: "CLIENTE" | "ONG";
      };
    }
  }
}

export {};
