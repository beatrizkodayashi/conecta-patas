import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@conecta-patas/db";
import { ZodError } from "zod";
import { HttpError } from "../lib/http-error";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Dados invalidos",
      details: err.flatten(),
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    return res.status(409).json({ error: "Registro duplicado" });
  }

  console.error(err);
  return res.status(500).json({ error: "Erro interno" });
}
