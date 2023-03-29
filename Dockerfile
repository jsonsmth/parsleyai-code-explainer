# Use the official Node.js LTS (Long Term Support) image as the base image
FROM node:18

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json into the working directory
COPY package*.json ./

# Install the app dependencies
RUN npm install

# Copy the application files into the working directory
COPY . .

# Expose the port the app will run on
EXPOSE 8080

# Start the application
CMD [ "npm", "start" ]
