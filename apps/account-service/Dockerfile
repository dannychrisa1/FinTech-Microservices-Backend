FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the account service
RUN npm run build account-service

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 3002

# Start the application
CMD ["node", "dist/apps/account-service/main.js"]