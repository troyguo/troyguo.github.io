---
layout: post
title:  "DEC 减一运算引起的 PF 置位"
date:   2018-08-30 16:56:30 +0800
categories: [MMU]
excerpt: DEC 减一运算引起的 PF 置位.
tags:
  - EFLAGS
  - PF
---

## 原理

Intel X86 提供了 DEC 指令，该指令用于对操作数减一运算，运算之后的结果的最低
有效字节含有偶数个 1 则 PF 置位；反之最低有效字节含有奇数个 1 则 PF 清零。

## 实践

BiscuitOS 提供了 DEC 相关的实例代码，开发者可以使用如下命令：

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

选择 **DEC   Decrement by 1**.

![Menuconfig6](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000192.png)

运行实例代码，使用如下代码：

{% highlight ruby %}
cd BiscuitOS/kernel/linux_1.0.1.2/
make 
make start
{% endhighlight %}

![Menuconfig7](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000136.png)

## 源码分析

源码位置：

{% highlight ruby %}
BiscuitOS/kernel/linux_1.0.1.2/tools/demo/mmu/storage/register/EFLAGS/eflags.c
{% endhighlight %}

![Menuconfig8](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000137.png)

源码如上图，将立即数 4 存储到寄存器 AL 中，调用 DEC 指令对 AL 寄存器中的值
减一操作，操作之后的结果存储到 AL 寄存器中。如果此时 AL 中含有偶数个 1，则 
PF 置位，跳转到 PF_SD 分支，并将立即数 1 存储到寄存器 DX 里；反之如果 AL 寄
存器中含有奇数个 1，则 PF 清零，跳转到 PF_CD 分支执行，并将立即数 0 存储到
寄存器 DX 里。最后将 DX 寄存器的值存储到 PF 变量里，并将运算结果从 AX 寄存器
里存储到 AX 变量里

#### 运行结果如下：

![Menuconfig9](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000138.png)

#### 运行分析：

将立即数 4 存储到寄存器 AL 中，调用 DEC 指令对 AL 寄存器中的值减一操作，操
作之后的结果存储到 AL 寄存器中， 运算过程为 0x4 - 1 = 0x3。运算结果 0x3 存
储到 AL 寄存器中，此时 AL 寄存器含有 2 个 1，所以 PF 置位，跳转到 PF_SD 分
支，并将立即数 1 存储到寄存器 DX 里。最后将 DX 寄存器的值 1 存储到 PF 变量
里，并将运算结果 0x3 从 AX 寄存器里存储到 AX 变量里。

#### 实践结论：

DEC 在做减一运算时候，如果运算结果的最低有效字节含有偶数个 1，则 PF 置位；
反之含有奇数个 1 则 PF 清零

## 运用场景分析

## 附录

[1. DEC 指令: Intel Architectures Software Developer's Manual: Combined Volumes: 2 Instruction Set Reference,A-Z-- Chapter 3 Instruction Set Reference,A-L: 3.2 Instruction(A-L) : DEC -- Decreament by 1](https://software.intel.com/en-us/articles/intel-sdm)

[2. Intel Architectures Software Developer's Manual](https://github.com/BiscuitOS/Documentation/blob/master/Datasheet/Intel-IA32_DevelopmentManual.pdf)
