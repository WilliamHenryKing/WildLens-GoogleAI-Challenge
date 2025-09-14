# --- Stage 1: Build the application ---
# Use an official Node.js runtime as the parent image.
# We are using a specific version for reproducibility. 'alpine' is a lightweight version.
FROM node:20-alpine AS builder

# Set the working directory in the container to /app.
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock, etc.) first.
# This leverages Docker's layer caching. The npm install step will only run again
# if these files have changed.
COPY package*.json ./

# Install project dependencies.
RUN npm install

# Copy the rest of the application's source code to the container.
COPY . .

# Run the build script defined in package.json.
# This will create a 'dist' folder with the compiled static assets.
RUN npm run build


# --- Stage 2: Serve the application ---
# Start a new, fresh stage from a lightweight Node.js image for the production environment.
FROM node:20-alpine

# Set the working directory.
WORKDIR /app

# Copy over the package.json files from the builder stage. We need this to install production dependencies.
COPY --from=builder /app/package*.json ./

# Install ONLY production dependencies. The `serve` package is what we need.
# This command skips all `devDependencies`, resulting in a much smaller node_modules folder.
RUN npm install --omit=dev

# Copy the built static assets from the 'builder' stage.
COPY --from=builder /app/dist ./dist

# Google Cloud Run provides a PORT environment variable. We tell the container to listen on this port.
# A default of 8080 is set here, but Cloud Run will override it.
ENV PORT 8080
EXPOSE 8080

# The command to run when the container starts.
# This will execute the "start" script from our package.json file.
CMD ["npm", "start"]