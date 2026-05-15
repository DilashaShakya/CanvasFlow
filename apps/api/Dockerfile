FROM node:22-alpine

WORKDIR /app

RUN npm install -g pnpm@10.16.1

COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN pnpm install --frozen-lockfile=false

COPY . .

RUN pnpm --filter @canvasflow/api prisma:generate

EXPOSE 4000

CMD ["sh", "-c", "pnpm --filter @canvasflow/api prisma:generate && pnpm --filter @canvasflow/api dev"]
