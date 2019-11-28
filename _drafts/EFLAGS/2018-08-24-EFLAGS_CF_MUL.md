---
layout: post
title:  "MUL 乘法运算中引起的 CF 置位"
date:   2018-08-24 16:21:30 +0800
categories: [MMU]
excerpt: MUL 乘法运算中引起的 CF 置位.
tags:
  - EFLAGS
  - CF
---

## 原理

Intel X86 提供了 MUL 指令，该指令用于两个无符号的整数乘法，如果产生进位，
CF 置位。

## 实践

BiscuitOS 提供了 MUL 相关的实例代码，开发者可以使用如下命令：

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

选择 **MUL   Unisgned multiply**.

![Menuconfig6](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000059.png)

运行实例代码，使用如下代码：

{% highlight ruby %}
cd BiscuitOS/kernel/linux_1.0.1.2/
make 
make start
{% endhighlight %}

![Menuconfig7](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000060.png)

## 源码分析

源码位置：

{% highlight ruby %}
BiscuitOS/kernel/linux_1.0.1.2/tools/demo/mmu/storage/register/EFLAGS/eflags.c
{% endhighlight %}

![Menuconfig7](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000061.png)

源码如上图，根据 MUL 指令参数的类型分作三种情况

##### 8 位乘法

将立即数 0x40 存储到 AL 寄存器中，将立即数 0x4 存储到 BL 寄存器，调用 MUL 指
令将 BL 寄存器中的值与 AL 寄存器中的值相乘，由于 BL 为八位寄存器，所以系统认
为这是一次八位乘法操作，结果存储到 AX 寄存器中，如果 CF 置位，则跳转到 
CF_SET12 ,并将立即数存储到寄存器 BX 中，如果 CF 清零，则跳转到 CF_CLEAR12 分
支，并将立即数 0 存储到寄存器 BX 中。最终将寄存器 AX 存储到变量 AX 中。

##### 16 位乘法

将立即数 0x1000 存储到 AX 寄存器中，将立即数 0x10 存储到 BX 寄存器，调用 
MUL 指令将 BX 寄存器中的值与 AX 寄存器中的值相乘，由于 BX 为十六位寄存器，
所以系统认为这是一次十六位乘法操作，结果存储到 EAX 寄存器中，如果 CF 置位，
则跳转到 CF_SET13 ,并将立即数存储到寄存器 BX 中，如果 CF 清零，则跳转到 
CF_CLEAR13 分支，并将立即数 0 存储到寄存器 BX 中。最终将寄存器 EAX 存储到
变量 EAX 中。

##### 32 位乘法

将立即数 0x100000 存储到 EAX 寄存器中，将立即数 0x1000 存储到 EBX 寄存器，
调用 MUL 指令将 EBX 寄存器中的值与 EAX 寄存器中的值相乘，由于 EBX 为 32 
位寄存器，所以系统认为这是一次 32 位乘法操作，结果存储到 EDX:EAX 寄存器中(高 
32 位存储到 EDX 中，低 32 位存储到 EAX 中)，如果 CF 置位，则跳转到 CF_SET14,
并将立即数存储到寄存器 BX 中，如果 CF 清零，则跳转到 CF_CLEAR14 分支，并将
立即数 0 存储到寄存器 BX 中。最终将寄存器 EAX 存储到变量 EAX 中.寄存器 EDX 
的值存储到变量 EDX 中。

#### 运行结果如下：

![Menuconfig7](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000062.png)

#### 运行分析：

根据 MUL 指令参数的类型分作三种情况

##### 8 位乘法

将立即数 0x40 存储到 AL 寄存器中，将立即数 0x4 存储到 BL 寄存器，调用 MUL 
指令将 BL 寄存器中的值与 AL 寄存器中的值相乘，由于 BL 为八位寄存器，所以系
统认为这是一次八位乘法操作，结果为 0x100，由于 AL 寄存器无法存储 0x100， 
需要进位，此时 CF 置位。CF 置位，则跳转到 CF_SET12 ,并将立即数存储到寄存器 
BX 中。最终将寄存器 AX 存储到变量 AX 中，为 0x100， 寄存器 BX 的值存储到 CF 
变量中，为 1。

##### 16 位乘法

将立即数 0x1000 存储到 AX 寄存器中，将立即数 0x4 存储到 BL 寄存器，调用 MUL 
指令将 BX 寄存器中的值与 AX 寄存器中的值相乘，由于 BX 为 16 位寄存器，所以系
统认为这是一次 16 位乘法操作，结果为 0x10000，由于 AX 寄存器无法存储 0x10000，
 需要进位，此时 CF 置位。CF 置位，则跳转到 CF_SET13 ,并将立即数存储到寄存器 
BX 中。最终将寄存器 EAX 存储到变量 EAX 中，为 0x10000， 寄存器 BX 的值存储到 
CF 变量中，为 1。

##### 32 位乘法

将立即数 0x100000 存储到 EAX 寄存器中，将立即数 0x1000 存储到 EBX 寄存器，调
用 MUL 指令将 EBX 寄存器中的值与 EAX 寄存器中的值相乘，由于 EBX 为 32 位寄存
器，所以系统认为这是一次 32 位乘法操作，结果存储到 EDX:EAX 寄存器中(高 32 位
存储到 EDX 中，低 32 位存储到 EAX 中)，结果为 0x100000000， 由于 EAX 无法存储
超 32 位的值，所以 CF 置位。高于 32 位的值存储到 EDX 寄存器中。CF 置位，则跳
转到 CF_SET14 ,并将立即数存储到寄存器 BX 中。最终将寄存器 EAX 存储到变量 EAX 
中.寄存器 EDX 的值存储到变量 EDX 中。

#### 实践结论：

MUL 进行 8/16/32 位乘法会引起进位并置位 CF 标志位

## 运用场景分析

## 附录

[1. MUL 指令: Intel Architectures Software Developer's Manual: Combined Volumes: 2 Instruction Set Reference,A-Z-- Chapter 4 Instruction Set Reference,M-U: 4.3 Instruction(M-U) : MUL -- Unsigned Multiply](https://software.intel.com/en-us/articles/intel-sdm)

[2. Intel Architectures Software Developer's Manual](https://github.com/BiscuitOS/Documentation/blob/master/Datasheet/Intel-IA32_DevelopmentManual.pdf)
