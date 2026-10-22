import { Router } from "express";
import { prisma, Role } from "@conecta-patas/db";
import { z } from "zod";
import { requireAuth } from "../../middlewares/auth";
import { HttpError } from "../../lib/http-error";
import { residenceTypeSchema, sexSchema, sizeSchema, speciesSchema } from "../../lib/schemas";

export const adoptersRouter = Router();

const updateAdopterSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(8).optional(),
  address: z.string().min(3).optional(),
  city: z.string().min(2).optional(),
  residenceType: residenceTypeSchema.optional(),
  hasChildren: z.boolean().optional(),
  hasElderly: z.boolean().optional(),
  hasAdults: z.boolean().optional(),
  hasOtherAnimals: z.boolean().optional(),
  otherAnimalsNote: z.string().nullable().optional(),
  routine: z.string().min(3).optional(),
  preferredSpecies: speciesSchema.nullable().optional(),
  preferredSize: sizeSchema.nullable().optional(),
  preferredSex: sexSchema.nullable().optional(),
  acceptsSpecialNeeds: z.boolean().optional(),
});

async function getAdopterOrThrow(userId: string) {
  const adopter = await prisma.adopter.findUnique({
    where: { userId },
    include: {
      interests: {
        include: {
          pet: {
            include: {
              organization: {
                select: { id: true, name: true, phone: true, city: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!adopter) {
    throw new HttpError(404, "Perfil de adotante nao encontrado");
  }

  return adopter;
}

adoptersRouter.get("/me", requireAuth([Role.ADOTANTE]), async (req, res, next) => {
  try {
    const adopter = await getAdopterOrThrow(req.user!.id);
    res.json(adopter);
  } catch (error) {
    next(error);
  }
});

adoptersRouter.patch("/me", requireAuth([Role.ADOTANTE]), async (req, res, next) => {
  try {
    const input = updateAdopterSchema.parse(req.body);
    const current = await getAdopterOrThrow(req.user!.id);
    const adopter = await prisma.adopter.update({
      where: { id: current.id },
      data: input,
    });
    res.json(adopter);
  } catch (error) {
    next(error);
  }
});

adoptersRouter.get("/me/interests", requireAuth([Role.ADOTANTE]), async (req, res, next) => {
  try {
    const adopter = await getAdopterOrThrow(req.user!.id);
    res.json(adopter.interests);
  } catch (error) {
    next(error);
  }
});
