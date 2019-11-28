---
layout: post
title:  "CMPXCHG 对比并交换操作引起的 ZF 置位"
date:   2018-09-17 12:18:30 +0800
categories: [MMU]
excerpt: CMPXCHG 对比并交换操作引起的 ZF 置位.
tags:
  - EFLAGS
  - ZF
---

## 原理

Intel X86 提供了 CMPXCHG 指令，该指令用于将目的操作数和 AL， AX， 或 EAX 寄
存器内的值作对比，如果目的操作数与 AL/AX/EAX 寄存器的值相同，则 ZF 置位，并
将源操作数加载到目的操作数；反之，如果目的操作数的值与 AL/AX/EAX 寄存器内的
值不等，则将目的操作数的值存储到 AL/AX/EAX 寄存器中，ZF 清零。

## 实践

BiscuitOS 提供了 CMPXCHG 相关的实例代码，开发者可以使用如下命令：

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

选择 **CMPXCHG    Compare and exchange**.

![Menuconfig6](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000314.png)

运行实例代码，使用如下代码：

{% highlight ruby %}
cd BiscuitOS/kernel/linux_1.0.1.2/
make 
make start
{% endhighlight %}

![Menuconfig7](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000315.png)

## 源码分析

源码位置：

{% highlight ruby %}
BiscuitOS/kernel/linux_1.0.1.2/tools/demo/mmu/storage/register/EFLAGS/eflags.c
{% endhighlight %}

![Menuconfig8](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000316.png)

源码如上图，首先将 DS 变量中的值存储到寄存器 AX 中，将 ES 变量中的值存储到 
BX 寄存器中，再将 GS 寄存器中的值存储到寄存器 CX 中。调用 CMPXCHG 指令，此
时 CX 寄存器作为源操作数，BX 寄存器作为目的操作数。如果 BX 寄存器的值与 AX 
寄存器的值相等，CMPXCHG 指令会将源操作数 CX 寄存器中的值存储到目的操作数 BX 
寄存器中，并且 ZF 置位，程序跳转到 ZF_SQ/ZF_SR 分支，并将立即数 1 存储到 DX 
寄存器中；反之如果 BX 寄存器的值与 AX 寄存器的值不相等，CMPXCHG 指令会将目的
操作数 BX 寄存器的值存储到 AX 寄存器中，并将 ZF 清零，程序跳转到 ZF_CQ/ZF_CR 
分支，并将立即数 0 存储到 DX 寄存器中。最后将 DX 寄存器的值存储到 ZF 变量中，
将 AX 寄存器的值存储到 AX 变量中，将 BX 寄存器的值存储到 BX 变量中，最后将 
CX 寄存器中的值存储到 CX 变量中。

#### 运行结果如下：

![Menuconfig9](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000317.png)

#### 运行分析：

通过源码分析，我们分作两种情况，如下：

###### 情况 1

将 0x200 存储到 AX 寄存器中，将 0x200 也存储到 BX 寄存器中，将 0x9f 存储到寄
存器 CX 中。根据上面的分析，AX 寄存器的值和 BX 寄存器的值相同， CMPXCHG 指令
将 CX 寄存器的值存储到 BX 寄存器中，此时 ZF 置位，立即数 1 存储到 DX 寄存器
中。最后将上述寄存器都打印出来，BX 寄存器的值确实变成了 CX 寄存器中的值。

###### 情况 2

将 0x200 存储到 AX 寄存器中，将 0x201 也存储到 BX 寄存器中，将 0x9f 存储到寄
存器 CX 中。根据上面的分析，AX 寄存器的值和 BX 寄存器的值不相同， CMPXCHG 指
令将 BX 寄存器的值存储到 AX 寄存器中，此时 ZF 清零，立即数 0 存储到 DX 寄存器
中。最后将上述寄存器都打印出来，AX 寄存器的值确实变成了 BX 寄存器中的值。

#### 实践结论：

CMPXCHG 指令会引起 ZF 置位

## 运用场景分析

## 附录

[1. CMPXCHG 指令: Intel Architectures Software Developer's Manual: Combined Volumes: 3 Instruction Set Reference,A-L-- Chapter 3 Instruction Set Reference,A-L: 4.3 Instruction(A-L) : CMPXCHG -- Compare and exchange](https://software.intel.com/en-us/articles/intel-sdm)

[2. Intel Architectures Software Developer's Manual](https://github.com/BiscuitOS/Documentation/blob/master/Datasheet/Intel-IA32_DevelopmentManual.pdf)
