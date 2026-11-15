# Deployment

The image is a non-root Nginx container compatible with the default OpenShift
restricted security context. It serves the static `app/` directory on port 8080.

## Build and publish

```bash
./deployment/build.sh latest
```

The script builds `linux/amd64` and `linux/arm64`, then pushes
`docker.io/fumbles/earth-info-jukebok:latest` to Docker Hub.

## Deploy

Use the OpenShift project selected by `oc project`:

```bash
./deployment/deploy.sh latest
```

The script applies the Deployment, Service, and TLS Route, waits for the rollout,
and prints the public URL.

