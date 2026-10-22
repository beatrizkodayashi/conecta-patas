import { Router } from "express";
import { prisma, Role } from "@conecta-patas/db";
import { z } from "zod";
import { requireAuth } from "../../middlewares/auth";
import { HttpError } from "../../lib/http-error";

export const interestsRouter = Router();

const createInterestSchema = z.object({
  petId: z.string().uuid(),
  message: z.string().min(1).optional(),
});

const updateInterestSchema = z.object({
  status: z.enum(["ACEITO", "RECUSADO"]),
});

const createMessageSchema = z.object({
  content: z.string().min(1),
});

async function getAdopterByUserId(userId: string) {
  const adopter = await prisma.adopter.findUnique({ where: { userId } });
  if (!adopter) {
    throw new HttpError(403, "Perfil de adotante nao encontrado");
  }
  return adopter;
}

async function getOrganizationByUserId(userId: string) {
  const organization = await prisma.organization.findUnique({ where: { userId } });
  if (!organization) {
    throw new HttpError(403, "ONG nao encontrada");
  }
  return organization;
}

async function getInterestForParticipant(interestId: string, user: { id: string; role: Role }) {
  const interest = await prisma.interest.findUnique({
    where: { id: interestId },
    include: {
      adopter: true,
      pet: true,
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          sender: {
            select: { id: true, email: true, role: true },
          },
        },
      },
    },
  });

  if (!interest) {
    throw new HttpError(404, "Interesse nao encontrado");
  }

  if (user.role === Role.ADOTANTE && interest.adopter.userId !== user.id) {
    throw new HttpError(403, "Acesso negado a este interesse");
  }

  if (user.role === Role.ONG) {
    const organization = await getOrganizationByUserId(user.id);
    if (interest.pet.organizationId !== organization.id) {
      throw new HttpError(403, "Acesso negado a este interesse");
    }
  }

  return interest;
}

interestsRouter.post("/", requireAuth([Role.ADOTANTE]), async (req, res, next) => {
  try {
    const input = createInterestSchema.parse(req.body);
    const adopter = await getAdopterByUserId(req.user!.id);
    const pet = await prisma.pet.findUnique({ where: { id: input.petId } });

    if (!pet || pet.status === "ARQUIVADO") {
      throw new HttpError(404, "Pet nao encontrado");
    }

    if (pet.status !== "DISPONIVEL") {
      throw new HttpError(409, "Apenas pets disponiveis podem receber interesse");
    }

    const interest = await prisma.interest.create({
      data: {
        adopterId: adopter.id,
        petId: pet.id,
        messages: input.message
          ? {
              create: {
                senderId: req.user!.id,
                content: input.message,
              },
            }
          : undefined,
      },
      include: {
        pet: true,
        messages: true,
      },
    });

    res.status(201).json(interest);
  } catch (error) {
    next(error);
  }
});

interestsRouter.get("/:id", requireAuth(), async (req, res, next) => {
  try {
    const interest = await getInterestForParticipant(req.params.id, req.user!);
    res.json(interest);
  } catch (error) {
    next(error);
  }
});

interestsRouter.patch("/:id", requireAuth([Role.ONG]), async (req, res, next) => {
  try {
    const input = updateInterestSchema.parse(req.body);
    const interest = await getInterestForParticipant(req.params.id, req.user!);

    if (interest.status !== "PENDENTE") {
      throw new HttpError(409, "Este interesse ja foi respondido");
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (input.status === "ACEITO") {
        await tx.pet.update({
          where: { id: interest.petId },
          data: { status: "ADOTADO" },
        });

        await tx.interest.updateMany({
          where: {
            petId: interest.petId,
            id: { not: interest.id },
            status: "PENDENTE",
          },
          data: { status: "RECUSADO" },
        });
      }

      return tx.interest.update({
        where: { id: interest.id },
        data: { status: input.status },
        include: { pet: true, adopter: true },
      });
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

interestsRouter.get("/:id/messages", requireAuth(), async (req, res, next) => {
  try {
    const interest = await getInterestForParticipant(req.params.id, req.user!);
    res.json(interest.messages);
  } catch (error) {
    next(error);
  }
});

interestsRouter.post("/:id/messages", requireAuth(), async (req, res, next) => {
  try {
    const input = createMessageSchema.parse(req.body);
    const interest = await getInterestForParticipant(req.params.id, req.user!);

    const message = await prisma.message.create({
      data: {
        interestId: interest.id,
        senderId: req.user!.id,
        content: input.content,
      },
      include: {
        sender: {
          select: { id: true, email: true, role: true },
        },
      },
    });

    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
});
