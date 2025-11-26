# Etapa 1: build Angular
FROM node:20-alpine AS build
WORKDIR /app

# copiar package.json e package-lock.json
COPY package*.json ./
RUN npm install --legacy-peer-deps

# copiar o restante e buildar
COPY . .
RUN npm run build --configuration=production

# Etapa 2: Nginx servindo o build
FROM nginx:alpine

# apaga html padrão do nginx
RUN rm -rf /usr/share/nginx/html/*

# Isso vai deixar os arquivos JS, index.html, assets, etc direto em /usr/share/nginx/html
COPY --from=build /app/dist/Spike/browser /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
