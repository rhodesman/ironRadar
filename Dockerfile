FROM node:20-slim

WORKDIR /app/backend-server

# Install backend deps in-container for correct platform binaries
COPY backend-server/package*.json ./
RUN npm install --omit=dev

# Backend source
COPY backend-server/ ./

# Pre-built frontend (built on host in Task 4)
COPY dashboard/static /app/dashboard/static

ENV PORT=8888
EXPOSE 8888

CMD ["node", "server.js"]
