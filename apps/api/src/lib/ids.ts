import { HttpError } from "./http-error";

export function parseId(value: string) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, "Id invalido");
  }
  return id;
}
