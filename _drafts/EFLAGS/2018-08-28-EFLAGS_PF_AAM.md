---
layout: post
title:  "AAM ASCII 调整引起的 PF 置位"
date:   2018-08-28 21:32:30 +0800
categories: [MMU]
excerpt: AAM ASCII 调整引起的 PF 置位.
tags:
  - EFLAGS
  - PF
---

## 原理


Intel X86 提供了 AAM 指令，该指令用于两个非压缩 BCD 乘法运算之后，将计算
的结果转换成未压缩的 BCD 码，以得到有效的 BCD 码。其原理是将乘法计算之后
的结果存储到 AL 寄存器，接着 AH 寄存器的值调整为原始的  (AL / 10). AL 寄
存器的值调整为原始 AL % 10

{% highlight ruby %}
AH = AL / 10
AH = AL % 10
{% endhighlight %}

## 实践

BiscuitOS 提供了 AAM 相关的实例代码，开发者可以使用如下命令：

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

选择 **AAM   ASCII adjust AX after multiplu**.

![Menuconfig6](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000182.png)

运行实例代码，使用如下代码：

{% highlight ruby %}
cd BiscuitOS/kernel/linux_1.0.1.2/
make 
make start
{% endhighlight %}

![Menuconfig7](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000106.png)

## 源码分析

源码位置：

{% highlight ruby %}
BiscuitOS/kernel/linux_1.0.1.2/tools/demo/mmu/storage/register/EFLAGS/eflags.c
{% endhighlight %}

![Menuconfig7](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000107.png)

源码如上图，首先将立即数 0x9 存储到寄存器 AL 中，并将立即数 0x7 存储到寄存
器 BL 中，调用 MUL 指令进行乘法运算，由于 MUL 参数是 8 位寄存器，所以被认为
 8 位乘法，运算结果存储到 AX 寄存器中。接着将结果存储到变量 BX 中，然后调用 
AAM 指令，将 AX 寄存器的值转换为有效的未压缩 BCD 码。如果 AL 寄存器中 1 的
个数为偶数个，那么 PF 置位，接着跳转到 PF_SET1 分支，并将立即数 1 存储到 BX 
寄存器。同理，如果 AL 寄存器中 1 的个数为奇数个，那么 PF 清零，则跳转到 
PF_CLEAR1 分支，并将立即数 0 存储到 BX 寄存器中。最后，将 BX 寄存器的值存储
到 PF 变量，再把 AAM 处理后的 AX 寄存器值存储到 BX 变量里。

#### 运行结果如下：

![Menuconfig7](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000108.png)

#### 运行分析：

首先将立即数 0x9 存储到寄存器 AL 中，并将立即数 0x7 存储到寄存器 BL 中，
调用 MUL 指令进行乘法运算，由于 MUL 参数是 8 位寄存器，所以被认为 8 位乘
法，运算结果存储到 AX 寄存器中，此时结果为 0x3f (63) 。接着将结果存储到
变量 BX 中，然后调用 AAM 指令，将 AX 寄存器的值转换为有效的未压缩 BCD 码, 
此时原始 AX 寄存器的值为 0x3f，使用如下转换：

{% highlight ruby %}
AH = AL / 10 = 0x3f / 10 = 0x6
AL = AL % 10 = 0x3f / 10 = 0x3
{% endhighlight %}

所以 AAM 执行之后，AX 寄存器的值为 0x603。此时 AL 寄存器为 0x3，含有 2 个 
1，此时为偶数个 1，所以 PF 置位。PF 置位，接着跳转到 PF_SET1 分支，并将立
即数 1 存储到 BX 寄存器。最后，将 BX 寄存器的值存储到 PF 变量，PF 变量的值
为 1. 再把 AAM 处理后的 AX 寄存器值存储到 AX 变量里。AX 变量为 0x603.

#### 实践结论：

AAM  指令的执行会引起 PF 置位。

## 运用场景分析

## 附录

[1. AAM 指令: Intel Architectures Software Developer's Manual: Combined Volumes: 2 Instruction Set Reference,A-Z-- Chapter 3 Instruction Set Reference,A-L: 3.2 Instruction(A-L) : AAM -- ASCII Adjust AX after multiply](https://software.intel.com/en-us/articles/intel-sdm)

[2. Intel Architectures Software Developer's Manual](https://github.com/BiscuitOS/Documentation/blob/master/Datasheet/Intel-IA32_DevelopmentManual.pdf)

[3. Packed BCD and Unpacked BCD](https://github.com/BuddyZhang1/Kernel/tree/master/tools/demo/Data/Base/BCD)
