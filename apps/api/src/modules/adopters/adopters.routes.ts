import { Router } from "express";
import { prisma } from "@conecta-patas/db";
import { z } from "zod";
import { requireAuth } from "../../middlewares/auth";
import { HttpError } from "../../lib/http-error";
import {
  especieSchema,
  porteSchema,
  sexoSchema,
  telefoneSchema,
  tipoResidenciaSchema,
} from "../../lib/schemas";

export const adoptersRouter = Router();

const updateAdopterSchema = z.object({
  nome: z.string().min(2).optional(),
  telefone: telefoneSchema.optional(),
  endereco: z.string().min(3).optional(),
  cidade: z.string().min(2).optional(),
  tipoResidencia: tipoResidenciaSchema.optional(),
  temCriancas: z.boolean().optional(),
  temIdosos: z.boolean().optional(),
  temAdultos: z.boolean().optional(),
  temOutrosAnimais: z.boolean().optional(),
  obsOutrosAnimais: z.string().nullable().optional(),
  rotina: z.string().min(3).optional(),
  especiePreferida: especieSchema.nullable().optional(),
  portePreferido: porteSchema.nullable().optional(),
  sexoPreferido: sexoSchema.nullable().optional(),
  aceitaNecessidadesEspeciais: z.boolean().optional(),
});

async function getClienteOrThrow(userId: number) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    include: {
      cliente: {
        include: {
          adocoes: {
            include: {
              pet: {
                include: {
                  ong: {
                    select: { cnpjOng: true, nomeOng: true, telefone: true, cidade: true },
                  },
                },
              },
            },
            orderBy: { criadoEm: "desc" },
          },
        },
      },
    },
  });

  if (!usuario?.cliente) {
    throw new HttpError(404, "Perfil de adotante nao encontrado");
  }

  return usuario.cliente;
}

adoptersRouter.get("/me", requireAuth(["CLIENTE"]), async (req, res, next) => {
  try {
    const cliente = await getClienteOrThrow(req.user!.id);
    res.json(cliente);
  } catch (error) {
    next(error);
  }
});

adoptersRouter.patch("/me", requireAuth(["CLIENTE"]), async (req, res, next) => {
  try {
    const input = updateAdopterSchema.parse(req.body);
    const current = await getClienteOrThrow(req.user!.id);
    const cliente = await prisma.cliente.update({
      where: { cpf: current.cpf },
      data: input,
    });
    res.json(cliente);
  } catch (error) {
    next(error);
  }
});

adoptersRouter.get("/me/interests", requireAuth(["CLIENTE"]), async (req, res, next) => {
  try {
    const cliente = await getClienteOrThrow(req.user!.id);
    res.json(cliente.adocoes);
  } catch (error) {
    next(error);
  }
});
