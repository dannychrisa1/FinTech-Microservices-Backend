FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the auth service
RUN npm run build auth-service

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 3001

# Start the application
CMD ["node", "dist/apps/auth-service/main.js"]