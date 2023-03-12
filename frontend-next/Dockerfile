# Use an official Node.js runtime as a parent image
FROM node:16

# Set the working directory to /app
WORKDIR /usr/src/app/my-app

# Copy the package.json and yarn.lock files into the container
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install

# Copy the rest of the application code into the container
COPY . .

RUN chmod 777 node_modules

# Expose the port that the app will run on
EXPOSE 3000

# Start the development server
CMD ["yarn", "dev"]
