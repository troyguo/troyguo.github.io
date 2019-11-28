---
layout: post
title:  "ARPL 段 RPL 域修改引起的 ZF 置位"
date:   2018-09-14 12:15:30 +0800
categories: [MMU]
excerpt: ARPL 段 RPL 域修改引起的 ZF 置位.
tags:
  - EFLAGS
  - ZF
---

## 原理

Intel X86 提供了 ARPL 指令，该指令用于比较两个段选择子的 RPL 域。如果源段选
择子的 RPL 域值小于目的段选择子的 RPL 域值，则 ZF 置位，并将源选择子的 RPL 
域修改为目的段选择子的 RPL 域值；反之如果源段选择子的 RPL 域值大于或等于目的
段选择子的 RPL 域值，则 ZF 清零.

## 实践

BiscuitOS 提供了 ARPL 相关的实例代码，开发者可以使用如下命令：

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

选择 **ARPL    Adjust PRL Field of segment selector**.

![Menuconfig6](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000302.png)

运行实例代码，使用如下代码：

{% highlight ruby %}
cd BiscuitOS/kernel/linux_1.0.1.2/
make 
make start
{% endhighlight %}

![Menuconfig7](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000303.png)

## 源码分析

源码位置：

{% highlight ruby %}
BiscuitOS/kernel/linux_1.0.1.2/tools/demo/mmu/storage/register/EFLAGS/eflags.c
{% endhighlight %}

![Menuconfig8](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000304.png)

源码如上图，首先将立即数 0x1 存储到寄存器 CX 里面，然后将 ES 寄存器的值存入
寄存器 AX 中，并将 AX 寄存器的值存储到 AX 变量中，以此获得原始的 ES 段选择子
的值。调用 ARPL 指令将 CX 寄存器的值与 AX 寄存器的值对比。如果 CX 寄存器的值
大于 AX 寄存器的值（此时 CX 寄存器的值是目的段选择子的 RPL 域值，AX 寄存器是
源段选择子的 RPL 域值），那么 ZF 置位，然后将 AX 寄存器的值修改为 CX 寄存器
对应的值，；反之如果 CX 寄存器的值小于或等于 AX 寄存器的值，那么 ZF 清零。如
果 ZF 置位。则跳转到 ZF_SN 分支，并将立即数 1 存储到 DX 寄存器中；反之如果 
ZF 清零，则跳转到 ZF_CN 分支，并将立即数 0 存储到 DX 寄存器中。最后将 DX 寄
存器的值存储到 ZF 变量中，并且将 AX 寄存器的值存储到 BX 变量中。

#### 运行结果如下：

![Menuconfig9](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000305.png)

#### 运行分析：

首先将立即数 0x1 存储到寄存器 CX 里面，然后将 ES 寄存器的值存入寄存器 AX 中，
并将 AX 寄存器的值存储到 AX 变量中，以此获得原始的 ES 段选择子的值，所以  ES 
段寄存器的初始域值为 0x0。调用 ARPL 指令将 CX 寄存器的值与 AX 寄存器的值对比。
此时 CX 寄存器的值是目的段选择子的 RPL 域值为 0x1，AX 寄存器是源段选择子的 
RPL 域值为 0，所以 AX 寄存器的值小于 CX 寄存器的值，则 ZF 置位，然后将 AX 寄
存器的值修改为 CX 寄存器对应的值，此时 AX 寄存器的值为 0x1。 ZF 置位。则跳转
到 ZF_SN 分支，并将立即数 1 存储到 DX 寄存器中。最后将 DX 寄存器的值 0x1 存
储到 ZF 变量中，并且将 AX 寄存器的值 0x1 存储到 BX 变量中。

#### 实践结论：

ARPL 指令比较两个段选择子的 RPL 域。如果源段选择子的 RPL 域值小于目的段选择
子的 RPL 域值，则 ZF 置位，并将源选择子的 RPL 域修改为目的段选择子的 RPL 域
值；反之如果源段选择子的 RPL 域值大于或等于目的段选择子的 RPL 域值，则 ZF 
清零，

## 运用场景分析

## 附录

[1. ARPL 指令: Intel Architectures Software Developer's Manual: Combined Volumes: 3 Instruction Set Reference,A-L-- Chapter 3 Instruction Set Reference,A-L: 4.3 Instruction(A-L) : ARPL -- Adjust PRL Filed of Segment Selector](https://software.intel.com/en-us/articles/intel-sdm)

[2. Intel Architectures Software Developer's Manual](https://github.com/BiscuitOS/Documentation/blob/master/Datasheet/Intel-IA32_DevelopmentManual.pdf)
