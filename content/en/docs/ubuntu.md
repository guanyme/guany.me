---
description: 'Switch Ubuntu apt sources to the Alibaba Cloud public or ECS VPC mirror.'
---

# Ubuntu

Ubuntu is a Debian-based Linux distribution. This page covers switching apt sources to an Alibaba Cloud mirror.

## Configuration

The location of the apt source file depends on the release:

- Ubuntu 24.04 LTS uses the deb822-style `/etc/apt/sources.list.d/ubuntu.sources` by default.
- Ubuntu 22.04 LTS and older usually use `/etc/apt/sources.list`.

Run the commands below in a root shell. Back up the file first, then pick one mirror.

### Back up the apt source file

Ubuntu 24.04 LTS:

```sh
cp -a /etc/apt/sources.list.d/ubuntu.sources /etc/apt/sources.list.d/ubuntu.sources.bak
```

Ubuntu 22.04 LTS and older:

```sh
cp -a /etc/apt/sources.list /etc/apt/sources.list.bak
```

### Use the Alibaba Cloud public mirror

On Ubuntu 24.04 LTS, overwrite `ubuntu.sources` and update the index:

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

On Ubuntu 22.04 LTS and older, replace the URLs in `sources.list` and update the index:

```sh
sed -i "s@http://.*archive.ubuntu.com@https://mirrors.aliyun.com@g" /etc/apt/sources.list
sed -i "s@http://.*security.ubuntu.com@https://mirrors.aliyun.com@g" /etc/apt/sources.list
apt update
```

### Use the Alibaba Cloud ECS VPC mirror

On Alibaba Cloud ECS, you can use the VPC internal mirror instead.

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
