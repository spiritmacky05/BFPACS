# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . ./

# Accept API URL at build time
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build frontend
RUN npm run build


# Production stage (Nginx)
FROM nginx:alpine

# Copy build output
COPY --from=builder /app/dist /usr/share/nginx/html

# Proper nginx config (FIXED)
RUN cat <<'EOF' > /etc/nginx/conf.d/default.conf
server {
    listen 80;
    root /usr/share/nginx/html;

    # SPA routing
    location / {
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    # API proxy (IMPORTANT FIX: NO /api/ in proxy_pass)
    location /api/ {
        proxy_pass http://bfpacs_backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location = /health {
        proxy_pass http://bfpacs_backend:8080/api/v1/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Static caching
    location ~* \.(?:css|js|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
}
EOF

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]