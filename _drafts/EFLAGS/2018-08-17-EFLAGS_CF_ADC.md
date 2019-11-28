---
layout: post
title:  "ADC 进位运算引起的 CF 置位"
date:   2018-08-17 14:58:30 +0800
categories: [MMU]
excerpt: ADC 进位运算引起的 CF 置位.
tags:
  - EFLAGS
  - CF
---

## 原理

Intel X86 提供了 ADC 指令，该指令用于在一次加法运算中，如果 CF 已经值位，
那么会累加一个 1，反之不累加。ADC 指令中，两个数的和存储在与任意通用寄存器
中，ADC 命令执行的时候检测到 CF 已经值位，和累加 1。

{% highlight ruby %}
CF 值位： AX = AX + BX + 1
CF 清零： AX = AX + BX
{% endhighlight %}

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

![Menuconfig6](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000019.png)

选择 **ADC   Addition with carry bit**.

运行实例代码，使用如下代码：

{% highlight ruby %}
cd BiscuitOS/kernel/linux_1.0.1.2/
make 
make start
{% endhighlight %}

![Menuconfig7](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000020.png)
## 源码分析

源码位置：

{% highlight ruby %}
BiscuitOS/kernel/linux_1.0.1.2/tools/demo/mmu/storage/register/EFLAGS/eflags.c
{% endhighlight %}

![Menuconfig7](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000021.png)

源码如上图，将立即数 0xFFFF 存储到 AX 寄存器中，调用 add 指令使 AL 寄存器增
加 1，接着将立即数 0x1 存储到 BX 寄存器中，调用 ADC 命令对 BX 寄存器里面的
值加一操作。最后将 BX 的值存储到变量 BX 里面。


##### 运行结果如下：

![Menuconfig7](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000022.png)

##### 运行分析：

先将立即数 0xFFF 存储到 AX 寄存器里，然后调用 ADD 指令累加一，以此使 CF 置
位。接着将 0 存储到 BX 寄存器中，再调用 ADC 累加一操作，此时 BX 的寄存器累
加 1 之外还要加上 CF 置位之后的 1，最后 BX 的值为: 1 + 1 = 2. 

## 附录

[1. ADC 指令 Intel Architectures Software Developer's Manual: Combined Volumes: 2 Instruction Set Reference,A-Z-- Chapter 3 Instruction Set Reference,A-L: 3.2 Instruction(A-L) : ADC -- Add with Carry](https://software.intel.com/en-us/articles/intel-sdm)

[2. Intel Architectures Software Developer's Manual](https://github.com/BiscuitOS/Documentation/blob/master/Datasheet/Intel-IA32_DevelopmentManual.pdf)
