# frontend/Dockerfile
# Aşama 1: Build
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Aşama 2: Serve 
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Yeni eklediğimiz Nginx ayar dosyasını içeri kopyalıyoruz:
COPY nginx.conf /etc/nginx/conf.d/default.conf 

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]