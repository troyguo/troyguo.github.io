---
layout: post
title:  "AAD ASCII 调整引起的 PF 置位"
date:   2018-08-28 18:55:30 +0800
categories: [MMU]
excerpt: AAD ASCII 调整引起的 PF 置位.
tags:
  - EFLAGS
  - PF
---

## 原理

Intel X86 提供了 AAD 指令，该指令用于两个非压缩 BCD 除法运算之前，将未压缩
的 BCD 码进行调整，以得到有效的 BCD 码。其原理是将 AL 寄存器的值调整为原始
的 AL + (10 * AH). AH 寄存器的值调整为 0.

{% highlight ruby %}
AL = AL + (AX * 10)
AH = 0
{% endhighlight %}

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

选择 **PF    Parity Flag(bit 2)**.

选择 **AAD   ASCII adjust AX before division**.

![Menuconfig6](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000181.png)

运行实例代码，使用如下代码：

{% highlight ruby %}
cd BiscuitOS/kernel/linux_1.0.1.2/
make 
make start
{% endhighlight %}

![Menuconfig7](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000103.png)

## 源码分析

源码位置：

{% highlight ruby %}
BiscuitOS/kernel/linux_1.0.1.2/tools/demo/mmu/storage/register/EFLAGS/eflags.c
{% endhighlight %}

![Menuconfig7](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000104.png)

源码如上图，首先将立即数 0x0503 存储到寄存器 AX 中，并将立即数 0xa 存储到
寄存器 BL 中，调用 AAD 指令，如果 PF 置位，即 AL 寄存器中 1 的个数为偶数，
则跳转到 PF_SET0 分支，并将立即数 1 存储到寄存器 DX 中。如果 PF 清零，也就
是调整之后的 AL 寄存器包含奇数个 1，那么跳转到 PF_CLEAR0 分支，并将立即数 0 
存储到寄存器 DX 中。接着执行除法运算，运算之后的商存储到 AL 寄存器，余数存
储到 AH 寄存器中。最终将 DX 寄存器的值存储到 PF 变量中，AX 寄存器的值存储
到 BX 变量中，将 AAD 变换之后的 AX 寄存器存储到 AX 变量中。

#### 运行结果如下：

![Menuconfig7](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000105.png)

#### 运行分析：

源码如上图，首先将立即数 0x0503 存储到寄存器 AX 中，并将立即数 0xa 存储到
寄存器 BL 中，调用 AAD 指令，AX 寄存器的原始值为 0x0503，此时将 AX 寄存器
的值 0x05 乘 10 再加上 AL 寄存器的值 0x3，最后将结果存储到 AL 寄存器中，为 
0x35. 由于 AL 寄存器的值为 0x35，总共含有 4 个 1，所以 PF 置位。 PF 置位，
则跳转到 PF_SET0 分支，并将立即数 1 存储到寄存器 DX 中。接着调用 DIV 指令
进行除法运算，由于除数存储在 BL 寄存器中，为 8 位，所以被除数为 16 位，存储
在 AX 寄存器，此时除法为：

{% highlight ruby %}
AX = AX / BL = 0x35 / 0xa = 53 / 10 = 5 ... 3
{% endhighlight %}

所以 8 位除法，商存储到 AL 寄存器，余数存储到 AH 寄存器，所以结果商 5 余数 
3，此时 AX 寄存器的值为 0x0305.

#### 实践结论：

AAD 调整未压缩 BCD 码会引起 PF 置位。

## 运用场景分析

## 附录

[1. AAD 指令: Intel Architectures Software Developer's Manual: Combined Volumes: 2 Instruction Set Reference,A-Z-- Chapter 3 Instruction Set Reference,A-L: 3.2 Instruction(A-L) : AAD -- ASCII Adjust AX before division](https://software.intel.com/en-us/articles/intel-sdm)

[2. Intel Architectures Software Developer's Manual](https://github.com/BiscuitOS/Documentation/blob/master/Datasheet/Intel-IA32_DevelopmentManual.pdf)

[3. Packed BCD and Unpacked BCD](https://github.com/BuddyZhang1/Kernel/tree/master/tools/demo/Data/Base/BCD)
