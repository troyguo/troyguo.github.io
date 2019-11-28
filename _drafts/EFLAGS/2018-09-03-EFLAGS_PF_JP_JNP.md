---
layout: post
title:  "JP/JNP  PF 标志位引起的跳转"
date:   2018-09-03 21:50:30 +0800
categories: [MMU]
excerpt: JP/JNP  PF 标志位引起的跳转.
tags:
  - EFLAGS
  - PF
---

## 原理

Intel X86 提供了 JP 和 JNP 指令，这对指令用于 PF 标志位引起的跳转，JP 指
令用于 PF 标志位置位的时候跳转，JNP 用于 PF 标志位清零的时候跳转。

## 实践

BiscuitOS 提供了 JP 和 JNP 相关的实例代码，开发者可以使用如下命令：

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

选择 **PF    Parity flag (bit 2)**.

选择 **JP    Jump short if parity**.

选择 **JNP   Jump short if not parity**.

![Menuconfig6](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000194.png)

运行实例代码，使用如下代码：

{% highlight ruby %}
cd BiscuitOS/kernel/linux_1.0.1.2/
make 
make start
{% endhighlight %}

![Menuconfig7](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000175.png)

## 源码分析

源码位置：

{% highlight ruby %}
BiscuitOS/kernel/linux_1.0.1.2/tools/demo/mmu/storage/register/EFLAGS/eflags.c
{% endhighlight %}

![Menuconfig8](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000176.png)

源码如上图，首先将立即数 0x7 存储到寄存器 AL 中，再将立即数 0x3 存储到寄存
器 BL 中。调用 TEST 指令让 AL 寄存器中的值与 BL 寄存器中的值对应的值按位比
较，其中只有同为 1 的位能置位，其余情况都是清零，结果存储到 AL 寄存器中。如
果此时 AL 中含有偶数个 1，则 PF 置位，跳转到 PF_SQ 分支，并将立即数 1 存储
到寄存器 DX 里；反之如果 AL 寄存器中含有奇数个 1，则 PF 清零，跳转到 PF_CQ 
分支执行，并将立即数 0 存储到寄存器 DX 里。最后将 DX 寄存器的值存储到 PF 变
量里，并将运算结果从 AX 寄存器里存储到 AX 变量里。

#### 运行结果如下：

![Menuconfig9](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000177.png)

#### 运行分析：

首先将立即数 0x7 存储到寄存器 AL 中，再将立即数 0x3 存储到寄存器 BL 中。调
用 TEST 指令让 AL 寄存器中的值与 BL 寄存器中的值对应的值按位比较，其中只有
同为 1 的位能置位，其余情况都是清零.

{% highlight ruby %}
0x7 & 0x3 = 0x3
{% endhighlight %}

结果 0x3 存储到 AL 寄存器中。此时 AL 中含有 2 个 1，则 PF 置位，跳转到 
PF_SQ 分支，并将立即数 1 存储到寄存器 DX 里。最后将 DX 寄存器的值 1 存储到 
PF 变量里，并将运算结果从 AX 寄存器里存储到 AX 变量里。

#### 实践结论：

JP 在 PF 置位的情况下跳转，JNP 在 PF 清零的情况下跳转.

## 运用场景分析

## 附录

[1. JP/JNP 指令: Intel Architectures Software Developer's Manual: Combined Volumes: 2 Instruction Set Reference,M-U-- Chapter 4 Instruction Set Reference,M-U: 4.3 Instruction(M-U) : Jcc -- Jump](https://software.intel.com/en-us/articles/intel-sdm)

[2. Intel Architectures Software Developer's Manual](https://github.com/BiscuitOS/Documentation/blob/master/Datasheet/Intel-IA32_DevelopmentManual.pdf)
