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
COPY deploy/nginx/graph.ranepa.ru.conf /etc/nginx/conf.d/default.conf

# Copy built frontend from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Create certbot webroot directory
RUN mkdir -p /var/www/certbot

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
