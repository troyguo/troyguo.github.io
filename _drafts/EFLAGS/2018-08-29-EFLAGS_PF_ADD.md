---
layout: post
title:  "ADD 加法运算引起的 PF 置位"
date:   2018-08-29 15:49:30 +0800
categories: [MMU]
excerpt: ADD 加法运算引起的 PF 置位.
tags:
  - EFLAGS
  - PF
---

## 原理

Intel X86 提供了 ADD 指令，该指令用于两个数的加法运算，当加法运算结果存储在 
AL/AX/EAX 寄存中，此时 AL 寄存器值含有 1 的个数为偶数时， PF 置位，反之AL 
寄存器的值含有奇数个 1，则 PF 清零。

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

选择 **PF    Parity flag (bit 2)**.

选择 **ADD   Carry on addition**.

![Menuconfig6](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000184.png)

运行实例代码，使用如下代码：

{% highlight ruby %}
cd BiscuitOS/kernel/linux_1.0.1.2/
make 
make start
{% endhighlight %}

![Menuconfig7](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000112.png)

## 源码分析

源码位置：

{% highlight ruby %}
BiscuitOS/kernel/linux_1.0.1.2/tools/demo/mmu/storage/register/EFLAGS/eflags.c
{% endhighlight %}

![Menuconfig8](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000113.png)

源码如上图，将立即数 1 存储到寄存器 AL 中，将立即数 2 存储到寄存器 BL 中，
调用 ADD 指令进行寄存器 BL 和寄存器 AL 的加法，结果存储到 AL 寄存器中。如果 
AL 寄存器的值含有偶数个 1，则 PF 置位，跳转到分支 PF_S5 并将立即数 1 存储到 
DX 寄存器； 如果 AL 寄存器的值含有奇数个 1，则 PF 清零，跳转到 PF_C5 分支，
并将立即数 0 存储到 DX 中，最后将 DX 寄存器的值存储到 PF 变量里，并将 AX 寄
存器的值存储到变量 AX 中。

#### 运行结果如下：

![Menuconfig9](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000114.png)

#### 运行分析：

将立即数 1 存储到寄存器 AL 中，将立即数 2 存储到寄存器 BL 中，调用 ADD 指令
进行寄存器 BL 和寄存器 AL 的加法，结果存储到 AL 寄存器中，此时 
0x1 + 0x2 = 0x3， 将结果 0x3 存储到 AL 寄存器中，此时 AL 寄存器含有偶数个 1，
所以 PF 置位，跳转到分支 PF_S5 并将立即数 1 存储到 DX 寄存器。最后将 DX 寄
存器的值 1 存储到 PF 变量里，并将 AX 寄存器的值 0x8b03 存储到变量 AX 中。

#### 实践结论：

调用 ADD 进行加法运算时，无论是 8/16/32 位加法，只要产生的结果存储到 AL 部
分含有偶数个 1，PF 就置位，反之清零。

## 运用场景分析

## 附录

[1. ADD 指令: Intel Architectures Software Developer's Manual: Combined Volumes: 2 Instruction Set Reference,A-Z-- Chapter 3 Instruction Set Reference,A-L: 3.2 Instruction(A-L) : ADD -- Add](https://software.intel.com/en-us/articles/intel-sdm)

[2. Intel Architectures Software Developer's Manual](https://github.com/BiscuitOS/Documentation/blob/master/Datasheet/Intel-IA32_DevelopmentManual.pdf)
