FROM node:10

# CREATE APP DIRECTORY
WORKDIR /usr/src/app

# INSTALL APP DEPEDENCIES
# - A wildcard is used to ensure both package.json AND package-lock.json are copied
#   where available (npm@5+)
# - If you are building your code for production
#   RUN npm ci --only=production
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Your app binds to port 8080 so you'll use the EXPOSE instruction to have it mapped by the docker daemon.
EXPOSE 4000 5000

# Define the command to run your app using CMD which defines your runtime.
CMD [ "node", "books.js" ]
