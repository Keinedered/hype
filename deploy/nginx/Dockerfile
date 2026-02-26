# ---- Stage 1: Build frontend ----
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit

COPY index.html vite.config.ts tsconfig.json ./
COPY src/ ./src/

ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# ---- Stage 2: Nginx with built frontend ----
FROM nginx:1.25-alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our nginx configs
COPY deploy/nginx/nginx.conf /etc/nginx/nginx.conf
COPY deploy/nginx/graph-ranepe.ru.conf /etc/nginx/conf.d/default.conf

# Generate self-signed placeholder certificate
# (will be replaced by certbot real cert via mounted volume)
RUN mkdir -p /etc/nginx/ssl && \
    apk add --no-cache openssl && \
    openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
      -keyout /etc/nginx/ssl/privkey.pem \
      -out /etc/nginx/ssl/fullchain.pem \
      -subj "/CN=graph-ranepa.ru" && \
    apk del openssl

# Copy built frontend from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Create certbot webroot directory
RUN mkdir -p /var/www/certbot

# Entrypoint: swap in Let's Encrypt cert if available
COPY deploy/nginx/entrypoint.sh /entrypoint.sh

EXPOSE 80 443

ENTRYPOINT ["/entrypoint.sh"]
