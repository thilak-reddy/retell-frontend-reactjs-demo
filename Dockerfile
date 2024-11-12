# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY frontend/ .

# Build the frontend
RUN npm run build

# Set the working directory for the backend
WORKDIR /app/example_backend

# Copy the backend package.json and package-lock.json files
COPY example_backend/package*.json ./

# Install backend dependencies
RUN npm install

# Copy the rest of the backend code
COPY example_backend/ .

# Expose the port the app runs on
EXPOSE 8080

# Define the command to run the backend
CMD ["npm", "start"] 