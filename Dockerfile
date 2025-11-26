# Etapa 1: build da aplicação Angular
FROM node:20-alpine AS build

WORKDIR /app

# copia configs primeiro para aproveitar cache
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration production

# Etapa 2: Nginx servindo os arquivos estáticos
FROM nginx:1.27-alpine

# Remove config default
RUN rm /etc/nginx/conf.d/default.conf

# Copia nossa config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia o build Angular
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
