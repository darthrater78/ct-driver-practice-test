# syntax=docker/dockerfile:1

# ---- build stage: validate the key + assemble the single-file HTML ----
# Discarded after build, so it adds nothing to the final image size.
FROM node:20-alpine AS build
WORKDIR /src
COPY quiz-engine.js questions.js app.js styles.css index.template.html build.js test-randomization.js ./
RUN node test-randomization.js && node build.js

# ---- runtime: tiny static web server ----
FROM nginx:1-alpine
# The assembled app becomes the site index; nginx's default mime.types serves
# the PDF as application/pdf so it opens inline (and #page= jumps work).
COPY --from=build /src/CT-Driver-Practice-Test.html /usr/share/nginx/html/index.html
COPY ["Drivers Manual English.pdf", "/usr/share/nginx/html/"]
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost/ >/dev/null 2>&1 || exit 1
