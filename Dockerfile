# =========================
# 1) Build de Vite
# =========================
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build producción
RUN npm run build

# =========================
# 2) Servidor estático (sin Nginx)
# =========================
FROM node:20-alpine

WORKDIR /app

# Servidor estático muy simple
RUN npm install -g serve

# Copiamos el build
COPY --from=build /app/dist ./dist

EXPOSE 9443

# Servir dist en 0.0.0.0:9443
CMD ["serve", "-s", "dist", "-l", "9443", "-n"]