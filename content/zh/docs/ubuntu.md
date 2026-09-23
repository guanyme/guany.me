---
description: '把 Ubuntu 的 apt 软件源切换到阿里云公网镜像或 ECS VPC 镜像。'
---

# Ubuntu

Ubuntu 是基于 Debian 的 Linux 发行版。本页介绍把 apt 软件源切换到阿里云镜像。

## 配置 {#configuration}

软件源配置文件的位置取决于版本：

- Ubuntu 24.04 LTS 默认使用 deb822 格式的 `/etc/apt/sources.list.d/ubuntu.sources`。
- Ubuntu 22.04 LTS 及更早版本通常使用 `/etc/apt/sources.list`。

下面的命令在 root shell 下执行。先备份，再选择一个镜像写入。

### 备份软件源配置 {#back-up-the-apt-source-file}

Ubuntu 24.04 LTS：

```sh
cp -a /etc/apt/sources.list.d/ubuntu.sources /etc/apt/sources.list.d/ubuntu.sources.bak
```

Ubuntu 22.04 LTS 及更早版本：

```sh
cp -a /etc/apt/sources.list /etc/apt/sources.list.bak
```

### 使用阿里云公网镜像 {#use-the-alibaba-cloud-public-mirror}

Ubuntu 24.04 LTS 覆盖写入 `ubuntu.sources` 并更新索引：

```sh
cat > /etc/apt/sources.list.d/ubuntu.sources <<'EOF'
Types: deb
URIs: https://mirrors.aliyun.com/ubuntu
Suites: noble noble-updates noble-backports
Components: main restricted universe multiverse
Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg

Types: deb
URIs: https://mirrors.aliyun.com/ubuntu
Suites: noble-security
Components: main restricted universe multiverse
Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg
EOF

apt update
```

Ubuntu 22.04 LTS 及更早版本替换 `sources.list` 中的地址并更新索引：

```sh
sed -i "s@http://.*archive.ubuntu.com@https://mirrors.aliyun.com@g" /etc/apt/sources.list
sed -i "s@http://.*security.ubuntu.com@https://mirrors.aliyun.com@g" /etc/apt/sources.list
apt update
```

### 使用阿里云 ECS VPC 镜像 {#use-the-alibaba-cloud-ecs-vpc-mirror}

在阿里云 ECS 上可以改用 VPC 内网镜像。

Ubuntu 24.04 LTS：

```sh
cat > /etc/apt/sources.list.d/ubuntu.sources <<'EOF'
Types: deb
URIs: http://mirrors.cloud.aliyuncs.com/ubuntu
Suites: noble noble-updates noble-backports
Components: main restricted universe multiverse
Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg

Types: deb
URIs: http://mirrors.cloud.aliyuncs.com/ubuntu
Suites: noble-security
Components: main restricted universe multiverse
Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg
EOF

apt update
```

Ubuntu 22.04 LTS 及更早版本：

```sh
sed -i "s@http://.*archive.ubuntu.com@http://mirrors.cloud.aliyuncs.com@g" /etc/apt/sources.list
sed -i "s@http://.*security.ubuntu.com@http://mirrors.cloud.aliyuncs.com@g" /etc/apt/sources.list
apt update
```
