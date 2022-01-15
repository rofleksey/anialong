FROM node:16-alpine
WORKDIR /opt
RUN mkdir uploads
RUN apk add --no-cache ffmpeg
COPY index.js .
COPY package*.json ./
COPY frontend/build ./frontend/build
RUN npm i --production
EXPOSE 8080
CMD [ "node", "index.js" ]