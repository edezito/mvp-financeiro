# --- Base Stage ---
FROM node:20-slim AS base
WORKDIR /app

# Configurações para evitar ECONNRESET e melhorar velocidade no Docker
RUN npm config set fetch-retry-maxtimeout 600000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 15000

# --- Builder Stage ---
FROM base AS builder
COPY package.json ./
# Instalamos tudo (incluindo devDependencies) para o build
RUN npm install --legacy-peer-deps
COPY . .

# --- INJEÇÃO DE VARIÁVEIS PARA O BUILD DO NEXT.JS ---
# 1. Recebe os argumentos passados pelo docker-compose
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID

# 2. Define como variáveis de ambiente para o processo de build acessar
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ENV NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID
# ---------------------------------------------------

RUN npm run build

# --- Production Stage ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Criamos um usuário do sistema para não rodar como root (Segurança)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# O segredo do standalone: copiar apenas o necessário do builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# Se o seu projeto tiver uma pasta 'public', descomente a linha abaixo:
# COPY --from=builder /app/public ./public

USER nextjs

EXPOSE 3000

# Variável de ambiente necessária para o standalone do Next.js
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]