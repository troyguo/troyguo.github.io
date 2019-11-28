---
layout: post
title:  "AAD ASCII 调整引起的 SF 置位"
date:   2018-10-15 11:24:30 +0800
categories: [MMU]
excerpt: AAD ASCII 调整引起的 SF 置位.
tags:
  - EFLAGS
  - SF
---

## 原理

Intel X86 提供了 AAD 指令，该指令用于两个非压缩 BCD 除法运算之前，将未压缩
的 BCD 码进行调整，以得到有效的 BCD 码。其原理是将 AL 寄存器的值调整为原始
的 AL + (10 * AH). AH 寄存器的值调整为 0.

{% highlight ruby %}
AL = AL + (AX * 10)
AH = 0
{% endhighlight %}

如果调整之后的结果最高有效位为 1 时，EFLAGS 寄存器的 SF 值位。

## 实践

BiscuitOS 提供了 AAD 相关的实例代码，开发者可以使用如下命令：

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

选择 **AAD ASCII adjust AX before division**

![Menuconfig6](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000354.png)

运行实例代码，使用如下代码：

{% highlight ruby %}
cd BiscuitOS/kernel/linux_1.0.1.2/
make 
make start
{% endhighlight %}

![Menuconfig7](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000355.png)

## 源码分析

源码位置：

{% highlight ruby %}
BiscuitOS/kernel/linux_1.0.1.2/tools/demo/mmu/storage/register/EFLAGS/eflags.c
{% endhighlight %}

![Menuconfig8](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000356.png)

源码如上图，再进行一次未压缩 BCD 码的除法运算，将未压缩的 BCD 码 0x0909 存储
到 AX 寄存器中作为被除数，未压缩 BCD 码 0x0909 代表十进制数 99，再将立即数 1 
存储到 BX 寄存器中作为除数。接着调用 AAD 指令进行 BCD 码转换，具体将 AX 寄存
器中的未压缩码转换为十六进制数。如果 AAD 指令执行之后 EFLAGS 寄存器的 SF 置
位，那么 DL 寄存器的值就为 1. 调用 DIV 指令进行除法运算，运算的结果存储到 
AX 寄存器中。最后将 DX 寄存器的值存储到 SF 变量中，并将 AX 寄存器中的值存储
到 AX 变量中。

#### 运行结果如下：

![Menuconfig9](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000357.png)

#### 运行分析：

未压缩的 BCD 码 0x0909 存储到 AX 寄存器，在调用 AAD 寄存器进行转换之后的值
为 0x63。由于 AX 寄存器的最高有效位不为 1，所以 SF 清零。AX 寄存器中的值与 
BX 寄存器中的值相除之后，值为 0x63.

#### 实践结论：

AAD 调整未压缩 BCD 码会引起 SF 置位。

## 运用场景分析

## 附录

[1. AAD 指令: Intel Architectures Software Developer's Manual: Combined Volumes: 2 Instruction Set Reference,A-Z-- Chapter 3 Instruction Set Reference,A-L: 3.2 Instruction(A-L) : AAD -- ASCII Adjust AX before division](https://software.intel.com/en-us/articles/intel-sdm)

[2. Intel Architectures Software Developer's Manual](https://github.com/BiscuitOS/Documentation/blob/master/Datasheet/Intel-IA32_DevelopmentManual.pdf)

[3. Packed BCD and Unpacked BCD](https://github.com/BuddyZhang1/Kernel/tree/master/tools/demo/Data/Base/BCD)
