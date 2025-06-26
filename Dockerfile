# Use official Node.js 20 image
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Install dependencies first for better caching
COPY package.json npm-shrinkwrap.json ./
RUN npm ci --omit=dev

# Copy the rest of the application
COPY . .

# Expose the default port
EXPOSE 3002
EXPOSE 3003

# Start the app
CMD ["node", "./bin/www"]