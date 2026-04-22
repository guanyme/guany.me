# ubuntu

Ubuntu

## 配置阿里云镜像 {#configure-aliyun-mirror}

以下命令默认在 root shell 下执行。

### 备份配置文件 {#backup-config-file}

Ubuntu 24.04 LTS 默认使用 deb822 格式的 `/etc/apt/sources.list.d/ubuntu.sources`；Ubuntu 22.04 LTS 及更早版本通常仍使用 `/etc/apt/sources.list`。

Ubuntu 24.04 LTS：

```sh
cp -a /etc/apt/sources.list.d/ubuntu.sources /etc/apt/sources.list.d/ubuntu.sources.bak
```

Ubuntu 22.04 LTS 及更早版本：

```sh
cp -a /etc/apt/sources.list /etc/apt/sources.list.bak
```

### 阿里云公网镜像 {#aliyun-public-mirror}

Ubuntu 24.04 LTS：

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

Ubuntu 22.04 LTS 及更早版本：

```sh
sed -i "s@http://.*archive.ubuntu.com@https://mirrors.aliyun.com@g" /etc/apt/sources.list
sed -i "s@http://.*security.ubuntu.com@https://mirrors.aliyun.com@g" /etc/apt/sources.list
apt update
```

### 阿里云 ECS VPC 镜像 {#aliyun-ecs-vpc-mirror}

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
