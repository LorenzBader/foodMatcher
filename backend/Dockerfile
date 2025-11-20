FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
EXPOSE 3001
# Run the server executable directly to avoid build scripts
CMD ["node", "./bin/www"]