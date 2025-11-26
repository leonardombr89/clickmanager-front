# Stage 1: build Angular
FROM node:20-alpine AS build

WORKDIR /app

# copiar package.json e package-lock.json
COPY package*.json ./

# instalar dependências (usando lockfile)
RUN npm ci --legacy-peer-deps

# copiar o resto do código
COPY . .

# build de produção
RUN npm run build --configuration production

# Stage 2: Nginx servindo o build
FROM nginx:alpine

# remove qualquer arquivo padrão do nginx
RUN rm -rf /usr/share/nginx/html/*

# ⚠️ AQUI É O PONTO IMPORTANTE:
# copie o conteúdo de dist/Spike/browser para a raiz do html
COPY --from=build /app/dist/Spike/browser/ /usr/share/nginx/html

EXPOSE 80
