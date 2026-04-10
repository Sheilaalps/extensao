FROM ghcr.io/puppeteer/puppeteer:latest

USER root
WORKDIR /app

# Instala as dependências do sistema necessárias
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .

# Expõe a porta que o Railway vai usar
EXPOSE 3001

CMD ["node", "server.js"]