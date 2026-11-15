#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
IMAGE="docker.io/fumbles/earth-info-jukebok"
TAG="${1:-latest}"
PLATFORM="${2:-linux/amd64,linux/arm64}"

red()   { printf '\033[0;31m%s\033[0m\n' "$*"; }
green() { printf '\033[0;32m%s\033[0m\n' "$*"; }
step()  { printf '\n\033[1;34m▶ %s\033[0m\n' "$*"; }

step "Pre-flight checks"
command -v docker >/dev/null || { red "Docker is not installed or not in PATH."; exit 1; }
docker info >/dev/null 2>&1 || { red "Docker is not running. Start Docker Desktop and retry."; exit 1; }
docker buildx version >/dev/null 2>&1 || { red "Docker Buildx is required for the multi-platform image."; exit 1; }
test -f "${REPO_DIR}/app/index.html" || { red "app/index.html was not found."; exit 1; }
green "✓ Docker and Buildx are ready"

printf '\nImage:    %s:%s\nPlatform: %s\nContext:  %s\n\n' \
  "${IMAGE}" "${TAG}" "${PLATFORM}" "${REPO_DIR}"
read -r -p "Build and push to Docker Hub? [y/N] " confirm
[[ "${confirm}" =~ ^[Yy]$ ]] || { echo "Aborted."; exit 0; }

step "Building and pushing ${IMAGE}:${TAG}"
docker buildx build \
  --platform "${PLATFORM}" \
  --file "${SCRIPT_DIR}/Dockerfile" \
  --tag "${IMAGE}:${TAG}" \
  --provenance=true \
  --sbom=true \
  --push \
  "${REPO_DIR}"

green "✓ Published ${IMAGE}:${TAG}"
echo "Deploy with: ${SCRIPT_DIR}/deploy.sh ${TAG}"

