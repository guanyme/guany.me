---
description: '在 Ubuntu 上安装 Docker Engine，并为拉取镜像、容器和构建配置代理。'
---

# Docker

Docker 是容器运行平台。本页介绍在 Ubuntu 上从 apt 存储库安装 Docker Engine，以及为 Docker 配置代理。

## 安装 {#installation}

先添加一个 Docker 的 apt 存储库，再安装 Docker 包。下面的命令在 root shell 下执行。

### 添加官方 apt 存储库 {#add-the-official-apt-repository}

添加 Docker 官方 GPG 密钥和存储库：

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

### 添加阿里云公网镜像存储库 {#add-the-alibaba-cloud-public-mirror-repository}

使用阿里云公网镜像时，改用以下命令：

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

### 添加阿里云 ECS VPC 镜像存储库 {#add-the-alibaba-cloud-ecs-vpc-mirror-repository}

在阿里云 ECS 上，可以改用 VPC 内网镜像：

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

### 安装 Docker 包 {#install-docker-packages}

添加存储库后，安装 Docker Engine 及插件：

```sh
apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

## 配置 {#configuration}

`docker pull`、`docker push` 等请求由 Docker Engine（`dockerd`）发起，需要给 `dockerd` 配置代理。以下方式任选其一，适用于使用 `systemd` 的 Linux 上的 Docker Engine。Docker Desktop 不使用这里的 `daemon.json` 代理设置。

`NO_PROXY` 建议包含内网域名、私有镜像仓库地址、`localhost` 和 `127.0.0.1`。

### 在 daemon.json 中配置拉取代理 {#configure-a-pull-proxy-in-daemonjson}

Docker Engine 23.0+ 支持在 `daemon.json` 中配置代理。`daemon.json` 中的代理配置优先级高于环境变量配置。

1. 在 `/etc/docker/daemon.json` 里写入：

   ```json
   {
     "proxies": {
       "http-proxy": "http://127.0.0.1:7890",
       "https-proxy": "http://127.0.0.1:7890",
       "no-proxy": "localhost,127.0.0.1,.local,.corp"
     }
   }
   ```

2. 重启 Docker：

   ```sh
   systemctl restart docker
   ```

### 用 systemd 环境变量配置拉取代理 {#configure-a-pull-proxy-with-systemd}

给 `docker.service` 添加代理环境变量。代理地址含 `#?!()[]{}` 等特殊字符时，按 Docker 官方文档转义。

1. 在 root shell 下写入配置并重启 Docker：

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

2. 确认环境变量已加载：

   ```sh
   systemctl show --property=Environment docker
   ```

### 为 rootless Docker 配置拉取代理 {#configure-a-pull-proxy-for-rootless-docker}

rootless Docker 的 `systemd` 配置放在当前用户目录下。以当前用户执行：

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

## 使用 {#usage}

`dockerd` 的代理只作用于守护进程自己的请求。容器内访问外网、`docker build` 下载依赖，需要在命令里另行传入代理。

### 为容器设置代理 {#run-a-container-with-a-proxy}

用 `-e` 传入代理环境变量：

```sh
docker run --rm \
  -e HTTP_PROXY=http://127.0.0.1:7890 \
  -e HTTPS_PROXY=http://127.0.0.1:7890 \
  -e NO_PROXY=localhost,127.0.0.1,.local,.corp \
  alpine env | grep -i _PROXY
```

### 为构建设置代理 {#build-an-image-with-a-proxy}

用 `--build-arg` 传入代理，不要把代理写进 Dockerfile 的 `ENV`：

```sh
docker build \
  --build-arg HTTP_PROXY=http://127.0.0.1:7890 \
  --build-arg HTTPS_PROXY=http://127.0.0.1:7890 \
  --build-arg NO_PROXY=localhost,127.0.0.1,.local,.corp \
  .
```

代理地址可能含认证信息，不要提交到仓库。

## 参考 {#references}

- [阿里云容器镜像服务控制台](https://cr.console.aliyun.com/)：获取并配置阿里云镜像加速器。
