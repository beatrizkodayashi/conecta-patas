import { prisma, Role } from "@conecta-patas/db";
import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../../env";
import { HttpError } from "../../lib/http-error";
import type { z } from "zod";
import type { loginSchema, registerAdopterSchema, registerOngSchema } from "./auth.schemas";

const userPublicSelect = {
  id: true,
  email: true,
  role: true,
  createdAt: true,
  adopter: true,
  organization: true,
} as const;

function signToken(user: { id: string; email: string; role: Role }) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"] },
  );
}

export async function registerAdopter(input: z.infer<typeof registerAdopterSchema>) {
  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = await prisma.user.create({
    data: {
      email: input.email.toLowerCase(),
      passwordHash,
      role: Role.ADOTANTE,
      adopter: {
        create: {
          name: input.name,
          phone: input.phone,
          address: input.address,
          city: input.city,
          residenceType: input.residenceType,
          hasChildren: input.hasChildren,
          hasElderly: input.hasElderly,
          hasAdults: input.hasAdults,
          hasOtherAnimals: input.hasOtherAnimals,
          otherAnimalsNote: input.otherAnimalsNote,
          routine: input.routine,
          preferredSpecies: input.preferredSpecies,
          preferredSize: input.preferredSize,
          preferredSex: input.preferredSex,
          acceptsSpecialNeeds: input.acceptsSpecialNeeds,
        },
      },
    },
    select: userPublicSelect,
  });

  return { token: signToken(user), user };
}

export async function registerOng(input: z.infer<typeof registerOngSchema>) {
  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = await prisma.user.create({
    data: {
      email: input.email.toLowerCase(),
      passwordHash,
      role: Role.ONG,
      organization: {
        create: {
          name: input.name,
          cnpj: input.cnpj,
          responsible: input.responsible,
          email: input.email.toLowerCase(),
          phone: input.phone,
          address: input.address,
          city: input.city,
        },
      },
    },
    select: userPublicSelect,
  });

  return { token: signToken(user), user };
}

export async function login(input: z.infer<typeof loginSchema>) {
  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
    include: { adopter: true, organization: true },
  });

  if (!user) {
    throw new HttpError(401, "E-mail ou senha invalidos");
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw new HttpError(401, "E-mail ou senha invalidos");
  }

  const { passwordHash: _passwordHash, ...safeUser } = user;
  return { token: signToken(user), user: safeUser };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userPublicSelect,
  });

  if (!user) {
    throw new HttpError(401, "Usuario nao encontrado");
  }

  return user;
}
