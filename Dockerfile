# Hugging Face Spaces (SDK Docker): frontend Next.js + backend FastAPI en un solo contenedor.
# HF expone el puerto 7860 → Next.js; Next reenvía /api/* al backend interno en 7861.
# Secretos del Space: ANTHROPIC_API_KEY (Claude) y CLAVE_ACCESO (clave de la IA generativa).

# --- 1. Frontend ---
FROM node:24-alpine AS web
WORKDIR /app
RUN corepack enable
COPY web/package.json web/pnpm-lock.yaml web/pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY web/ .
ARG NEXT_PUBLIC_REPO_URL=https://github.com/danilo-ds7/thoraxlens
ENV NEXT_PUBLIC_API_URL=/ NEXT_PUBLIC_REPO_URL=$NEXT_PUBLIC_REPO_URL \
    API_INTERNA_URL=http://127.0.0.1:7861 NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# --- 2. Backend + runtime ---
FROM python:3.12-slim
RUN apt-get update && apt-get install -y --no-install-recommends libgl1 libglib2.0-0 curl ca-certificates \
    && curl -fsSL https://deb.nodesource.com/setup_24.x | bash - && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*
RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH" YOLO_OFFLINE=1 YOLO_CONFIG_DIR=/tmp/Ultralytics \
    NODE_ENV=production PORT=7860 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY --chown=user app.py .
COPY --chown=user modelo/ modelo/
COPY --chown=user --from=web /app/.next/standalone ./web/
COPY --chown=user --from=web /app/.next/static ./web/.next/static
COPY --chown=user --from=web /app/public ./web/public
EXPOSE 7860
CMD ["sh", "-c", "uvicorn app:app --host 127.0.0.1 --port 7861 & exec node web/server.js"]
