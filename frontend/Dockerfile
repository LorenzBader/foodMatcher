FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
# Pass the --host flag to vite so it listens on 0.0.0.0
CMD ["npm", "run", "dev", "--", "--host"]