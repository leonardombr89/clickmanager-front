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
COPY --from=build /app/dist/Spike/browser/ /usr/share/nginx/html

# opcional: configurar fallback SPA (se você tiver rotas no Angular)
# cria um nginx.conf mínimo
RUN printf 'server {\n\
    listen 80;\n\
    server_name _;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
