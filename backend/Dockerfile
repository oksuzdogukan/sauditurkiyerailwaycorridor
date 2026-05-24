# backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

# Tüm kodları kopyala
COPY . .

EXPOSE 3000

CMD ["node", "server.js"]