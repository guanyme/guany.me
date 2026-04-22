# ubuntu

Ubuntu

## Configure Alibaba Cloud Mirror

The commands below assume you are already running in a root shell.

### Back Up Configuration File

Ubuntu 24.04 LTS uses the deb822-style `/etc/apt/sources.list.d/ubuntu.sources` by default. Ubuntu 22.04 LTS and older releases usually still use `/etc/apt/sources.list`.

Ubuntu 24.04 LTS:

```sh
cp -a /etc/apt/sources.list.d/ubuntu.sources /etc/apt/sources.list.d/ubuntu.sources.bak
```

Ubuntu 22.04 LTS and older:

```sh
cp -a /etc/apt/sources.list /etc/apt/sources.list.bak
```

### Alibaba Cloud Public Mirror

Ubuntu 24.04 LTS:

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

Ubuntu 22.04 LTS and older:

```sh
sed -i "s@http://.*archive.ubuntu.com@https://mirrors.aliyun.com@g" /etc/apt/sources.list
sed -i "s@http://.*security.ubuntu.com@https://mirrors.aliyun.com@g" /etc/apt/sources.list
apt update
```

### Alibaba Cloud ECS VPC Mirror

Ubuntu 24.04 LTS:

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

Ubuntu 22.04 LTS and older:

```sh
sed -i "s@http://.*archive.ubuntu.com@http://mirrors.cloud.aliyuncs.com@g" /etc/apt/sources.list
sed -i "s@http://.*security.ubuntu.com@http://mirrors.cloud.aliyuncs.com@g" /etc/apt/sources.list
apt update
```
