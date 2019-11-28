---
layout: post
title:  "SUB 减法运算中借位引起的 CF 置位"
date:   2018-08-24 16:01:30 +0800
categories: [MMU]
excerpt: SUB 减法运算中借位引起的 CF 置位.
tags:
  - EFLAGS
  - CF
---

## 原理

Intel X86 提供了 SUB 指令，该指令用于两个整数减法，如果产生借位，CF 置位

## 实践

BiscuitOS 提供了 SUB 相关的实例代码，开发者可以使用如下命令：

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

选择 **SUB   Integer subtraction**.

![Menuconfig6](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000063.png)

运行实例代码，使用如下代码：

{% highlight ruby %}
cd BiscuitOS/kernel/linux_1.0.1.2/
make 
make start
{% endhighlight %}

![Menuconfig7](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000064.png)

## 源码分析

源码位置：

{% highlight ruby %}
BiscuitOS/kernel/linux_1.0.1.2/tools/demo/mmu/storage/register/EFLAGS/eflags.c
{% endhighlight %}

![Menuconfig7](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000065.png)

源码如上图，SUB 指令支持 8/16/32 位减法，SUB 指令会根据第二个参数的位宽来
判定减法操作的情况，如下：

##### 8 位减法

源码中将立即数 0x1 存储到寄存器 AL 中，并将立即数 0x2 存储到 BL 中，接着调
用 SUB 指令，使寄存器 AL 中的值减去寄存器 BL 中的值。由于 SUB 的第二个参数
是 BL，寄存器位宽为 8，所以 SUB 认为这是一次 8 位减法运算。如果在减法运算中
产生借位操作，则 CF 置位并跳转到 CF_SET15 分支，并将立即数 1 存储到 BX 寄存
器中。如果减法运算中未产生借位运算，则 CF 清零并跳转到 CF_CLEAR15 分支，并将
立即数 0 存储到寄存器 BX 中。最后将结果存储到 AX 寄存器中。

##### 16 位减法

源码中将立即数 0x1000 存储到寄存器 AX 中，并将立即数 0x2000 存储到 BX 中，
接着调用 SUB 指令，使寄存器 AX 中的值减去寄存器 BX 中的值。由于 SUB 的第二
个参数是 BX，寄存器位宽为 16，所以 SUB 认为这是一次 16 位减法运算。如果在减
法运算中产生借位操作，则 CF 置位并跳转到 CF_SET16 分支，并将立即数 1 存储到 
BX 寄存器中。如果减法运算中未产生借位运算，则 CF 清零并跳转到 CF_CLEAR16 分
支，并将立即数 0 存储到寄存器 BX 中。最后将结果存储到 AX 寄存器中。

##### 32 位减法

源码中将立即数 0x100000 存储到寄存器 EAX 中，并将立即数 0x200000 存储到 EBX 
中，接着调用 SUB 指令，使寄存器 EAX 中的值减去寄存器 EBX 中的值。由于 SUB 的
第二个参数是 EBX，寄存器位宽为 32，所以 SUB 认为这是一次 32 位减法运算。如果
在减法运算中产生借位操作，则 CF 置位并跳转到 CF_SET17 分支，并将立即数 1 存
储到 BX 寄存器中。如果减法运算中未产生借位运算，则 CF 清零并跳转到 CF_CLEAR17 
分支，并将立即数 0 存储到寄存器 BX 中。最后将结果存储到 EAX 寄存器中。

#### 运行结果如下：

![Menuconfig7](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000066.png)

#### 运行分析：

SUB 指令支持 8/16/32 位减法，SUB 指令会根据第二个参数的位宽来判定减法操作
的情况，如下：

##### 8 位减法

源码中将立即数 0x1 存储到寄存器 AL 中，并将立即数 0x2 存储到 BL 中，接着调
用 SUB 指令，使寄存器 AL 中的值减去寄存器 BL 中的值。由于 SUB 的第二个参数
是 BL，寄存器位宽为 8，所以 SUB 认为这是一次 8 位减法运算，减法之后的结果为 
-1，产生了一次借位操作，CF 置位。CF 置位并跳转到 CF_SET15 分支，并将立即数 1 
存储到 BX 寄存器中。最后将结果存储到 AX 寄存器中为 0xffffff01。

##### 16 位减法

源码中将立即数 0x1000 存储到寄存器 AX 中，并将立即数 0x2000 存储到 BX 中，
接着调用 SUB 指令，使寄存器 AX 中的值减去寄存器 BX 中的值。由于 SUB 的第二
个参数是 BX，寄存器位宽为 16，所以 SUB 认为这是一次 16 位减法运算,减法运算之
后的结果为 0xffff1000，产生了借位，CF 置位。 CF 置位并跳转到 CF_SET16 分支，
并将立即数 1 存储到 BX 寄存器中。最后将结果存储到 AX 寄存器中为 0xffff1000。

##### 32 位减法

源码中将立即数 0x100000 存储到寄存器 EAX 中，并将立即数 0x200000 存储到 EBX 
中，接着调用 SUB 指令，使寄存器 EAX 中的值减去寄存器 EBX 中的值。由于 SUB 
的第二个参数是 EBX，寄存器位宽为 32，所以 SUB 认为这是一次 32 位减法运算。
加法运算之后值为 0x100000，产生了一次借位，CF 置位。CF 置位并跳转到 CF_SET17
 分支，并将立即数 1 存储到 BX 寄存器中。最后将结果存储到 EAX 寄存器中为 
0x100000。

#### 实践结论：

SUB 减法运算产生借位操作会置位 CF 标志位

## 运用场景分析

## 附录

[1. SUB 指令 Intel Architectures Software Developer's Manual: Combined Volumes: 2 Instruction Set Reference,A-Z-- Chapter 4 Instruction Set Reference,M-U: 4.3 Instruction(M-U) : SUB -- Subtract](https://software.intel.com/en-us/articles/intel-sdm)
[1. SBB 指令 Intel Architectures Software Developer's Manual: Combined Volumes: 2 Instruction Set Reference,A-Z-- Chapter 4 Instruction Set Reference,M-U: 4.3 Instruction(M-U) : SBB -- Integer Subtraction with borrow](https://software.intel.com/en-us/articles/intel-sdm)

[2. Intel Architectures Software Developer's Manual](https://github.com/BiscuitOS/Documentation/blob/master/Datasheet/Intel-IA32_DevelopmentManual.pdf)
