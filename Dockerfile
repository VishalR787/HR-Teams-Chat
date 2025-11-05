# Node.js 20 Alpine base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm install --production

# Copy application code
COPY . .

# Set environment variable
ENV PORT=5000

# Expose port
EXPOSE 5000

# Start the application
CMD ["node", "src/server.js"]
