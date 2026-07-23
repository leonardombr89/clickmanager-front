# ClickManager Frontend

Frontend Angular principal do ClickManager.

## Endereco oficial

A aplicacao deve ser publicada na raiz do dominio:

https://app.clickmanager.com.br

Rotas internas como `/login`, `/apps/empresa` e `/page/deposito/itens` devem ser atendidas diretamente pelo Nginx do container do frontend com fallback para `/index.html`.

O build de producao usa `<base href="/">` e os arquivos estaticos sao servidos a partir da raiz de `/usr/share/nginx/html/`.

As chamadas para backend em producao devem continuar relativas ao mesmo dominio, usando caminhos como `/api/` e `/auth/`. O roteamento para o backend deve ser feito no Nginx principal da infraestrutura, fora desta aplicacao.

## Build

```bash
npm run build:prod
```

## Docker

```bash
docker build -t clickmanager-frontend .
docker run --rm -p 8080:80 clickmanager-frontend
```
