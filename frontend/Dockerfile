# Build stage
FROM node:20-alpine AS build-env
WORKDIR /app

# Copy package descriptors
COPY package*.json ./
RUN npm install

# Copy source files
COPY . ./

# Build production bundle
RUN npm run build

# Runtime stage (Nginx)
FROM nginx:alpine
COPY --from=build-env /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
