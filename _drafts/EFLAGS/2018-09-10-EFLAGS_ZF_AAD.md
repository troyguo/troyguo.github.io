---
layout: post
title:  "AAD ASCII 调整引起的 ZF 置位"
date:   2018-09-10 11:47:30 +0800
categories: [MMU]
excerpt: AAD ASCII 调整引起的 ZF 置位.
tags:
  - EFLAGS
  - ZF
---

## 原理


Intel X86 提供了 AAD 指令，该指令用于两个非压缩 BCD 除法运算之前，将未压缩
的 BCD 码进行调整，以得到有效的 BCD 码。其原理是将 AL 寄存器的值调整为原始
的 AL + (10 * AH). AH 寄存器的值调整为 0.

{% highlight ruby %}
AL = AL + (AX * 10)
AH = 0
{% endhighlight %}

如果调整之后的结果为零时，EFLAGS 寄存器的 ZF 值位。

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

选择 **ZF Zero flag (bit 6)**.

选择 **AAD ASCII adjust AX before division**.

![Menuconfig6](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000209.png)

运行实例代码，使用如下代码：

{% highlight ruby %}
cd BiscuitOS/kernel/linux_1.0.1.2/
make 
make start
{% endhighlight %}

![Menuconfig7](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000210.png)

## 源码分析

源码位置：

{% highlight ruby %}
BiscuitOS/kernel/linux_1.0.1.2/tools/demo/mmu/storage/register/EFLAGS/eflags.c
{% endhighlight %}

![Menuconfig8](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000211.png)

源码如上图，首先将立即数 0x0 存储到寄存器 AX 中，并将立即数 0x2 存储到寄
存器 BL 中，调用 AAD 指令，如果 PF 置位，即 AL 寄存器中的值为 0，则跳转到 
ZF_0S 分支，并将立即数 1 存储到寄存器 DX 中。如果 ZF 清零，也就是调整之后
的 AL寄存器的值不为 0，那么跳转到 ZF_0C 分支，并将立即数 0 存储到寄存器 
DX 中。最终将 DX 寄存器的值存储到 ZF 变量中，将 AAD 变换之后的 AX 寄存器存
储到 AX 变量中。

#### 运行结果如下：

![Menuconfig9](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000212.png)

#### 运行分析：

源码如上图，首先将立即数 0x0 存储到寄存器 AX 中，并将立即数 0x2 存储到寄
存器 BL 中，调用 AAD 指令，AX 寄存器的原始值为 0x0，此时将 AX 寄存器的值 
0x0 乘 10 再加上 AL 寄存器的值 0x0，最后将结果存储到 AL 寄存器中，为 0x0. 
由于 AL 寄存器的值为 0x0，所以 ZF 置位。 ZF 置位，则跳转到 ZF_0S 分支，并
将立即数 1 存储到寄存器 DX 中。

#### 实践结论：

AAD 调整未压缩 BCD 码会引起 ZF 置位.

## 运用场景分析

## 附录

[1. TEST 指令: Intel Architectures Software Developer's Manual: Combined Volumes: 2 Instruction Set Reference,M-U-- Chapter 4 Instruction Set Reference,M-U: 4.3 Instruction(M-U) : TEST -- Logical Compare](https://software.intel.com/en-us/articles/intel-sdm)

[2. Intel Architectures Software Developer's Manual](https://github.com/BiscuitOS/Documentation/blob/master/Datasheet/Intel-IA32_DevelopmentManual.pdf)
