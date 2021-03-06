---
layout: post
title:  "AND 与运算引起的 ZF 置位"
date:   2018-09-10 14:45:30 +0800
categories: [MMU]
excerpt: AND 与运算引起的 ZF 置位.
tags:
  - EFLAGS
  - ZF
---

## 原理

Intel X86 提供了 AND 指令，该指令用于两个数的二进制与运算，结果存储在 
AL/AX/EAX 寄存器中，如果运算结果 AL 寄存器的值为零，则 ZF 置位；如果运算
结果 AL 寄存器的值不为零，则 ZF 清零。

## 实践

BiscuitOS 提供了 AND 相关的实例代码，开发者可以使用如下命令：

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

选择 **AND Logical AND**.

![Menuconfig6](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000221.png)

运行实例代码，使用如下代码：

{% highlight ruby %}
cd BiscuitOS/kernel/linux_1.0.1.2/
make 
make start
{% endhighlight %}

![Menuconfig7](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000222.png)

## 源码分析

源码位置：

{% highlight ruby %}
BiscuitOS/kernel/linux_1.0.1.2/tools/demo/mmu/storage/register/EFLAGS/eflags.c
{% endhighlight %}

![Menuconfig8](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000223.png)

源码如上图，将立即数 0xA 存储到寄存器 AL 中，将立即数 0x5 存储到寄存器 BL 
中，调用 AND 指令进行寄存器 BL 和寄存器 AL 的与运算，结果存储到 AL 寄存器
中。如果 AL 寄存器的值为零，则 ZF 置位，跳转到分支 ZF_S3 并将立即数 1 存储
到 DX 寄存器； 如果 AL 寄存器的值为非零，则 ZF 清零，跳转到 ZF_C3 分支，并
将立即数 0 存储到 DX 中，最后将 DX 寄存器的值存储到 ZF 变量里，并将 AX 寄存
器的值存储到变量 AX 中。

#### 运行结果如下：

![Menuconfig9](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000224.png)

#### 运行分析：

将立即数 0xA 存储到寄存器 AL 中，将立即数 0x5 存储到寄存器 BL 中，调用 
AND 指令进行寄存器 BL 和寄存器 AL 的与运算，结果存储到 AL 寄存器中。运算过
程如下：

{% highlight ruby %}
AL = AL & BL = 0xA & 0x5 = 0b1010 & 0b0101 = 0b00000000
{% endhighlight %}

AL 寄存器的值为零，则 ZF 置位，跳转到分支 ZF_S3 并将立即数 1 存储到 DX 寄
存器，最后将 DX 寄存器的值 1 存储到 ZF 变量里，并将 AX 寄存器的值存储到变
量 AX 中。

#### 实践结论：

调用 AND 进行加法运算时，无论是 8/16/32 位与运算，只要产生的结果为零，ZF 
就置位，反之清零。

## 运用场景分析

## 附录

[1. AND 指令 : Intel Architectures Software Developer's Manual: Combined Volumes: 2 Instruction Set Reference,A-Z-- Chapter 3 Instruction Set Reference,A-L: 3.2 Instruction(A-L) : AND -- Logical AND](https://software.intel.com/en-us/articles/intel-sdm)

[2. Intel Architectures Software Developer's Manual](https://github.com/BiscuitOS/Documentation/blob/master/Datasheet/Intel-IA32_DevelopmentManual.pdf)
