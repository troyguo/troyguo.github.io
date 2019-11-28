---
layout: post
title:  "DAA 压缩 BCD 加法引起的 ZF 置位"
date:   2018-09-10 18:37:30 +0800
categories: [MMU]
excerpt: DAA 压缩 BCD 加法引起的 ZF 置位.
tags:
  - EFLAGS
  - ZF
---

## 原理

Intel X86 提供了 DAA 指令，该指令用于两个压缩 BCD 码的加法运算，当相加的结
果存储到 AL 寄存器，且 AL 的值大于 9 或 0x99， 再调用 DAA 十进制调整时，如
果调整的结果为零，则 ZF 置位；反之调整的结果不为零，则 ZF 清零。

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

选择 **ZF Zero flag (bit 6)**.

选择 **DAA Decimal adjust AL after addition**.

![Menuconfig6](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000242.png)

运行实例代码，使用如下代码：

{% highlight ruby %}
cd BiscuitOS/kernel/linux_1.0.1.2/
make 
make start
{% endhighlight %}

![Menuconfig7](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000243.png)

## 源码分析

源码位置：

{% highlight ruby %}
BiscuitOS/kernel/linux_1.0.1.2/tools/demo/mmu/storage/register/EFLAGS/eflags.c
{% endhighlight %}

![Menuconfig8](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000244.png)

源码如上图，将立即数 0x99 存储到 AL 寄存器中，将立即数 0x1 存储到寄存器 BL 
中。调用 ADD 指令使 AX 寄存器的值与 BX 寄存器的值相加，相加的结果存储到 AX 
寄存器中，接着调用 DAA 指令将 AL 寄存器中的值转换成非压缩的 BCD 码。如果 AL 
寄存器中的值为零 ，ZF 就置位。 ZF 置位就跳转到 ZF_S8 分支，并将立即数 1 存
储到 DX 寄存器里；如果 AL 寄存器中的值为零，则 ZF 清零，ZF 没有置位，跳转到 
ZF_Z8 分支，并将立即数 0 存储到 DX 寄存器。最后将 DX 寄存器的值存储到 ZF 变
量， AX 寄存器的值存储到 AX 变量里。

#### 运行结果如下：

![Menuconfig9](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000245.png)

#### 运行分析：

先将立即数 0x99 存储到 AX 寄存器里，将立即数 0x1 存储到寄存器 BL 中。然后调
用 ADD 指令让 AL 寄存器的值 0x99 和 BL 寄存器的值 0x1 相加，其结果 0x9a 存储
到 AX 寄存器中。调用 DAA 指令，由于 AL 的中的低四位值为 0xA，大于 9， 所以需
要加上 0x6，结果为 0x00 并且进位， CF 置位。AL 寄存器中的高 4 位为 0x9，其值
等于 9，由于 CF 置位，最后 AL 高四位的值为 0xA, 其大于 9，所以也需要加上 0x6 
来调整，调整之后的值为 0x0，并带进位，CF 置位。最终 AL 寄存器的值为 0x00， 
ZF 置位，ZF 置位之后，立即数 1 存储到 DX 寄存器，最终 DX 寄存器的值存储到 ZF 
变量里，ZF 的值为 1. AX 寄存器的值存储到 AX 变量里.

{% highlight ruby %}
AX = ((AX & 0xF) + 0x6) || ((AX >> 4 & 0xF) + 0x6)  
{% endhighlight %}

#### 实践结论：

调用 DAA 指令进行两个未压缩的 BCD 码加法时，如果产生的值为零，则 ZF 置位，
否则 ZF 清零。

## 运用场景分析

## 附录

[1. DAA指令: Intel Architectures Software Developer's Manual: Combined Volumes: 2 Instruction Set Reference,A-Z-- Chapter 3 Instruction Set Reference,A-L: 3.2 Instruction(A-L) : DAA -- Decimal Adjust AL after Addition](https://software.intel.com/en-us/articles/intel-sdm)

[2. Intel Architectures Software Developer's Manual](https://github.com/BiscuitOS/Documentation/blob/master/Datasheet/Intel-IA32_DevelopmentManual.pdf)

[3. Packed BCD and Unpacked BCD](https://github.com/BuddyZhang1/Kernel/tree/master/tools/demo/Data/Base/BCD)
