FROM node:18-alpine

WORKDIR /app

# Install openssl for Prisma
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm install

COPY prisma ./prisma/
COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 4000

CMD ["npm", "start"]
