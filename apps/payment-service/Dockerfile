FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the payment service
RUN npm run build payment-service

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 3004

# Start the application
CMD ["node", "dist/apps/payment-service/main.js"]