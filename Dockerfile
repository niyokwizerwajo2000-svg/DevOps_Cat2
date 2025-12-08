FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied when available
COPY package*.json ./

RUN npm ci --only=production || npm install --only=production

# Bundle app source
COPY . .

EXPOSE 3000

# Default to running the production start script. Compose can override with `command` for dev.
CMD ["npm", "start"]
