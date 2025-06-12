FROM node:20.12.1

WORKDIR /app
COPY server/ .
RUN npm ci --omit=dev

EXPOSE 8080
CMD ["npx", "http-server", "./bin", "--port", "8080", "--gzip", "--no-dotfiles", "--utc", "--ssl", "--cert", "cert.pem", "--key", "key.pem"]
