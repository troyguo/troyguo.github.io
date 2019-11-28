---
layout:             post
title:              "FlameGraph"
date:               2019-04-02 14:16:30 +0800
categories:         [MMU]
excerpt:            FlameGraph 火焰图.
tags:
  - MMU
---

> [GitHub FlameGraph](https://github.com/brendangregg/FlameGraph)
>
> Email: BuddyZhang1 <buddy.zhang@aliyun.com>

# 目录

> - [工具原理](#工具原理)
>
> - [工具安装](#工具安装)
>
> - [工具使用](#工具使用)
>
> - [附录](#附录)

--------------------------------------------------------------
<span id="工具原理"></span>

![MMU](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/IND00000P.jpg)

# 工具介绍

火焰图是基于 perf 结果产生的 SVG 图片，用来展示 CPU 的调用栈。

y 轴表示调用栈，每一层都是一个函数。调用栈越深，火焰就越高，顶部就是正在执行
的函数，下方都是它的父函数。x 轴表示抽样数，如果一个函数在 x 轴占据的宽度越宽，
就表示它被抽到的次数多，即执行的时间长。注意，x 轴不代表时间，而是所有的调用栈
合并后，按字母顺序排列的

-------------------------------------------------------------
<span id="工具安装"></span>

![MMU](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/IND00000A.jpg)

本教程安装基于 BiscuitOS 制作的 Linux 5.0 系统，其他平台参照安装。如需要安装基于 BiscuitOS
的 Linux 5.0 开发环境，请参考下面文章：

> [Linux 5.0 arm32 开发环境搭建教程](https://biscuitos.github.io/blog/Linux-5.0-arm32-Usermanual/)

##### 获取源码

开发者可以从 GitHub 上直接获得 FlameGraph 的源码，使用如下命令：

{% highlight bash %}
git clone https://github.com/brendangregg/FlameGraph.git
{% endhighlight %}

##### 工具安装

由于 FlameGraph 要搭配 perf 一同使用，所以未安装 perf 的开发者可以参考下文进行安装：

> [BiscuitOS 基于 Linux 5.0 Perf 性能工具安装教程](https://biscuitos.github.io/blog/TOOLS-perf/)

获得 FlameGraph 之后就可以直接使用，无需进行安装。

##### 运行工具

当使用 pref 获得指定的 record 数据之后，使用 FlameGraph 进行火焰图制作，
制作出的火焰图如下：

![LINUXP](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/TOOLS000000.png)

-------------------------------------------------------------
<span id="工具使用"></span>

![MMU](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/IND00000L.jpg)

# perf 使用方法

下面通过一个简单实例介绍如何使用 perf 和 FlameGraph 制作火焰图工具。

##### 搭建开发环境

本实例基于 BiscuitOS Linux 5.0 内核，并需要提前安装好 perf 工具，如果未
安装，请参考如下文档进行搭建：

> [Linux 5.0 arm32 开发环境搭建教程](https://biscuitos.github.io/blog/Linux-5.0-arm32-Usermanual/)
>
> [BiscuitOS 基于 Linux 5.0 Perf 性能工具安装教程](https://biscuitos.github.io/blog/TOOLS-perf/)
>
> [FlameGraph 安装教程](#工具安装)

##### 准备测试程序

编写一个简单的测试程序，如下：

{% highlight c %}
#include <stdio.h>
#include <stdlib.h>

int main()
{

  printk("Hello World!\n");
  return 0;
}
{% endhighlight %}

##### 编译，安装并运行测试程序

BiscuitOS Linux 5.0 内核上编译，安装并运行测试程序，具体步骤请参考教程：

> [Biscuit Linux 5.0 应用程序开发教程]()

##### perf 测试

成功运行测试程序之后，使用 perf 工具对测试程序进行性能分析，使用如下命令：

{% highlight c %}
#include <stdio.h>
#include <stdlib.h>

int main()
{

  printk("Hello World!\n");
  return 0;
}
{% endhighlight %}


-----------------------------------------------

# <span id="附录">附录</span>

> [The GNU Assembler](http://tigcc.ticalc.org/doc/gnuasm.html)
>
> [Debugging on ARM Boot Stage](https://biscuitos.github.io/blog/BOOTASM-debuggingTools/#header)
>
> [BiscuitOS Home](https://biscuitos.github.io/)
>
> [BiscuitOS Driver](https://biscuitos.github.io/blog/BiscuitOS_Catalogue/)
>
> [BiscuitOS Kernel Build](https://biscuitos.github.io/blog/Kernel_Build/)
>
> [Linux Kernel](https://www.kernel.org/)
>
> [Bootlin: Elixir Cross Referencer](https://elixir.bootlin.com/linux/latest/source)
>
> [搭建高效的 Linux 开发环境](https://biscuitos.github.io/blog/Linux-debug-tools/)

## 赞赏一下吧 🙂

![MMU](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/HAB000036.jpg)
