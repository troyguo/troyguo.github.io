---
layout: post
title:  "多版本 Busybox 支持"
date:   2019-03-08 14:31:30 +0800
categories: [Build]
excerpt: 多版本 Busybox 支持.
tags:
  - Linux
---

> Email: BuddyZhang1 <buddy.zhang@aliyun.com>

---------------------------------------------------

BiscuitOS 为每个 Linux 版本指定了一个默认版本的 Busybox，但由于开发者实际
需求，需要使用不同版本的 Busybox。以及使用默认的方式获得 Busybox 源码，这给
开发者带来了一定的限制，于是本文介绍如何采用不同的 Busybox 版本以及使用不同
的方法获得 Busybox 源码.

#### 采用不同版本的 Busybox

本文以 Linux 5.0 为例子进行讲解，更多 Linux 5.0 构建方法请参考文章：

> [Linux 5.0 arm32 开发环境搭建]()

如果第一次构建开发环境，可以参考如下命令：

{% highlight bash %}
cd BiscuitOS
make linux-5.0-arm32_defconfig
make menuconfig
{% endhighlight %}

进入图形化配置模式，如下：

![LINUXP](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/BUDX000330.png)

选择 Package --->

![LINUXP](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/BUDX000331.png)

选择 busybox --->

![LINUXP](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/BUDX000332.png)

选择 busybox version，输入需要的 Busybox 版本。Busybox 所支持的版本可
以查看下面链接：

[Busybox Release Linux web: https://busybox.net/downloads/](https://busybox.net/downloads/)

如果之前已经构建好一个完整的 Linux 5.0 之后需要使用不同的 Busybox 班额本，
开发者首先删除 Busybox 源码，参照如下命令：

{% highlight bash %}
cd BiscuitOS/output/linux-5.0-arm32/
rm -rf busybox
{% endhighlight %}

删除完之后再重新执行上面的配置操作。
