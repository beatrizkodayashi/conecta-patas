import { Router } from "express";
import { prisma } from "@conecta-patas/db";
import { z } from "zod";
import { requireAuth } from "../../middlewares/auth";
import { HttpError } from "../../lib/http-error";
import { telefoneSchema } from "../../lib/schemas";

export const ongsRouter = Router();

const updateOngSchema = z.object({
  nomeOng: z.string().min(2).optional(),
  responsavel: z.string().min(2).optional(),
  telefone: telefoneSchema.optional(),
  endereco: z.string().min(3).optional(),
  cidade: z.string().min(2).optional(),
});

async function getOngOrThrow(userId: number) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    include: { ong: true },
  });

  if (!usuario?.ong) {
    throw new HttpError(404, "ONG nao encontrada");
  }

  return usuario.ong;
}

ongsRouter.get("/me", requireAuth(["ONG"]), async (req, res, next) => {
  try {
    const ong = await getOngOrThrow(req.user!.id);
    res.json(ong);
  } catch (error) {
    next(error);
  }
});

ongsRouter.patch("/me", requireAuth(["ONG"]), async (req, res, next) => {
  try {
    const input = updateOngSchema.parse(req.body);
    const current = await getOngOrThrow(req.user!.id);
    const ong = await prisma.ong.update({
      where: { cnpjOng: current.cnpjOng },
      data: input,
    });
    res.json(ong);
  } catch (error) {
    next(error);
  }
});

ongsRouter.get("/me/dashboard", requireAuth(["ONG"]), async (req, res, next) => {
  try {
    const ong = await getOngOrThrow(req.user!.id);

    const [total, disponiveis, emAnalise, adotados, arquivados, interessesPendentes] =
      await Promise.all([
        prisma.pet.count({ where: { cnpjOng: ong.cnpjOng } }),
        prisma.pet.count({ where: { cnpjOng: ong.cnpjOng, statusAdocao: "Disponível" } }),
        prisma.pet.count({ where: { cnpjOng: ong.cnpjOng, statusAdocao: "Em análise" } }),
        prisma.pet.count({ where: { cnpjOng: ong.cnpjOng, statusAdocao: "Adotado" } }),
        prisma.pet.count({ where: { cnpjOng: ong.cnpjOng, statusAdocao: "Arquivado" } }),
        prisma.adocao.count({
          where: {
            cnpjOng: ong.cnpjOng,
            statusAdocao: "Pendente",
          },
        }),
      ]);

    res.json({
      pets: { total, disponiveis, emAnalise, adotados, arquivados },
      interessesPendentes,
    });
  } catch (error) {
    next(error);
  }
});

ongsRouter.get("/me/pets", requireAuth(["ONG"]), async (req, res, next) => {
  try {
    const ong = await getOngOrThrow(req.user!.id);
    const pets = await prisma.pet.findMany({
      where: { cnpjOng: ong.cnpjOng },
      orderBy: { criadoEm: "desc" },
    });
    res.json(pets);
  } catch (error) {
    next(error);
  }
});

ongsRouter.get("/me/interests", requireAuth(["ONG"]), async (req, res, next) => {
  try {
    const ong = await getOngOrThrow(req.user!.id);
    const adocoes = await prisma.adocao.findMany({
      where: { cnpjOng: ong.cnpjOng },
      include: {
        cliente: true,
        pet: true,
      },
      orderBy: { criadoEm: "desc" },
    });
    res.json(adocoes);
  } catch (error) {
    next(error);
  }
});
