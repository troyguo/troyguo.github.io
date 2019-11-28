---
layout: post
title:  "DAA 压缩 BCD 加法引起的 CF 置位"
date:   2018-08-27 13:57:30 +0800
categories: [MMU]
excerpt: DAA 压缩 BCD 加法引起的 CF 置位.
tags:
  - EFLAGS
  - CF
---

## 原理

Intel X86 提供了 DAA 指令，该指令用于两个压缩 BCD 码的加法运算，当相加的结
果存储到 AL 寄存器，且 AL 的值大于 9 或 0x99， 再调用 DAA 十进制调整时，会
引起 CF 置位。

## 实践

BiscuitOS 提供了 DAA 相关的实例代码，开发者可以使用如下命令：

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

选择 **CF    Carry Flag(bit 0)**.

选择 **DAA Decimal adjust AL after addition**.

![Menuconfig6](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000027.png)

运行实例代码，使用如下代码：

{% highlight ruby %}
cd BiscuitOS/kernel/linux_1.0.1.2/
make 
make start
{% endhighlight %}

![Menuconfig7](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000028.png)

## 源码分析

源码位置：

{% highlight ruby %}
BiscuitOS/kernel/linux_1.0.1.2/tools/demo/mmu/storage/register/EFLAGS/eflags.c
{% endhighlight %}

![Menuconfig7](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000029.png)

源码如上图，将立即数 0x79 存储到 AL 寄存器中，将立即数 0x35 存储到寄存器 BL 
中。调用 ADD 指令使 AX 寄存器的值与 BX 寄存器的值相加，相加的结果存储到 AX 
寄存器中，接着调用 DAA 指令将 AL 寄存器中的值转换成非压缩的 BCD 码。如果 CF 
置位就跳转到 CF_SET4 分支，并将立即数 1 存储到 BX 寄存器里；如果 CF 没有置
位，跳转到 CF_CLEAR4 分支，并将立即数存储到 BX 寄存器。最后将 BX 寄存器的值
存储到 CF 变量， AX 寄存器的值存储到 AX 变量里。

#### 运行结果如下：

![Menuconfig7](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000030.png)

#### 运行分析：

先将立即数 0x79 存储到 AX 寄存器里，将立即数 0x35 存储到寄存器 BL 中。然后调
用 ADD 指令让 AL 寄存器的值 0x79 和 BL 寄存器的值 0x35 相加，其结果 0xAE 存
储到 AX 寄存器中。调用 DAA 指令，由于 AL 的中的第四位值为 0xE，大于 9， 所以
需要加上 0x6，结果为 0x4 并且进位， CF 置位。AL 寄存器中的高 4 位为 0xA，其值
也大于 9，所以也需要加上 0x6 来调整，调整之后的值为 0x1，并带进位，CF 置位。
最终 AL 寄存器的值为 0x14.  此时 CF 被置位，CF 置位之后，立即数 1 存储到 BX 
寄存器，最终 BX 寄存器的值存储到 CF 变量里，CF 的值为 1. AX 寄存器的值存储
到 AX 变量里，此时 AX 由于 CF 的置位，AX 的值变成 0x0.

{% highlight ruby %}
AX = ((AX & 0xF) + 0x6) || ((AX >> 4 & 0xF) + 0x6)  
{% endhighlight %}

#### 实践结论：

调用 DAA 指令进行两个未压缩的 BCD 码加法时，如果产生进位， CF 位就会被置位

## 运用场景分析

## 附录

[1. DAA 指令: Intel Architectures Software Developer's Manual: Combined Volumes: 2 Instruction Set Reference,A-Z-- Chapter 3 Instruction Set Reference,A-L: 3.2 Instruction(A-L) : DAA -- Decimal Adjust AL after Addition](https://software.intel.com/en-us/articles/intel-sdm)

[2. Intel Architectures Software Developer's Manual](https://github.com/BiscuitOS/Documentation/blob/master/Datasheet/Intel-IA32_DevelopmentManual.pdf)

[3. Packed BCD and Unpacked BCD](https://github.com/BuddyZhang1/Kernel/tree/master/tools/demo/Data/Base/BCD)
