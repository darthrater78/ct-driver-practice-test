# syntax=docker/dockerfile:1

# ---- build stage: validate the key + auth, then assemble the single-file HTML ----
# Discarded after build. The tests gate the image: a bad answer key, a broken
# shuffle, or broken auth fails the build.
FROM node:20-alpine AS build
WORKDIR /src
COPY quiz-engine.js questions.js app.js styles.css index.template.html \
     build.js test-randomization.js server.js test-server.js ./
RUN node test-randomization.js && node test-server.js && node build.js

# ---- runtime: tiny zero-dependency Node server (static + accounts API) ----
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=8080 DATA_DIR=/data
COPY server.js ./
COPY --from=build /src/CT-Driver-Practice-Test.html ./public/index.html
COPY ["Drivers Manual English.pdf", "./public/"]
# Run as the built-in non-root user (uid 1000). The bind-mounted /data must be
# writable by uid 1000 (the server prints a chown hint and exits if it isn't).
USER node
EXPOSE 8080
# Accounts + score history persist here — bind-mount a host directory to /data.
VOLUME ["/data"]
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:8080/ >/dev/null 2>&1 || exit 1
CMD ["node", "server.js"]
