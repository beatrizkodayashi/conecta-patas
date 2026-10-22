# Conecta Patas — backend

API REST em Node.js (Express + TypeScript) e banco PostgreSQL com Prisma. Não há frontend: teste as rotas no Insomnia ou no Postman.

## Pastas

```text
apps/api          API HTTP
packages/db       Prisma (schema, migrations, seed)
docker-compose.yml  Postgres local para desenvolvimento
```

O `DATABASE_URL` é a única amarra com o banco. Docker agora; Neon ou Supabase depois, sem mudar o código.

## Como subir

1. Copie o arquivo de ambiente:

```bash
cp .env.example .env
```

2. Suba o Postgres:

```bash
npm run db:up
```

3. Instale as dependências, aplique o banco e gere dados de demo:

```bash
npm install
npm run db:migrate:deploy
npm run db:seed
```

Na primeira vez em máquina nova, se o Prisma pedir o nome da migration, use `npm run db:migrate` em vez de `deploy`.

4. Suba a API:

```bash
npm run dev
```

Health check: [http://localhost:3000/health](http://localhost:3000/health)

## Contas do seed

| Perfil   | E-mail                    | Senha    |
|----------|---------------------------|----------|
| ONG      | ong@conectapatas.com      | senha123 |
| Adotante | adotante@conectapatas.com | senha123 |

## Autenticação

Depois do login, envie o token em todas as rotas protegidas:

```http
Authorization: Bearer SEU_TOKEN
```

## Rotas

| Método | Caminho | Quem |
|--------|---------|------|
| GET | `/health` | público |
| POST | `/api/auth/register/adopter` | público |
| POST | `/api/auth/register/ong` | público |
| POST | `/api/auth/login` | público |
| GET | `/api/auth/me` | logado |
| GET/PATCH | `/api/adopters/me` | adotante |
| GET | `/api/adopters/me/interests` | adotante |
| GET/PATCH | `/api/ongs/me` | ONG |
| GET | `/api/ongs/me/dashboard` | ONG |
| GET | `/api/ongs/me/pets` | ONG |
| GET | `/api/ongs/me/interests` | ONG |
| GET | `/api/pets` | público (score extra se adotante logado) |
| GET | `/api/pets/:id` | público |
| POST | `/api/pets` | ONG |
| PATCH | `/api/pets/:id` | ONG dona |
| DELETE | `/api/pets/:id` | ONG dona (arquiva) |
| POST | `/api/interests` | adotante |
| GET | `/api/interests/:id` | adotante ou ONG do pet |
| PATCH | `/api/interests/:id` | ONG (ACEITO ou RECUSADO) |
| GET/POST | `/api/interests/:id/messages` | participantes |

Filtros de busca: `species`, `size`, `sex`, `city`, `goodWithChildren`, `goodWithAnimals`, `specialNeeds`.

Exemplo:

```http
GET /api/pets?species=GATO&size=PEQUENO&city=Sao Paulo
```

Coleção pronta: `docs/postman/conecta-patas.postman_collection.json` (abre no Postman ou importa no Insomnia).

## Regras principais

- Pet sempre pertence a uma ONG.
- Interesse só em pet `DISPONIVEL`.
- Pet `ADOTADO` não aparece na busca.
- Só a ONG dona altera o próprio pet.
- A ficha do pet inclui saúde antes do interesse.
- Ao aceitar um interesse, o pet fica `ADOTADO` e os outros interesses pendentes são recusados.
