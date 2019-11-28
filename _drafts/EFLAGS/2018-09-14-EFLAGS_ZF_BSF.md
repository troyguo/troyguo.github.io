---
layout: post
title:  "BSF 位查找引起的 ZF 置位"
date:   2018-09-14 17:35:30 +0800
categories: [MMU]
excerpt: BSF 位查找引起的 ZF 置位.
tags:
  - EFLAGS
  - ZF
---

## 原理

Intel X86 提供了 BSF 指令，该指令用于由于查找从右到左第一个置位的位置，如果
找到，则将位置存储到目的寄存器，并且 ZF 清零；反之没有找到置位的位置，则 ZF 
置位。

## 实践

BiscuitOS 提供了 BSF 相关的实例代码，开发者可以使用如下命令：

首先，开发者先准备 BiscuitOS 系统，内核版本 linux 1.0.1.2。开发可以参照文档
构建 BiscuitOS 调试环境：

{% highlight ruby %}
https://biscuitos.github.io/blog/Linux1.0.1.2_ext2fs_Usermanual/
{% endhighlight %}


接着，开发者配置内核，使用如下命令：

{% highlight ruby %}
cd BiscuitOS
make clean
make update
make linux_1_0_1_2_ext2_defconfig
make
cd BiscuitOS/kernel/linux_1.0.1.2/
make clean
make menuconfig
{% endhighlight %}

由于 BiscuitOS 的内核使用 Kbuild 构建起来的，在执行完 make menuconfig 之后，
系统会弹出内核配置的界面，开发者根据如下步骤进行配置：

![Menuconfig](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000003.png)

选择 **kernel hacking**，回车

![Menuconfig1](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000004.png)

选择 **Demo Code for variable subsystem mechanism**, 回车

![Menuconfig2](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000005.png)

选择 **MMU (Memory Manager Unit) on X86 Architecture**, 回车

![Menuconfig3](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000006.png)

选择 **Data storage： Main  Memory, Buffer, Cache**, 回车

![Menuconfig4](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000007.png)

选择 **Register: X86 Common Register mechanism**, 回车

![Menuconfig5](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000008.png)

选择 **EFLAGS： Current status register of processor**, 回车

选择 **ZF Zero flag (bit 6)**.

选择 **BSF    Bit scan forward**.

![Menuconfig6](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000306.png)

运行实例代码，使用如下代码：

{% highlight ruby %}
cd BiscuitOS/kernel/linux_1.0.1.2/
make 
make start
{% endhighlight %}

![Menuconfig7](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000307.png)

## 源码分析

源码位置：

{% highlight ruby %}
BiscuitOS/kernel/linux_1.0.1.2/tools/demo/mmu/storage/register/EFLAGS/eflags.c
{% endhighlight %}

![Menuconfig8](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000308.png)

源码如上图，首先将立即数 0x700 存储到 AX 寄存器中，然后调用 BSF 指令去查找 
AX 寄存 器中，从右到左第一个出现 1 的位置。如果找到，则将找到的位置存储到 
BX 寄存器 中，并将 ZF 清零；如果没有找到，则将 ZF 置位。如果 ZF 置位，则跳
转到 ZF_SO 分支，并将立即数 1 存储到 DX 寄存器中；如果 ZF 清零，则跳转到 
ZF_CO 分支中，并将立即数存储到 DX 寄存中。最后将 DX 寄存器中的值存储到 ZF 
变量中，再将 BX 寄存器中的值存储到 AX 变量里。

#### 运行结果如下：

![Menuconfig9](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000309.png)

#### 运行分析：

源码如上图，首先将立即数存储到 AX 寄存器中，然后调用 BSF 指令去查找 AX 寄存
器中，从右到左第一个出现 1 的位置。如果找到，则将找到的位置存储到 BX 寄存器
中，并将 ZF 清零；如果没有找到，则将 ZF 置位。

{% highlight ruby %}
0x700 = 0000 0111 0000 0000 
{% endhighlight %}

所以从右到左，第 9 个位置为 1 也就是 bit 8。所以 ZF 清零，则跳转到 ZF_CO 分
支中，并将立即数 0 存储到 DX 寄存中。最后将 DX 寄存器中的值 0 存储到 ZF 变量
中，再将 BX 寄存器中的值 8 存储到 AX 变量里。

#### 实践结论：

BSF 指令当找不到 1 的时候会使 ZF 置位。

## 运用场景分析

## 附录

[1. BSF 指令: Intel Architectures Software Developer's Manual: Combined Volumes: 3 Instruction Set Reference,A-L-- Chapter 3 Instruction Set Reference,A-L: 4.3 Instruction(A-L) : BSF -- Bit scan forward](https://software.intel.com/en-us/articles/intel-sdm)

[2. Intel Architectures Software Developer's Manual](https://github.com/BiscuitOS/Documentation/blob/master/Datasheet/Intel-IA32_DevelopmentManual.pdf)
