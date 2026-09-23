---
description: 'Install Docker Engine on Ubuntu and configure proxies for pulls, containers, and builds.'
---

# Docker

Docker is a container platform. This page covers installing Docker Engine on Ubuntu from an apt repository and configuring Docker to use a proxy.

## Installation

Add one Docker apt repository, then install the Docker packages. Run the commands below in a root shell.

### Add the official apt repository

Add Docker's official GPG key and repository:

```sh
# Add Docker's official GPG key:
apt update
apt install ca-certificates curl
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
tee /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Signed-By: /etc/apt/keyrings/docker.asc
EOF
apt update
```

### Add the Alibaba Cloud public mirror repository

To use the Alibaba Cloud public mirror, run these commands instead:

```sh
# Add Docker's official GPG key:
apt update
apt install ca-certificates curl
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://mirrors.aliyun.com/docker-ce/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
tee /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://mirrors.aliyun.com/docker-ce/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Signed-By: /etc/apt/keyrings/docker.asc
EOF
apt update
```

### Add the Alibaba Cloud ECS VPC mirror repository

On Alibaba Cloud ECS, you can use the VPC internal mirror instead:

```sh
# Add Docker's official GPG key:
apt update
apt install ca-certificates curl
install -m 0755 -d /etc/apt/keyrings
curl -fsSL http://mirrors.cloud.aliyuncs.com/docker-ce/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
tee /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: http://mirrors.cloud.aliyuncs.com/docker-ce/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Signed-By: /etc/apt/keyrings/docker.asc
EOF
apt update
```

### Install Docker packages

After adding a repository, install Docker Engine and its plugins:

```sh
apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

## Configuration

Requests such as `docker pull` and `docker push` are made by Docker Engine (`dockerd`), so configure the proxy on `dockerd`. Use any one of the methods below. They apply to Docker Engine on Linux with `systemd`. Docker Desktop does not use the `daemon.json` proxy settings described here.

Include internal domains, private registries, `localhost`, and `127.0.0.1` in `NO_PROXY`.

### Configure a pull proxy in daemon.json

Docker Engine 23.0+ supports proxy settings in `daemon.json`. Proxy settings in `daemon.json` take precedence over environment variables.

1. Add the following to `/etc/docker/daemon.json`:

   ```json
   {
     "proxies": {
       "http-proxy": "http://127.0.0.1:7890",
       "https-proxy": "http://127.0.0.1:7890",
       "no-proxy": "localhost,127.0.0.1,.local,.corp"
     }
   }
   ```

2. Restart Docker:

   ```sh
   systemctl restart docker
   ```

### Configure a pull proxy with systemd

Add proxy environment variables to `docker.service`. If the proxy URL contains special characters such as `#?!()[]{}`, escape them as described in the Docker docs.

1. In a root shell, write the configuration and restart Docker:

   ```sh
   mkdir -p /etc/systemd/system/docker.service.d
   tee /etc/systemd/system/docker.service.d/http-proxy.conf <<'EOF'
   [Service]
   Environment="HTTP_PROXY=http://127.0.0.1:7890"
   Environment="HTTPS_PROXY=http://127.0.0.1:7890"
   Environment="NO_PROXY=localhost,127.0.0.1,.local,.corp"
   EOF
   systemctl daemon-reload
   systemctl restart docker
   ```

2. Verify that the variables were loaded:

   ```sh
   systemctl show --property=Environment docker
   ```

### Configure a pull proxy for rootless Docker

For rootless Docker, the `systemd` configuration lives in the current user's directory. Run as that user:

```sh
mkdir -p ~/.config/systemd/user/docker.service.d
tee ~/.config/systemd/user/docker.service.d/http-proxy.conf <<'EOF'
[Service]
Environment="HTTP_PROXY=http://127.0.0.1:7890"
Environment="HTTPS_PROXY=http://127.0.0.1:7890"
Environment="NO_PROXY=localhost,127.0.0.1,.local,.corp"
EOF
systemctl --user daemon-reload
systemctl --user restart docker
```

## Usage

The `dockerd` proxy only covers requests made by the daemon itself. For network access inside containers, or for dependencies downloaded during `docker build`, pass the proxy on the command line.

### Run a container with a proxy

Pass the proxy variables with `-e`:

```sh
docker run --rm \
  -e HTTP_PROXY=http://127.0.0.1:7890 \
  -e HTTPS_PROXY=http://127.0.0.1:7890 \
  -e NO_PROXY=localhost,127.0.0.1,.local,.corp \
  alpine env | grep -i _PROXY
```

### Build an image with a proxy

Pass the proxy with `--build-arg`. Do not put proxy settings in `ENV` instructions in the Dockerfile:

```sh
docker build \
  --build-arg HTTP_PROXY=http://127.0.0.1:7890 \
  --build-arg HTTPS_PROXY=http://127.0.0.1:7890 \
  --build-arg NO_PROXY=localhost,127.0.0.1,.local,.corp \
  .
```

Proxy URLs may contain credentials. Do not commit them to a repository.

## References

- [Alibaba Cloud Container Registry console](https://cr.console.aliyun.com/): get and configure an Alibaba Cloud registry mirror accelerator.
