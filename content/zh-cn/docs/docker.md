# docker

Docker

## 设置 Docker 的 apt 存储库 {#setup-docker-apt-repository}

### 官方 {#official}

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

### 阿里云公网镜像 {#aliyun-public-mirror}

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

### 阿里云 ECS VPC 镜像 {#aliyun-ecs-vpc-mirror}

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

## 安装 Docker 包 {#install-docker-packages}

```sh
apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

## 配置 Docker Engine 的拉取代理 {#configure-docker-engine-pull-proxy}

如果 `docker pull` 需要走代理，优先配置 Docker Engine（`dockerd`）本身的代理。对于使用 `systemd` 的 Linux，一般有两种方式。下面这些宿主机级别的命令默认在 root shell 下执行。

### 方式一：`daemon.json` {#daemon-json}

Docker Engine 23.0+ 可以直接在 `/etc/docker/daemon.json` 中配置代理：

```json
{
  "proxies": {
    "http-proxy": "http://127.0.0.1:7890",
    "https-proxy": "http://127.0.0.1:7890",
    "no-proxy": "localhost,127.0.0.1,.local,.corp"
  }
}
```

保存后重启 Docker：

```sh
systemctl restart docker
```

### 方式二：`systemd` 服务环境变量 {#systemd-service-proxy}

如果更习惯按服务配置，也可以给 `docker.service` 添加代理环境变量：

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

查看是否生效：

```sh
systemctl show --property=Environment docker
```

### Rootless Docker {#rootless-docker-proxy}

如果是 rootless Docker，`systemd` 配置目录改为当前用户目录，并且使用当前用户执行：

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

说明：

- `daemon.json` 中的代理配置优先级高于环境变量配置。
- `NO_PROXY` 建议加入内网域名、私有镜像仓库地址、`localhost` 和 `127.0.0.1`。
- 如果代理地址里包含 `#?!()[]{}` 等特殊字符，写入 `systemd` 环境变量时需要按 Docker 官方说明做转义。
- 上述配置适用于 Docker Engine；Docker Desktop 不使用这里的 `daemon.json` 代理设置。

## 配置容器和构建的代理 {#configure-container-and-build-proxy}

仅配置 `dockerd` 只能解决 `docker pull`、`docker push` 之类由守护进程发起的请求。若容器内访问外网或 `docker build` 拉依赖也要走代理，还需要额外配置客户端侧代理。

### 临时为容器设置代理 {#temporary-container-proxy}

```sh
docker run --rm \
  -e HTTP_PROXY=http://127.0.0.1:7890 \
  -e HTTPS_PROXY=http://127.0.0.1:7890 \
  -e NO_PROXY=localhost,127.0.0.1,.local,.corp \
  alpine env | grep -i _PROXY
```

### 临时为构建设置代理 {#temporary-build-proxy}

```sh
docker build \
  --build-arg HTTP_PROXY=http://127.0.0.1:7890 \
  --build-arg HTTPS_PROXY=http://127.0.0.1:7890 \
  --build-arg NO_PROXY=localhost,127.0.0.1,.local,.corp \
 .
```

说明：

- 构建阶段优先使用 `--build-arg`，不要把代理直接写进 Dockerfile 的 `ENV`。
- 代理信息可能包含敏感内容，不建议把带认证信息的代理地址提交到仓库。

## 配置阿里云镜像加速器 {#configure-aliyun-mirror-accelerator}

[容器镜像服务控制台](https://cr.console.aliyun.com/)
