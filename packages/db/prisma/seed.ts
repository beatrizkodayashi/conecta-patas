import { hashSync } from "bcryptjs";
import {
  InterestStatus,
  PetStatus,
  PrismaClient,
  ResidenceType,
  Role,
  Sex,
  Size,
  Species,
} from "../src/generated/client";

const prisma = new PrismaClient();
const passwordHash = hashSync("senha123", 10);

async function main() {
  await prisma.message.deleteMany();
  await prisma.interest.deleteMany();
  await prisma.pet.deleteMany();
  await prisma.adopter.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();

  const ongUser = await prisma.user.create({
    data: {
      email: "ong@conectapatas.com",
      passwordHash,
      role: Role.ONG,
      organization: {
        create: {
          name: "Patas Felizes",
          cnpj: "12.345.678/0001-90",
          responsible: "Ana Souza",
          email: "ong@conectapatas.com",
          phone: "11999990000",
          address: "Rua das Flores, 100",
          city: "Sao Paulo",
        },
      },
    },
    include: { organization: true },
  });

  const adopterUser = await prisma.user.create({
    data: {
      email: "adotante@conectapatas.com",
      passwordHash,
      role: Role.ADOTANTE,
      adopter: {
        create: {
          name: "Carlos Lima",
          phone: "11988887777",
          address: "Av. Paulista, 1000",
          city: "Sao Paulo",
          residenceType: ResidenceType.APARTAMENTO,
          hasChildren: false,
          hasElderly: false,
          hasAdults: true,
          hasOtherAnimals: true,
          otherAnimalsNote: "Um gato adulto de bom temperamento",
          routine: "Trabalho fora cerca de 8h por dia",
          preferredSpecies: Species.GATO,
          preferredSize: Size.PEQUENO,
          preferredSex: Sex.FEMEA,
          acceptsSpecialNeeds: false,
        },
      },
    },
    include: { adopter: true },
  });

  const organizationId = ongUser.organization!.id;
  const adopterId = adopterUser.adopter!.id;

  const luna = await prisma.pet.create({
    data: {
      organizationId,
      name: "Luna",
      species: Species.GATO,
      sex: Sex.FEMEA,
      approximateAge: "2 anos",
      size: Size.PEQUENO,
      characteristics: "Calma, carinhosa e independente",
      goodWithChildren: true,
      goodWithAnimals: true,
      specialNeeds: false,
      vaccinated: true,
      neutered: true,
      photos: ["https://placekitten.com/400/400"],
      city: "Sao Paulo",
      status: PetStatus.DISPONIVEL,
    },
  });

  await prisma.pet.createMany({
    data: [
      {
        organizationId,
        name: "Thor",
        species: Species.CAO,
        sex: Sex.MACHO,
        approximateAge: "4 anos",
        size: Size.GRANDE,
        characteristics: "Energetico, precisa de espaco e passeios",
        goodWithChildren: true,
        goodWithAnimals: false,
        specialNeeds: false,
        vaccinated: true,
        neutered: true,
        photos: ["https://placedog.net/400/400"],
        city: "Sao Paulo",
        status: PetStatus.DISPONIVEL,
      },
      {
        organizationId,
        name: "Mimi",
        species: Species.GATO,
        sex: Sex.FEMEA,
        approximateAge: "8 anos",
        size: Size.PEQUENO,
        characteristics: "Idosa, precisa de ambiente calmo",
        goodWithChildren: false,
        goodWithAnimals: true,
        specialNeeds: true,
        specialNeedsNote: "Medicacao diaria para rim",
        vaccinated: true,
        neutered: true,
        photos: ["https://placekitten.com/401/400"],
        city: "Campinas",
        status: PetStatus.DISPONIVEL,
      },
      {
        organizationId,
        name: "Bob",
        species: Species.CAO,
        sex: Sex.MACHO,
        approximateAge: "1 ano",
        size: Size.MEDIO,
        characteristics: "Ja foi adotado por outra familia",
        goodWithChildren: true,
        goodWithAnimals: true,
        specialNeeds: false,
        vaccinated: true,
        neutered: true,
        photos: ["https://placedog.net/401/400"],
        city: "Sao Paulo",
        status: PetStatus.ADOTADO,
      },
    ],
  });

  await prisma.interest.create({
    data: {
      adopterId,
      petId: luna.id,
      status: InterestStatus.PENDENTE,
      messages: {
        create: {
          senderId: adopterUser.id,
          content: "Ola! Gostaria de saber mais sobre a Luna.",
        },
      },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
