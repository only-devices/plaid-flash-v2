FROM node:20-alpine3.20

# Apply security updates and install runtime dependency
RUN apk update && apk upgrade --no-cache && apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install ALL dependencies (including devDependencies)
RUN npm ci

# Copy application code
COPY . .

# Expose port 3000
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start in development mode
CMD ["npm", "run", "dev"]
