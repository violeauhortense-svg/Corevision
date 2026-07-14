# Build stage - UPDATED 2026-07-14 07:35 UTC
FROM denoland/deno:latest AS builder

WORKDIR /app

# Copier le code du serveur depuis src/app/backend (UNIQUE SOURCE)
COPY src/app/backend /app/server

WORKDIR /app/server

# Pré-télécharger les dépendances Deno
RUN deno cache index.tsx || true

# Production stage
FROM denoland/deno:latest

WORKDIR /app

# Copier depuis builder
COPY --from=builder /app/server /app/server

WORKDIR /app/server

# Variables d'environnement
ENV DENO_DIR=/deno-dir \
    PORT=3000 \
    DATA_DIR=/data \
    UPLOADS_DIR=/uploads \
    DENO_ENABLE_HYPER_HTTP_PARSER=1

# Créer les répertoires
RUN mkdir -p /data /uploads

EXPOSE 3000

# Lancer le serveur
CMD ["deno", "run", "--allow-all", "index.tsx"]
