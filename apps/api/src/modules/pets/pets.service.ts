import { prisma, type Adopter, type Pet, type Prisma } from "@conecta-patas/db";
import { HttpError } from "../../lib/http-error";

const organizationPublic = {
  id: true,
  name: true,
  responsible: true,
  email: true,
  phone: true,
  city: true,
} as const;

export function compatibilityScore(pet: Pet, adopter: Adopter | null) {
  if (!adopter) {
    return 0;
  }

  let score = 0;

  if (adopter.preferredSpecies && pet.species === adopter.preferredSpecies) score += 2;
  if (adopter.preferredSize && pet.size === adopter.preferredSize) score += 1;
  if (adopter.preferredSex && pet.sex === adopter.preferredSex) score += 1;
  if (pet.city.toLowerCase() === adopter.city.toLowerCase()) score += 1;
  if (adopter.hasChildren && pet.goodWithChildren) score += 1;
  if (adopter.hasOtherAnimals && pet.goodWithAnimals) score += 1;
  if (pet.specialNeeds && adopter.acceptsSpecialNeeds) score += 1;
  if (pet.specialNeeds && !adopter.acceptsSpecialNeeds) score -= 2;

  return score;
}

export async function listAvailablePets(filters: Prisma.PetWhereInput, adopter: Adopter | null) {
  const pets = await prisma.pet.findMany({
    where: {
      status: "DISPONIVEL",
      ...filters,
    },
    include: { organization: { select: organizationPublic } },
    orderBy: { createdAt: "desc" },
  });

  return pets
    .map((pet) => ({
      ...pet,
      compatibilityScore: compatibilityScore(pet, adopter),
    }))
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore);
}

export async function getPetById(id: string, user?: { id: string; role: string }) {
  const pet = await prisma.pet.findUnique({
    where: { id },
    include: { organization: { select: organizationPublic } },
  });

  if (!pet) {
    throw new HttpError(404, "Pet nao encontrado");
  }

  if (pet.status === "ARQUIVADO") {
    const organization =
      user?.role === "ONG"
        ? await prisma.organization.findUnique({ where: { userId: user.id } })
        : null;

    if (!organization || organization.id !== pet.organizationId) {
      throw new HttpError(404, "Pet nao encontrado");
    }
  }

  let adopter: Adopter | null = null;
  if (user?.role === "ADOTANTE") {
    adopter = await prisma.adopter.findUnique({ where: { userId: user.id } });
  }

  return {
    ...pet,
    compatibilityScore: compatibilityScore(pet, adopter),
  };
}

export async function createPet(userId: string, data: Prisma.PetCreateWithoutOrganizationInput) {
  const organization = await prisma.organization.findUnique({ where: { userId } });
  if (!organization) {
    throw new HttpError(403, "ONG nao encontrada");
  }

  return prisma.pet.create({
    data: {
      ...data,
      organization: { connect: { id: organization.id } },
    },
    include: { organization: { select: organizationPublic } },
  });
}

export async function updateOwnPet(
  userId: string,
  petId: string,
  data: Prisma.PetUncheckedUpdateInput,
) {
  const pet = await getOwnedPet(userId, petId);
  return prisma.pet.update({
    where: { id: pet.id },
    data,
    include: { organization: { select: organizationPublic } },
  });
}

export async function archiveOwnPet(userId: string, petId: string) {
  const pet = await getOwnedPet(userId, petId);
  return prisma.pet.update({
    where: { id: pet.id },
    data: { status: "ARQUIVADO" },
  });
}

async function getOwnedPet(userId: string, petId: string) {
  const organization = await prisma.organization.findUnique({ where: { userId } });
  if (!organization) {
    throw new HttpError(403, "ONG nao encontrada");
  }

  const pet = await prisma.pet.findUnique({ where: { id: petId } });
  if (!pet || pet.organizationId !== organization.id) {
    throw new HttpError(404, "Pet nao encontrado nesta ONG");
  }

  return pet;
}
