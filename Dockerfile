# ----- Build Stage -----
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy dependency mappings
COPY package*.json ./

# Install dependencies cleanly
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the production optimized static Vite assets
RUN npm run build

# ----- Production Stage -----
FROM nginx:alpine

# Copy the built assets to the Nginx HTML directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy a standard super-fast configuration (optional, here we rely on default nginx config for static files)
# EXPOSE port 80 for normal HTTP traffic
EXPOSE 80

# Spin up Nginx
CMD ["nginx", "-g", "daemon off;"]
