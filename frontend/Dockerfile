# build stage
FROM node:18-alpine AS build
WORKDIR /ui
COPY frontend/package*.json ./
RUN npm ci
COPY frontend .
RUN npm run build            # builds to /ui/dist

# run stage
FROM nginx:alpine
COPY --from=build /ui/dist /usr/share/nginx/html
# forward API calls to backend container when running docker-compose
