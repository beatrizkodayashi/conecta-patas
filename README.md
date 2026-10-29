# Conecta Patas — backend

API REST em Node.js (Express + TypeScript) no banco PostgreSQL da colaboradora no Neon. Não há frontend: teste no Postman ou Insomnia.

Tabelas existentes (não renomeadas): `ong`, `cliente`, `pet`, `adocao`.  
Tabelas novas da API: `usuario`, `mensagem`.

## Como subir

1. Copie `.env.example` para `.env` e cole as URLs do projeto Neon **`projeto` / `neondb`**.
2. Instale, aplique só a migration aditiva e crie os logins de demo:

```bash
npm install
npm run db:migrate:deploy
npm run db:seed
npm run dev
```

Health check: [http://localhost:3000/health](http://localhost:3000/health)

## Contas do seed

Não apaga os dados dela. Só cria login em cima de registros que já existem.

| Perfil | E-mail | Senha |
|--------|--------|-------|
| ONG | `contato@patinhasfelizes.org` | `senha123` |
| Adotante | `maria.silva@email.com` | `senha123` |

## Autenticação

```http
Authorization: Bearer SEU_TOKEN
```

Formatos obrigatórios (CHECKs do banco):

- CPF: `111.111.111-11`
- CNPJ: `11.111.111/0001-01`
- Telefone: `(11) 91000-1001`

## Rotas

| Método | Caminho | Quem |
|--------|---------|------|
| GET | `/health` | público |
| POST | `/api/auth/register/adopter` | público |
| POST | `/api/auth/register/ong` | público |
| POST | `/api/auth/login` | público |
| GET | `/api/auth/me` | logado |
| GET/PATCH | `/api/adopters/me` | cliente |
| GET | `/api/adopters/me/interests` | cliente |
| GET/PATCH | `/api/ongs/me` | ONG |
| GET | `/api/ongs/me/dashboard` | ONG |
| GET | `/api/ongs/me/pets` | ONG |
| GET | `/api/ongs/me/interests` | ONG |
| GET | `/api/pets` | público |
| GET | `/api/pets/:id` | público |
| POST | `/api/pets` | ONG |
| PATCH | `/api/pets/:id` | ONG dona |
| DELETE | `/api/pets/:id` | ONG dona (arquiva) |
| POST | `/api/interests` | cliente (`idAnimal`) |
| GET | `/api/interests/:id` | participantes |
| PATCH | `/api/interests/:id` | ONG (`Concluída`, `Cancelada` ou `Em análise`) |
| GET/POST | `/api/interests/:id/messages` | participantes |

Filtros: `tipoAnimal`, `porte`, `sexo`, `cidade`, `bomComCriancas`, `bomComAnimais`, `necessidadesEspeciais`.

```http
GET /api/pets?tipoAnimal=Gato&porte=Pequeno&cidade=Sao Paulo
```

Coleção: `docs/postman/conecta-patas.postman_collection.json`.

## Regras

- Pet sempre pertence a uma ONG (`cnpj_ong`).
- Interesse só em pet `Disponível`.
- Um pet só tem um processo ativo (não `Cancelada`).
- Ao concluir, o pet vira `Adotado`. Ao cancelar, volta para `Disponível`.
- A ficha do pet inclui saúde antes do interesse.
- `cliente.id_adocacao` existe no banco, mas a API não usa.
