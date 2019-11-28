---
layout: post
title:  "AAA 未压缩 BCD 码进位运算引起的 CF 置位"
date:   2018-08-27 13:50:30 +0800
categories: [MMU]
excerpt: AAA 未压缩 BCD 码进位运算引起的 CF 置位.
tags:
  - EFLAGS
  - CF
---

## 原理

Intel X86 提供了 AAA 指令，该指令用于将两个数之和转换成一个未压缩的 BCD 码。
AAA 指令中，两个数的和存储在 AL 寄存器中，AAA 指令将 AL 的值转换成一个未压
缩的 BCD 码。由未压缩的 BCD 码原理可知，一个字节的低四位表示一个十进制数，
其范围从 0 到 9. 每当两个数之和存储到 AL 寄存器之后，其值如果大于 9，那么在
执行 AAA 指令之后，CF 就会置位，以此告诉系统需要进位操作。

## 实践

BiscuitOS 提供了 AAA 相关的实例代码，开发者可以使用如下命令：

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

选择 **AAA   Carry on unpacked BCD**.

![Menuconfig6](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000011.png)

运行实例代码，使用如下代码：

{% highlight ruby %}
cd BiscuitOS/kernel/linux_1.0.1.2/
make 
make start
{% endhighlight %}

![Menuconfig7](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000012.png)

## 源码分析

源码位置：

{% highlight ruby %}
BiscuitOS/kernel/linux_1.0.1.2/tools/demo/mmu/storage/register/EFLAGS/eflags.c
{% endhighlight %}

![Menuconfig7](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000013.png)

源码如上图，将立即数 9 存储到 AX 寄存器中，调用 add 指令使 AL 寄存器增加 1，
接着调用 AAA 命令对 AL 寄存器里面的值进行未压缩 BCD 码调整。调整之后，如果 
CF 置位就调转到 CF_SET0 分支，该分支将 1 存储到 EBX 寄存器里。如果 CF 未置位，
则跳转到 CF_CLEAR0 分支，该分支将立即数 0 存储到 EBX 寄存器里。最后将 EBX 寄
存器里的值存储到 CF 变量里，并且将 EAX 寄存器值存储到 AX 变量里

#### 运行结果如下：

![Menuconfig7](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000014.png)

#### 运行分析：

寄存器 AX 初始值存入 9，然后调用 add 指令之后，AL 寄存器的值变为 10. 接着调
用 AAA 指令，将 AL 的内容转换成未压缩的 BCD 码。由于此时 AL 的值大于 9， 需
要进位，故 CF 被值位。AAA 指令将 CF 值位之后，将进位的 1 存储到 AH 寄存器
里，最后 AX 的值有 0x9 变成了 0x10. 由于 CF 值位，BX 寄存器值为 1， 变量 CF 
也为 1.

#### 实践结论：

两个未压缩的 BCD 码进行 AAA 指令之后，产生进位操作将会置位 CF

## 运用场景分析

## 附录

[1. AAA 指令: Intel Architectures Software Developer's Manual: Combined Volumes: 2 Instruction Set Reference,A-Z-- Chapter 3 Instruction Set Reference,A-L: 3.2 Instruction(A-L) : AAA -- ASCII Adjust After Addition](https://software.intel.com/en-us/articles/intel-sdm)

[2. Intel Architectures Software Developer's Manual](https://github.com/BiscuitOS/Documentation/blob/master/Datasheet/Intel-IA32_DevelopmentManual.pdf)

[3. Packed BCD and Unpacked BCD](https://github.com/BuddyZhang1/Kernel/tree/master/tools/demo/Data/Base/BCD)
