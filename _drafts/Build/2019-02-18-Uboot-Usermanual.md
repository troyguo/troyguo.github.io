---
layout: post
title:  "Uboot_XKL Usermanual"
date:   2019-02-21 09:30:30 +0800
categories: [Build]
excerpt: Uboot_XKL Usermanual.
tags:
  - Uboot
---

> [GitHub: BiscuitOS](https://github.com/BiscuitOS/BiscuitOS)
>
> Email: BuddyZhang1 <Buddy.zhang@aliyun.com>

# 目录

> - [开发环境搭建](#开发环境搭建)
>
> - [编译 BiscuitOS](#编译 BiscuitOS)
>
> - [编译 Uboot_XKL](#编译 Uboot_XKL)
>
> - [运行 Uboot_XKL](#运行 Uboot_XKL)
>
> - [附录](#附录)

-----------------------------------------------

# <span id="开发环境搭建">开发环境搭建</span>

> - [准备开发主机](#准备开发主机)
>
> - [安装基础开发工具](#安装基础开发工具)
>
> - [获取源码](#获取源码)

#### <span id="准备开发主机">准备开发主机</span>

开发者首先准备一台 Linux 发行版电脑，推荐 Ubuntu 16.04/Ubuntu 18.04, Ubuntu 电
脑的安装可以上网查找相应的教程。准备好相应的开发主机之后，请参照如下文章进行开
发主机细节配置。

> [BiscuitOS 开发环境搭建](https://biscuitos.github.io/blog/PlatformBuild/)

#### <span id="安装基础开发工具">安装基础开发工具</span>

在编译系统之前，需要对开发主机安装必要的开发工具。以 Ubuntu 为例安装基础的开发
工具。开发者可以按如下命令进行安装：

{% highlight bash %}
sudo apt-get install -y qemu gcc make gdb git figlet
sudo apt-get install -y libncurses5-dev iasl
sudo apt-get install -y device-tree-compiler
sudo apt-get install -y flex bison libssl-dev libglib2.0-dev
sudo apt-get install -y libfdt-dev libpixman-1-dev
sudo apt-get install -y u-boot-tools libtool
{% endhighlight %}

如果开发主机是 64 位系统，请继续安装如下开发工具：

{% highlight bash %}
sudo apt-get install lib32z1 lib32z1-dev
{% endhighlight %}

第一次安装 git 工具需要对 git 进行配置，配置包括用户名和 Email，请参照如下命令
进行配置

{% highlight bash %}
git config --global user.name "Your Name"
git config --global user.email "Your Email"
{% endhighlight %}

#### <span id="获取源码">获取源码</span>

基础环境搭建完毕之后，开发者从 GitHub 上获取项目源码，使用如下命令：

{% highlight bash %}
git clone https://github.com/BiscuitOS/BiscuitOS.git
cd BiscuitOS
{% endhighlight %}

BiscuitOS 项目是一个用于制作精简 Linux 发行版，开发者可以使用这个项目获得各种
版本的 Linux 内核，包括最古老的 Linux 0.11, Linux 0.97, Linux 1.0.1 等等，也可
以获得最新的 Linux 4.20, Linux 5.0 等等。只需要执行简单的命令，就能构建一个可
运行可调式的 Linux 开发环境。

------------------------------------------------------

#### <span id="编译 BiscuitOS">编译 BiscuitOS</span>

获得 BiscuitOS 项目之后，可以使用 BiscuitOS 构建 Uboot_XKL 的开发环境。开发者
只需执行如下命令就可以获得 Uboot_XKL 完整的 BiscuitOS，如下：

{% highlight bash %}
cd BiscuitOS
make UBOOT_JJKK_defconfig
make
{% endhighlight %}

执行 make 命令的过程中，BiscuitOS 会从网上获得系统运行所需的工具，包括
binutils, GNU-GCC, linaro-GCC,Busybox 和 Qemu 等工具，以此构建一个完整的
Rootfs。编译过程中需要输入 root 密码，请自行输入，但请不要以 root 用户执行
make 命令。编译完成之后，在命令行终端会输出多条信息，其中包括 Linux 源码的位
置，BiscuitOS 的位置，以及 README 位置。如下：

{% highlight perl %}
 ____  _                _ _    ___  ____
| __ )(_)___  ___ _   _(_) |_ / _ \/ ___|
|  _ \| / __|/ __| | | | | __| | | \___ \
| |_) | \__ \ (__| |_| | | |_| |_| |___) |
|____/|_|___/\___|\__,_|_|\__|\___/|____/

***********************************************
Output:
 BiscuitOS/output/linux-5.0-arm32

linux:
 BiscuitOS/output/linux-5.0-arm32/linux/linux

README:
 BiscuitOS/output/linux-5.0-arm32/README.md

***********************************************
{% endhighlight %}

开发者首先查看 README 中的内容，README 中介绍了 Uboot 等编译方法，按照 README 
中的提示命令进行编译。例如 README 内容如下：

{% highlight bash %}
# Build Uboot

```
cd BiscuitOS/output/linux-5.0-arm32/u-boot/u-boot/
make ARCH=arm clean
make ARCH=arm vexpress_ca9x4_defconfig
make ARCH=arm CROSS_COMPILE=BiscuitOS/output/linux-5.0-arm32/arm-linux-gnueabi/arm-linux-gnueabi/bin/arm-linux-gnueabi- -j8
```

# Build Linux Kernel

```
cd BiscuitOS/output/linux-5.0-arm32/linux/linux
make ARCH=arm clean
make ARCH=arm vexpress_defconfig

make ARCH=arm menuconfig
  General setup --->
    ---> [*]Initial RAM filesystem and RAM disk (initramfs/initrd) support

  Device Driver --->
    [*] Block devices --->
        <*> RAM block device support
        (153600) Default RAM disk size

make ARCH=arm CROSS_COMPILE=BiscuitOS/output/linux-5.0-arm32/arm-linux-gnueabi/arm-linux-gnueabi/bin/arm-linux-gnueabi- -j8
make ARCH=arm CROSS_COMPILE=BiscuitOS/output/linux-5.0-arm32/arm-linux-gnueabi/arm-linux-gnueabi/bin/arm-linux-gnueabi- dtbs
```

# Build Busybox

```
cd BiscuitOS/output/linux-5.0-arm32/busybox/busybox
make clean
make menuconfig
  Busybox Settings --->
    Build Options --->
      [*] Build BusyBox as a static binary (no shared libs)

make CROSS_COMPILE=BiscuitOS/output/linux-5.0-arm32/arm-linux-gnueabi/arm-linux-gnueabi/bin/arm-linux-gnueabi- -j8

make CROSS_COMPILE=BiscuitOS/output/linux-5.0-arm32/arm-linux-gnueabi/arm-linux-gnueabi/bin/arm-linux-gnueabi- install
```


# Re-Build Rootfs

```
cd BiscuitOS/output/linux-5.0-arm32
./RunQemuKernel.sh pack
```


# Running Linux on Qemu

```
cd BiscuitOS/output/linux-5.0-arm32
./RunQemuKernel.sh start
```

# Debugging Linux Kernel

### First Terminal

```
cd BiscuitOS/output/linux-5.0-arm32
./RunQemuKernel.sh debug
```

### Second Terminal

```
BiscuitOS/output/linux-5.0-arm32/arm-linux-gnueabi/arm-linux-gnueabi/bin/arm-linux-gnueabi-gdb BiscuitOS/output/linux-5.0-arm32/linux/linux/vmlinux

(gdb) target remote :1234
(gdb) b start_kernel
(gdb) c
(gdb) info reg
```
{% endhighlight %}

#### <span id="编译 Uboot_XKL">编译 Uboot_XKL</span>

编译 Uboot 很简单，根据 README 里提供的命令进行编译，具体命
令如下：

{% highlight bash %}
cd BiscuitOS/output/linux-5.0-arm32/u-boot/u-boot/
make ARCH=arm clean
make ARCH=arm vexpress_ca9x4_defconfig
make ARCH=arm CROSS_COMPILE=BiscuitOS/output/linux-5.0-arm32/arm-linux-gnueabi/arm-linux-gnueabi/bin/arm-linux-gnueabi- -j8
{% endhighlight %}

#### <span id="运行 Uboot_XKL">运行 Uboot_XKL</span>

完成上面的步骤之后，开发者就可以运行 Uboot_XKL，使用如下命令即可：

{% highlight bash %}
cd BiscuitOS/output/linux-5.0-arm32
./RunQemuKernel.sh uboot
{% endhighlight %}

![LINUXP](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/UBOOT000100.png)

至此，一个 Uboot_XKL 已经运行，开发者可以根据自己兴趣和需求对源码进行魔改。

-----------------------------------------------

# <span id="附录">附录</span>

> [BiscuitOS Home](https://biscuitos.github.io/)
>
> [BiscuitOS Driver](https://biscuitos.github.io/blog/BiscuitOS_Catalogue/)
>
> [BiscuitOS Kernel Build](https://biscuitos.github.io/blog/Kernel_Build/)
>
> [Linux Kernel](https://www.kernel.org/)
>
> [Bootlin: Elixir Cross Referencer](https://elixir.bootlin.com/linux/latest/source)

## 赞赏一下吧 🙂

![MMU](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/HAB000036.jpg)
