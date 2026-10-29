import { prisma, type Cliente, type Pet, type Prisma } from "@conecta-patas/db";
import { HttpError } from "../../lib/http-error";

const ongPublica = {
  cnpjOng: true,
  nomeOng: true,
  responsavel: true,
  email: true,
  telefone: true,
  cidade: true,
} as const;

export function compatibilityScore(pet: Pet, cliente: Cliente | null) {
  if (!cliente) {
    return 0;
  }

  let score = 0;
  const tipo = pet.tipoAnimal?.toLowerCase();
  const preferida = cliente.especiePreferida?.toLowerCase();

  if (preferida && tipo) {
    const mesmoTipo =
      tipo === preferida ||
      (preferida === "cao" && tipo === "cachorro") ||
      (preferida === "cachorro" && tipo === "cao");
    if (mesmoTipo) score += 2;
  }
  if (cliente.portePreferido && pet.porte === cliente.portePreferido) score += 1;
  if (cliente.sexoPreferido && pet.sexo === cliente.sexoPreferido) score += 1;
  if (pet.cidade && cliente.cidade && pet.cidade.toLowerCase() === cliente.cidade.toLowerCase()) {
    score += 1;
  }
  if (cliente.temCriancas && pet.bomComCriancas) score += 1;
  if (cliente.temOutrosAnimais && pet.bomComAnimais) score += 1;
  if (pet.necessidadesEspeciais && cliente.aceitaNecessidadesEspeciais) score += 1;
  if (pet.necessidadesEspeciais && !cliente.aceitaNecessidadesEspeciais) score -= 2;

  return score;
}

export async function listAvailablePets(filters: Prisma.PetWhereInput, cliente: Cliente | null) {
  const pets = await prisma.pet.findMany({
    where: {
      statusAdocao: "Disponível",
      ...filters,
    },
    include: { ong: { select: ongPublica } },
    orderBy: { criadoEm: "desc" },
  });

  return pets
    .map((pet) => ({
      ...pet,
      compatibilityScore: compatibilityScore(pet, cliente),
    }))
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore);
}

export async function getPetById(
  idAnimal: number,
  user?: { id: number; role: "CLIENTE" | "ONG" },
) {
  const pet = await prisma.pet.findUnique({
    where: { idAnimal },
    include: { ong: { select: ongPublica } },
  });

  if (!pet) {
    throw new HttpError(404, "Pet nao encontrado");
  }

  if (pet.statusAdocao === "Arquivado") {
    const usuario =
      user?.role === "ONG" ? await prisma.usuario.findUnique({ where: { id: user.id } }) : null;
    if (!usuario?.cnpjOng || usuario.cnpjOng !== pet.cnpjOng) {
      throw new HttpError(404, "Pet nao encontrado");
    }
  }

  let cliente: Cliente | null = null;
  if (user?.role === "CLIENTE") {
    const usuario = await prisma.usuario.findUnique({
      where: { id: user.id },
      include: { cliente: true },
    });
    cliente = usuario?.cliente ?? null;
  }

  return {
    ...pet,
    compatibilityScore: compatibilityScore(pet, cliente),
  };
}

export async function createPet(
  userId: number,
  data: Omit<Prisma.PetUncheckedCreateInput, "cnpjOng" | "idAnimal">,
) {
  const usuario = await prisma.usuario.findUnique({ where: { id: userId } });
  if (!usuario?.cnpjOng) {
    throw new HttpError(403, "ONG nao encontrada");
  }

  return prisma.pet.create({
    data: {
      ...data,
      cnpjOng: usuario.cnpjOng,
    },
    include: { ong: { select: ongPublica } },
  });
}

export async function updateOwnPet(
  userId: number,
  idAnimal: number,
  data: Prisma.PetUncheckedUpdateInput,
) {
  await getOwnedPet(userId, idAnimal);
  return prisma.pet.update({
    where: { idAnimal },
    data,
    include: { ong: { select: ongPublica } },
  });
}

export async function archiveOwnPet(userId: number, idAnimal: number) {
  await getOwnedPet(userId, idAnimal);
  return prisma.pet.update({
    where: { idAnimal },
    data: { statusAdocao: "Arquivado" },
  });
}

async function getOwnedPet(userId: number, idAnimal: number) {
  const usuario = await prisma.usuario.findUnique({ where: { id: userId } });
  if (!usuario?.cnpjOng) {
    throw new HttpError(403, "ONG nao encontrada");
  }

  const pet = await prisma.pet.findUnique({ where: { idAnimal } });
  if (!pet || pet.cnpjOng !== usuario.cnpjOng) {
    throw new HttpError(404, "Pet nao encontrado nesta ONG");
  }

  return pet;
}
