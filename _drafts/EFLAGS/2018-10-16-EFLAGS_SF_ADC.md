---
layout: post
title:  "ADC 进位运算引起的 SF 置位"
date:   2018-10-16 10:04:30 +0800
categories: [MMU]
excerpt: ADC 进位运算引起的 SF 置位.
tags:
  - EFLAGS
  - SF
---

## 原理

Intel X86 提供了 ADC 指令，该指令用于在一次加法运算中，如果 CF 已经值位，
那么会累加一个 1，反之不累加。ADC 指令中，ADC 根据第一个参数的位宽决定是 
8/16/32 位加法运算，并且将运算结果存储到 AL/AX/EAX 寄存器中。如果执行 ADC 
指令之后结果的最高有效位为 1，SF 置位；如果执行 ADC 指令之后结果的最高有效
位为零，SF 清零。

## 实践

BiscuitOS 提供了 ADC 相关的实例代码，开发者可以使用如下命令：

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

选择 **ADC   Addition with carry bit**

![Menuconfig6](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000363.png)

运行实例代码，使用如下代码：

{% highlight ruby %}
cd BiscuitOS/kernel/linux_1.0.1.2/
make 
make start
{% endhighlight %}

![Menuconfig7](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000364.png)

## 源码分析

源码位置：

{% highlight ruby %}
BiscuitOS/kernel/linux_1.0.1.2/tools/demo/mmu/storage/register/EFLAGS/eflags.c
{% endhighlight %}

![Menuconfig8](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000365.png)

ADC 指令用于带进位的加法，如上图源码，首先将立即数 -6 存储到 AL 寄存器中，接
着将立即数 1 存储到 BL 寄存器中，最后将立即数 0 存储到 DL 寄存器中。为了实现
进位效果，调用 STC 指令将 EFLAGS 的 CF 标志位置位。初始化完之后，调用 ADC 指
令进行带进位的加法，也就是将 BL 寄存器中的值和 AL 寄存器中的值相加之后，再与 
EFLAGS 寄存器的 CF 标志位的值相加。如果 ADC 指令执行之后的 AL 寄存器的最高有
效位为 1，则 SETS 指令会将 DL 寄存器中的值设置为 1.计算完之后，将 AL 寄存器的
值存储到 AX 变量里，最后将 DL 寄存器中的值存储到 SF 变量里。

#### 运行结果如下：

![Menuconfig9](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000366.png)

#### 运行分析：

首先调用 STC 指令置位 CF 标志位，然后将立即数 -6 存储到 AL 寄存器, 再把立即
数 1 存储到 BL 寄存器，接着调用 ADC 指令进行 BL 寄存器和 AL 寄存器带进位加法，
过程为：

{% highlight ruby %}
AL = AL + BL + 1 = -6 + 1 + 1 = -4
{% endhighlight %}

结果存储到 AL 寄存器，由于 ADC 的第二个参数是 AL 寄存器，所以被认为是一次 8 
位带进位加法。运算的结果 AL 寄存器中的值的最高有效位为 1，那么 EFLAGS 寄存器
的 SF 标志位置位，那么 SETS 指令将 DL 寄存器设置为 1.最后 AL 寄存器的值 0xFC 
存储到 AX 变量里

#### 实践结论：

ADC 做 8/16/32 位带进位加法时，只要运算结果为零，那么 ZF 置位，反之 ZF 清零。

## 运用场景分析

## 附录

[1. ADC 指令: Intel Architectures Software Developer's Manual: Combined Volumes: 2 Instruction Set Reference,A-Z-- Chapter 3 Instruction Set Reference,A-L: 3.2 Instruction(A-L) : ADC -- Add with Carry](https://software.intel.com/en-us/articles/intel-sdm)

[2. Intel Architectures Software Developer's Manual](https://github.com/BiscuitOS/Documentation/blob/master/Datasheet/Intel-IA32_DevelopmentManual.pdf)
