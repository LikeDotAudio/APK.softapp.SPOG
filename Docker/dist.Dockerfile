# Docker/dist.Dockerfile — SPOG's served tree as an image stage (2026-10-30 audit).
#
# Build context: the WEB.SPOG repo root. The build itself is `npm run build:image`
# (SETUP/build-image.mjs — typecheck, tests, size gate, vite build, index.htm,
# Routes/), so this file never names SPOG's source files and a rename inside SPOG
# cannot break a consumer. The LAST stage, `dist`, is the whole served tree at /:
#   index.htm  index.next.html  twist-mqtt-tree.html  assets/  Routes/ (with index.json)
#   build-id.json  sw.js  spog-config.js  manifest.json  favicon.svg
# Consumers take it with `COPY --from=<this stage> / <mount>` (WEB.Frontend-Assets
# serves it at /APK:SPOG) or `docker build -f Docker/dist.Dockerfile --output type=local,dest=DIR .`.
# spog-config.js is the checked-in default (same-origin /mqtt, no bus key); a host
# that wants another broker/key overwrites that one file.
FROM node:22-alpine AS build
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build:image

FROM scratch AS dist
COPY --from=build /src/dist/ /
