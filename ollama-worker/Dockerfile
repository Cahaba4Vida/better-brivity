FROM node:20-slim
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY server.mjs ./
EXPOSE 8787
CMD ["npm", "start"]
