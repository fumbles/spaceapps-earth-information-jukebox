#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IMAGE="docker.io/fumbles/earth-info-jukebok"
TAG="${1:-latest}"

command -v oc >/dev/null || { echo "oc is not installed or not in PATH." >&2; exit 1; }
oc whoami >/dev/null

PROJECT="$(oc project -q)"
echo "Deploying ${IMAGE}:${TAG} to OpenShift project ${PROJECT}"
oc apply -f "${SCRIPT_DIR}/openshift.yaml"
oc set image deployment/earth-info-jukebox \
  "earth-info-jukebox=${IMAGE}:${TAG}"
oc rollout restart deployment/earth-info-jukebox
oc rollout status deployment/earth-info-jukebox --timeout=180s

HOST="$(oc get route earth-info-jukebox -o jsonpath='{.spec.host}')"
echo "Ready: https://${HOST}"

