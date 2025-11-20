# /pesho/Dockerfile (lines 1..20)
FROM node:20-alpine

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --production

# copy app
COPY . .

# expose port for pairing / health endpoint
EXPOSE 8080

CMD ["node", "index.js"]
