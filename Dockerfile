# The K-Nyi portfolio and its marketing intelligence console.
#
# A Node host is required: the console, the public contact form, first-party
# event ingestion and the server-side SEO audit all need a server. GitHub Pages
# cannot run them — it serves the public page only.
#
#   docker build -t knyi .
#   docker run -p 3000:3000 -v knyi-data:/app/data \
#     -e ADMIN_PASSWORD=... -e NEXT_PUBLIC_SITE_URL=https://example.com knyi

FROM node:22-slim AS base
WORKDIR /app

# --- dependencies -----------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
# `npm ci` installs the exact locked tree. The platform-specific optional
# dependency for sharp (the image optimiser) is included, because the image
# optimiser needs it in production.
RUN npm ci --include=optional

# --- build -----------------------------------------------------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- runtime ---------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/content ./content
COPY --from=builder /app/scripts ./scripts

# The database lives here. Mount a volume so it survives a redeploy.
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data
VOLUME ["/app/data"]

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["npm", "run", "start"]