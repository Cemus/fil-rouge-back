FROM node:latest
WORKDIR /backend
COPY package*.json ./
RUN npm install
COPY . .
## Corrige l'erreur de bcrypt
RUN npm rebuild bcrypt --build-from-source
CMD ["node", "server.js"]
EXPOSE 3000
