---
layout: post
title:  "SBB 带借位的减法运算"
date:   2018-08-24 15:54:30 +0800
categories: [MMU]
excerpt: SBB 带借位的减法运算.
tags:
  - EFLAGS
  - CF
---

## 原理

Intel X86 提供了 SBB 指令，该指令用于两个带借位的整数减法，如果 CF 置位 ，两个数相减应带上借位。

{% highlight ruby %}
AX = AX - BX      （CF 未置位）
AX = AX - BX - 1   (CF 置位)
{% endhighlight %}

## 实践

BiscuitOS 提供了 SBB 相关的实例代码，开发者可以使用如下命令：

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

选择 **SBB   Integer subtraction with borrow**.

![Menuconfig6](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000067.png)

运行实例代码，使用如下代码：

{% highlight ruby %}
cd BiscuitOS/kernel/linux_1.0.1.2/
make 
make start
{% endhighlight %}

![Menuconfig7](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000068.png)

## 源码分析

源码位置：

{% highlight ruby %}
BiscuitOS/kernel/linux_1.0.1.2/tools/demo/mmu/storage/register/EFLAGS/eflags.c
{% endhighlight %}

![Menuconfig7](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000069.png)

源码如上图，SBB 指令支持 8/16/32 位减法，SUB 指令会根据第二个参数的位宽来判
定减法操作的情况，如下：

##### 8 位减法

源码中，首先置位 CF 标志位。将立即数 0x5 存储到寄存器 AL 中，并将立即数 0x2 
存储到 BL 中，接着调用 SBB 指令，使寄存器 AL 中的值减去寄存器 BL 中的值。由于
 SBB 的第二个参数是 BL，寄存器位宽为 8，所以 SBB 认为这是一次 8 位减法运算。
将结果存储到 AX 寄存器中。

##### 16 位减法

源码中，首先置位 CF 标志位。将立即数 0x2000 存储到寄存器 AX 中，并将立即数 
0x1000 存储到 BX 中，接着调用 SBB 指令，使寄存器 AX 中的值减去寄存器 BX 中
的值。由于 SBB 的第二个参数是 BX，寄存器位宽为 16，所以 SBB 认为这是一次 16 
位减法运算。将结果存储到 AX 寄存器中。

##### 32 位减法

源码中，首先置位 CF 标志位。将立即数 0x200000 存储到寄存器 EAX 中，并将立即
数 0x100000 存储到 EBX 中，接着调用 SBB 指令，使寄存器 EAX 中的值减去寄存器 
EBX 中的值。由于 SBB 的第二个参数是 EBX，寄存器位宽为 32，所以 SBB 认为这是
一次 32 位减法运算。将结果存储到 EAX 寄存器中。

#### 运行结果如下：

![Menuconfig7](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000070.png)

#### 运行分析：

SBB 指令支持 8/16/32 位减法，SBB 指令会根据第二个参数的位宽来判定减法操作
的情况，如下：

##### 8 位减法

源码中，首先置位 CF 标志位。将立即数 0x5 存储到寄存器 AL 中，并将立即数 0x2 
存储到 BL 中，接着调用 SBB 指令，使寄存器 AL 中的值减去寄存器 BL 中的值。由于
 SBB 的第二个参数是 BL，寄存器位宽为 8，所以 SBB 认为这是一次 8 位减法运算。
由于 CF 置位，在减法的时候需要多减一个 1，结果为 0x2. 将结果存储到 AX 寄存器中。

##### 16 位减法

源码中，首先置位 CF 标志位。将立即数 0x2000 存储到寄存器 AX 中，并将立即数 
0x1000 存储到 BX 中，接着调用 SBB 指令，使寄存器 AX 中的值减去寄存器 BX 中的
值。由于 SBB 的第二个参数是 BX，寄存器位宽为 16，所以 SBB 认为这是一次 16 位
减法运算。由于 CF 置位，在减法的时候需要多减一个 1，结果为0xfff。将结果存储到 
AX 寄存器中。

##### 32 位减法

源码中，首先置位 CF 标志位。将立即数 0x200000 存储到寄存器 EAX 中，并将立即
数 0x100000 存储到 EBX 中，接着调用 SBB 指令，使寄存器 EAX 中的值减去寄存器 
EBX 中的值。由于 SBB 的第二个参数是 EBX，寄存器位宽为 32，所以 SBB 认为这是
一次 32 位减法运算。由于 CF 置位，在减法的时候需要多减一个 1，结果为 0xfffff。
将结果存储到 EAX 寄存器中。

#### 实践结论：

SBB 做减法运算时，CF 置位会影响减法结果。

## 运用场景分析

## 附录

[1. SBB 指令 Intel Architectures Software Developer's Manual: Combined Volumes: 2 Instruction Set Reference,A-Z-- Chapter 4 Instruction Set Reference,M-U: 4.3 Instruction(M-U) : SBB -- Integer Subtraction with borrow](https://software.intel.com/en-us/articles/intel-sdm)

[2. Intel Architectures Software Developer's Manual](https://github.com/BiscuitOS/Documentation/blob/master/Datasheet/Intel-IA32_DevelopmentManual.pdf)
