FROM node:20-alpine

# Install libc6-compat for Alpine compatibility (needed for native binaries like ngrok)
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install ALL dependencies (including devDependencies for ngrok)
RUN npm ci

# Copy application code
COPY . .

# Expose port 3000
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start in development mode to support ngrok and all dev features
CMD ["npm", "run", "dev"]
