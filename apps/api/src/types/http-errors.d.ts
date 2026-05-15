declare module "http-errors" {
  type CreateHttpError = (status: number, message?: string) => Error & { statusCode: number };

  const createHttpError: CreateHttpError;

  export default createHttpError;
}
