---
layout: post
title:  "ADD 加法运算引起的 SF 置位"
date:   2018-10-16 15:37:30 +0800
categories: [MMU]
excerpt: ADD 加法运算引起的 SF 置位.
tags:
  - EFLAGS
  - SF
---

## 原理

Intel X86 提供了 ADD 指令由于两个数的加法运算，如果运算的结果的最高有效位
为 1，那么 EFLAGS 的 SF 标志位置位，反之清零

## 实践

BiscuitOS 提供了 ADD 相关的实例代码，开发者可以使用如下命令：

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

选择 **SF  Sing flag (bit 7)**.

选择 **ADD  Add**

![Menuconfig6](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000367.png)

运行实例代码，使用如下代码：

{% highlight ruby %}
cd BiscuitOS/kernel/linux_1.0.1.2/
make 
make start
{% endhighlight %}

![Menuconfig7](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000368.png)

## 源码分析

源码位置：

{% highlight ruby %}
BiscuitOS/kernel/linux_1.0.1.2/tools/demo/mmu/storage/register/EFLAGS/eflags.c
{% endhighlight %}

![Menuconfig8](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000369.png)

ADC 指令用于两个数的加法，加法的结果存储到目的操作数里，如上图，将立即数 -6 
存储到 AL 寄存器中，接着将立即数 1 存储到 BL 寄存器中，最后将立即数 0 存储
到 DL 寄存器中。调用 ADD 指令进行 AL 寄存器和 BL 寄存器相加，相加的结果存储
到 AL 寄存器中。如果 AL 寄存器的最高有效位为 1，则 EFLAGS 寄存器 SF 标志位置
位；反之 SF 标志位清零。如果 SF 置位，那么调用 SETS 指令将 DL 寄存器置位。最
后将 DL 寄存器的值存储到 SF 变量，并且将 AL 寄存器的值存储到 AX 变量里。

#### 运行结果如下：

![Menuconfig9](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000370.png)

#### 运行分析：

ADC 指令用于两个数的加法，加法的结果存储到目的操作数里，如上图，将立即数 -6 
存储到 AL 寄存器中，接着将立即数 1 存储到 BL 寄存器中，最后将立即数 0 存储
到 DL 寄存器中。调用 ADD 指令进行 AL 寄存器和 BL 寄存器相加，相加的结果存储
到 AL 寄存器中。根据源码可知，运算过程如下：

{% highlight ruby %}
AL = AL + BL = -6 + 1 = -5
{% endhighlight %}

从结果可知，相加的结果为 -5，是一个负数，-5 的补码是 0xfb。所以 AL 寄存器的
最高位为 1，因此 EFLAGS 寄存器的 SF 标志位置位。SF 置位之后，SETS 指令将 DL 
寄存器的值设置为 1。最后将 AX 寄存器的值 0xfb 存储到 AX 变量里，DL 寄存器的
值 1 存储到 SF 变量里。

#### 实践结论：

ADD 在进行两个数的加法时，产生的结果最高有效位为 1 时， EFLAGS 寄存器的 SF 
标志位置位；反之清零。

## 运用场景分析

## 附录

[1. ADD 指令: Intel Architectures Software Developer's Manual: Combined Volumes: 2 Instruction Set Reference,A-Z-- Chapter 3 Instruction Set Reference,A-L: 3.2 Instruction(A-L) : ADD -- Add](https://software.intel.com/en-us/articles/intel-sdm)

[2. Intel Architectures Software Developer's Manual](https://github.com/BiscuitOS/Documentation/blob/master/Datasheet/Intel-IA32_DevelopmentManual.pdf)
