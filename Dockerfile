# Build stage
FROM denoland/deno:latest as builder

WORKDIR /app

# Copier le code du serveur (backend seulement)
COPY src/app/backend /app/server

WORKDIR /app/server

# Pré-télécharger les dépendances Deno (cache)
RUN deno cache index.tsx || true

# Production stage
FROM denoland/deno:latest

WORKDIR /app

# Copier le code depuis le builder
COPY --from=builder /app/server /app/server

WORKDIR /app/server

# Variables d'environnement
ENV DENO_DIR=/deno-dir \
    PORT=3000 \
    DATA_DIR=/data \
    UPLOADS_DIR=/uploads

# Créer les répertoires de données
RUN mkdir -p /data /uploads

# Permissions Deno
ENV DENO_ENABLE_HYPER_HTTP_PARSER=1

EXPOSE 3000

# Lancer le serveur
CMD ["deno", "run", "--allow-all", "index.tsx"]
