import { Router } from "express";
import { prisma, Role } from "@conecta-patas/db";
import { z } from "zod";
import { requireAuth } from "../../middlewares/auth";
import { HttpError } from "../../lib/http-error";

export const ongsRouter = Router();

const updateOngSchema = z.object({
  name: z.string().min(2).optional(),
  responsible: z.string().min(2).optional(),
  phone: z.string().min(8).optional(),
  address: z.string().min(3).optional(),
  city: z.string().min(2).optional(),
});

async function getOrganizationOrThrow(userId: string) {
  const organization = await prisma.organization.findUnique({
    where: { userId },
  });

  if (!organization) {
    throw new HttpError(404, "ONG nao encontrada");
  }

  return organization;
}

ongsRouter.get("/me", requireAuth([Role.ONG]), async (req, res, next) => {
  try {
    const organization = await getOrganizationOrThrow(req.user!.id);
    res.json(organization);
  } catch (error) {
    next(error);
  }
});

ongsRouter.patch("/me", requireAuth([Role.ONG]), async (req, res, next) => {
  try {
    const input = updateOngSchema.parse(req.body);
    const current = await getOrganizationOrThrow(req.user!.id);
    const organization = await prisma.organization.update({
      where: { id: current.id },
      data: input,
    });
    res.json(organization);
  } catch (error) {
    next(error);
  }
});

ongsRouter.get("/me/dashboard", requireAuth([Role.ONG]), async (req, res, next) => {
  try {
    const organization = await getOrganizationOrThrow(req.user!.id);

    const [total, disponiveis, emAnalise, adotados, arquivados, interessesPendentes] =
      await Promise.all([
        prisma.pet.count({ where: { organizationId: organization.id } }),
        prisma.pet.count({ where: { organizationId: organization.id, status: "DISPONIVEL" } }),
        prisma.pet.count({ where: { organizationId: organization.id, status: "EM_ANALISE" } }),
        prisma.pet.count({ where: { organizationId: organization.id, status: "ADOTADO" } }),
        prisma.pet.count({ where: { organizationId: organization.id, status: "ARQUIVADO" } }),
        prisma.interest.count({
          where: {
            status: "PENDENTE",
            pet: { organizationId: organization.id },
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

ongsRouter.get("/me/pets", requireAuth([Role.ONG]), async (req, res, next) => {
  try {
    const organization = await getOrganizationOrThrow(req.user!.id);
    const pets = await prisma.pet.findMany({
      where: { organizationId: organization.id },
      orderBy: { createdAt: "desc" },
    });
    res.json(pets);
  } catch (error) {
    next(error);
  }
});

ongsRouter.get("/me/interests", requireAuth([Role.ONG]), async (req, res, next) => {
  try {
    const organization = await getOrganizationOrThrow(req.user!.id);
    const interests = await prisma.interest.findMany({
      where: { pet: { organizationId: organization.id } },
      include: {
        adopter: true,
        pet: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(interests);
  } catch (error) {
    next(error);
  }
});
