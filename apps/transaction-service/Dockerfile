FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the transaction service
RUN npm run build transaction-service

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 3003

# Start the application
CMD ["node", "dist/apps/transaction-service/main.js"]