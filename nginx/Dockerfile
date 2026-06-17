FROM nginx:alpine

# Install openssl to generate self-signed certificate
RUN apk add --no-cache openssl

# Create directories for certificates
RUN mkdir -p /etc/nginx/certs

# Generate self-signed certificate
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/certs/nginx.key \
    -out /etc/nginx/certs/nginx.crt \
    -subj "/C=AR/ST=SanJuan/L=SanJuan/O=MinisterioEducacion/CN=localhost"

# Copy Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
