---
layout: post
title:  "NEG 取反加一运算引起的 ZF 置位"
date:   2018-09-11 14:15:30 +0800
categories: [MMU]
excerpt: NEG 取反加一运算引起的 ZF 置位.
tags:
  - EFLAGS
  - ZF
---

## 原理

Intel X86 提供了 NEG 指令，该指令用于对操作数进行取反加一运算，运算之后的
结果如果为零，那么 ZF 置位；反之 ZF 清零。

## 实践

BiscuitOS 提供了 NEG 相关的实例代码，开发者可以使用如下命令：

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

选择 **NEG   two's complement negation**.

![Menuconfig6](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000258.png)

运行实例代码，使用如下代码：

{% highlight ruby %}
cd BiscuitOS/kernel/linux_1.0.1.2/
make 
make start
{% endhighlight %}

![Menuconfig7](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000259.png)

## 源码分析

源码位置：

{% highlight ruby %}
BiscuitOS/kernel/linux_1.0.1.2/tools/demo/mmu/storage/register/EFLAGS/eflags.c
{% endhighlight %}

![Menuconfig8](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000260.png)

源码如上图，将立即数 0 存储到寄存器 AL 中，调用 NEG 指令对 AL 寄存器中的值
取反加一操作，操作之后的结果存储到 AL 寄存器中。如果此时 AL 寄存器为零，则 
ZF 置位，跳转到 ZF_SC 分支，并将立即数 1 存储到寄存器 DX 里；反之如果 AL 寄
存器的值不为零，则 ZF 清零，跳转到 ZF_CC 分支执行，并将立即数 0 存储到寄存
器 DX 里。最后将 DX 寄存器的值存储到 ZF 变量里，并将运算结果从 AX 寄存器里存
储到 AX 变量里。

#### 运行结果如下：

![Menuconfig9](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000261.png)

#### 运行分析：

将立即数 0 存储到寄存器 AL 中，调用 NEG 指令对 AL 寄存器中的值取反加一操作，
操作之后的结果存储到 AL 寄存器中， 运算过程为 ~(0x0) + 1 = 0x0。运算结果 
0x0 存储到 AL 寄存器中，此时 AL 寄存器的值为零，所以 ZF 置位，跳转到 ZF_SC 
分支，并将立即数 1 存储到寄存器 DX 里。最后将 DX 寄存器的值 1 存储到 ZF 变
量里，并将运算结果 0x00 从 AX 寄存器里存储到 AX 变量里。

#### 实践结论：

NEG 在做取反加一运算时候，如果运算结果为零，则 ZF 置位；反之 ZF 清零。

## 运用场景分析

## 附录

[1. NEG 指令: Intel Architectures Software Developer's Manual: Combined Volumes: 2 Instruction Set Reference,M-U-- Chapter 4 Instruction Set Reference,M-U: 4.3 Instruction(M-U) : NEG -- Two's Complement Negation](https://software.intel.com/en-us/articles/intel-sdm)

[1. DEC 指令: Intel Architectures Software Developer's Manual: Combined Volumes: 2 Instruction Set Reference,A-Z-- Chapter 3 Instruction Set Reference,A-L: 3.2 Instruction(A-L) : DEC -- Decreament by 1](https://software.intel.com/en-us/articles/intel-sdm)
