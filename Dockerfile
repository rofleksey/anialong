FROM node:16-alpine AS buildUi
COPY frontend/ frontend/
RUN cd frontend && npm i --production && npm run build && cd ..
FROM node:16-alpine
WORKDIR /opt
RUN mkdir uploads
RUN apk add --no-cache ffmpeg
COPY index.js .
COPY package*.json ./
RUN npm i --production
COPY --from=buildUi frontend/build/ frontend/build
EXPOSE 8080
CMD [ "node", "index.js" ]