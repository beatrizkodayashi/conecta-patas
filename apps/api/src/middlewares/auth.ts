import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../env";
import { HttpError } from "../lib/http-error";

type TokenPayload = {
  id: number;
  email: string;
  role: "CLIENTE" | "ONG";
};

export function requireAuth(roles?: Array<"CLIENTE" | "ONG">) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const header = req.headers.authorization;
      if (!header?.startsWith("Bearer ")) {
        throw new HttpError(401, "Token ausente");
      }

      const token = header.slice("Bearer ".length);
      const payload = jwt.verify(token, env.jwtSecret) as TokenPayload;
      req.user = {
        id: Number(payload.id),
        email: payload.email,
        role: payload.role,
      };

      if (roles && !roles.includes(payload.role)) {
        throw new HttpError(403, "Acesso negado para este perfil");
      }

      next();
    } catch (error) {
      if (error instanceof HttpError) {
        next(error);
        return;
      }
      next(new HttpError(401, "Token invalido"));
    }
  };
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next();
    return;
  }

  try {
    const token = header.slice("Bearer ".length);
    const payload = jwt.verify(token, env.jwtSecret) as TokenPayload;
    req.user = {
      id: Number(payload.id),
      email: payload.email,
      role: payload.role,
    };
  } catch {
    // Busca publica continua mesmo com token invalido.
  }

  next();
}
