import { Router } from "express";
import { prisma } from "@conecta-patas/db";
import { z } from "zod";
import { requireAuth } from "../../middlewares/auth";
import { HttpError } from "../../lib/http-error";
import { parseId } from "../../lib/ids";

export const interestsRouter = Router();

const createInterestSchema = z.object({
  idAnimal: z.number().int().positive(),
  message: z.string().min(1).optional(),
});

const updateInterestSchema = z.object({
  statusAdocao: z.enum(["Concluída", "Cancelada", "Em análise"]),
});

const createMessageSchema = z.object({
  conteudo: z.string().min(1),
});

async function getUsuario(userId: number) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    include: { cliente: true, ong: true },
  });
  if (!usuario) {
    throw new HttpError(401, "Usuario nao encontrado");
  }
  return usuario;
}

async function getAdocaoForParticipant(
  idAdocao: number,
  user: { id: number; role: "CLIENTE" | "ONG" },
) {
  const adocao = await prisma.adocao.findUnique({
    where: { idAdocao },
    include: {
      cliente: true,
      pet: true,
      ong: true,
      mensagens: {
        orderBy: { criadoEm: "asc" },
        include: {
          usuario: {
            select: { id: true, email: true, papel: true },
          },
        },
      },
    },
  });

  if (!adocao) {
    throw new HttpError(404, "Interesse nao encontrado");
  }

  const usuario = await getUsuario(user.id);

  if (user.role === "CLIENTE" && adocao.cpf !== usuario.cpf) {
    throw new HttpError(403, "Acesso negado a este interesse");
  }

  if (user.role === "ONG" && adocao.cnpjOng !== usuario.cnpjOng) {
    throw new HttpError(403, "Acesso negado a este interesse");
  }

  return adocao;
}

interestsRouter.post("/", requireAuth(["CLIENTE"]), async (req, res, next) => {
  try {
    const input = createInterestSchema.parse(req.body);
    const usuario = await getUsuario(req.user!.id);
    if (!usuario.cpf) {
      throw new HttpError(403, "Perfil de adotante nao encontrado");
    }

    const pet = await prisma.pet.findUnique({ where: { idAnimal: input.idAnimal } });
    if (!pet || pet.statusAdocao === "Arquivado") {
      throw new HttpError(404, "Pet nao encontrado");
    }
    if (pet.statusAdocao !== "Disponível") {
      throw new HttpError(409, "Apenas pets disponiveis podem receber interesse");
    }

    const adocao = await prisma.$transaction(async (tx) => {
      const created = await tx.adocao.create({
        data: {
          idAnimal: pet.idAnimal,
          cpf: usuario.cpf!,
          cnpjOng: pet.cnpjOng,
          statusAdocao: "Pendente",
          mensagens: input.message
            ? {
                create: {
                  idUsuario: usuario.id,
                  conteudo: input.message,
                },
              }
            : undefined,
        },
        include: { pet: true, mensagens: true },
      });

      await tx.pet.update({
        where: { idAnimal: pet.idAnimal },
        data: { statusAdocao: "Em análise" },
      });

      return created;
    });

    res.status(201).json(adocao);
  } catch (error) {
    next(error);
  }
});

interestsRouter.get("/:id", requireAuth(), async (req, res, next) => {
  try {
    const adocao = await getAdocaoForParticipant(parseId(req.params.id), req.user!);
    res.json(adocao);
  } catch (error) {
    next(error);
  }
});

interestsRouter.patch("/:id", requireAuth(["ONG"]), async (req, res, next) => {
  try {
    const input = updateInterestSchema.parse(req.body);
    const adocao = await getAdocaoForParticipant(parseId(req.params.id), req.user!);

    if (adocao.statusAdocao === "Concluída" || adocao.statusAdocao === "Cancelada") {
      throw new HttpError(409, "Este interesse ja foi encerrado");
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (input.statusAdocao === "Concluída") {
        await tx.pet.update({
          where: { idAnimal: adocao.idAnimal },
          data: { statusAdocao: "Adotado" },
        });
      }

      if (input.statusAdocao === "Cancelada") {
        await tx.pet.update({
          where: { idAnimal: adocao.idAnimal },
          data: { statusAdocao: "Disponível" },
        });
      }

      return tx.adocao.update({
        where: { idAdocao: adocao.idAdocao },
        data: { statusAdocao: input.statusAdocao },
        include: { pet: true, cliente: true },
      });
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

interestsRouter.get("/:id/messages", requireAuth(), async (req, res, next) => {
  try {
    const adocao = await getAdocaoForParticipant(parseId(req.params.id), req.user!);
    res.json(adocao.mensagens);
  } catch (error) {
    next(error);
  }
});

interestsRouter.post("/:id/messages", requireAuth(), async (req, res, next) => {
  try {
    const input = createMessageSchema.parse(req.body);
    const adocao = await getAdocaoForParticipant(parseId(req.params.id), req.user!);

    const mensagem = await prisma.mensagem.create({
      data: {
        idAdocao: adocao.idAdocao,
        idUsuario: req.user!.id,
        conteudo: input.conteudo,
      },
      include: {
        usuario: {
          select: { id: true, email: true, papel: true },
        },
      },
    });

    res.status(201).json(mensagem);
  } catch (error) {
    next(error);
  }
});
