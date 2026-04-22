# docker

Docker

## Set Up Docker's apt Repository

### Official

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

### Alibaba Cloud Public Mirror

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

### Alibaba Cloud ECS VPC Mirror

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

## Install Docker Packages

```sh
apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

## Configure a Pull Proxy for Docker Engine

If `docker pull` needs to go through a proxy, configure the Docker Engine daemon (`dockerd`) first. On Linux systems that use `systemd`, there are generally two common approaches. The host-level commands below assume you are already running in a root shell.

### Option 1: `daemon.json`

Docker Engine 23.0+ supports proxy configuration directly in `/etc/docker/daemon.json`:

```json
{
  "proxies": {
    "http-proxy": "http://127.0.0.1:7890",
    "https-proxy": "http://127.0.0.1:7890",
    "no-proxy": "localhost,127.0.0.1,.local,.corp"
  }
}
```

Restart Docker after saving the file:

```sh
systemctl restart docker
```

### Option 2: `systemd` Service Environment Variables

If you prefer service-level configuration, add proxy environment variables to `docker.service`:

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

Verify that the variables were loaded:

```sh
systemctl show --property=Environment docker
```

### Rootless Docker

If you use rootless Docker, the `systemd` path moves to the current user's directory and the commands should be run as that user:

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

Notes:

- Proxy settings in `daemon.json` take precedence over environment variable configuration.
- `NO_PROXY` should usually include internal domains, private registries, `localhost`, and `127.0.0.1`.
- If the proxy URL contains special characters such as `#?!()[]{}`, escape them as described in the Docker docs when using `systemd` environment variables.
- These settings apply to Docker Engine. Docker Desktop does not use the `daemon.json` proxy configuration described here.

## Configure Proxy for Containers and Builds

Configuring `dockerd` only covers requests made by the daemon itself, such as `docker pull` and `docker push`. If processes inside containers need proxy access, or if `docker build` needs proxy access to download dependencies, configure client-side proxy settings as well.

### Set Proxy for a Single Container

```sh
docker run --rm \
  -e HTTP_PROXY=http://127.0.0.1:7890 \
  -e HTTPS_PROXY=http://127.0.0.1:7890 \
  -e NO_PROXY=localhost,127.0.0.1,.local,.corp \
  alpine env | grep -i _PROXY
```

### Set Proxy for a Single Build

```sh
docker build \
  --build-arg HTTP_PROXY=http://127.0.0.1:7890 \
  --build-arg HTTPS_PROXY=http://127.0.0.1:7890 \
  --build-arg NO_PROXY=localhost,127.0.0.1,.local,.corp \
  .
```

Notes:

- For builds, prefer `--build-arg` instead of baking proxy settings into `ENV` instructions in the Dockerfile.
- Proxy URLs may contain sensitive information. Avoid committing authenticated proxy addresses to the repository.

## Configure Alibaba Cloud Mirror Accelerator

[Container Registry Console](https://cr.console.aliyun.com/)
