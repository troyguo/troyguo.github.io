---
layout: post
title:  "SCASB 字符中查找指定字符引起的 ZF 置位"
date:   2018-09-12 11:48:30 +0800
categories: [MMU]
excerpt: SCASB 字符中查找指定字符引起的 ZF 置位.
tags:
  - EFLAGS
  - ZF
---

## 原理

Intel X86 提供了 SCASB 指令，该指令用于在字符串中查找指定的字符首次出现的
位置，SCASB 指令会将 AL 寄存器中的字符和 EDI 指向的字符串进行比较，SCASB 
指令常常和 REPNE 指令配合使用，以此循环对比字符串中的字符。每次字符做对比
就是两个字符之间的减法操作，相减的结果为零，则 ZF 置位；反之 ZF 清零。

## 实践

BiscuitOS 提供了 SCASB 相关的实例代码，开发者可以使用如下命令：

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

选择 **SCASB   Scan string in byte**.

![Menuconfig6](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000286.png)

运行实例代码，使用如下代码：

{% highlight ruby %}
cd BiscuitOS/kernel/linux_1.0.1.2/
make 
make start
{% endhighlight %}

![Menuconfig7](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000287.png)

## 源码分析

源码位置：

{% highlight ruby %}
BiscuitOS/kernel/linux_1.0.1.2/tools/demo/mmu/storage/register/EFLAGS/eflags.c
{% endhighlight %}

![Menuconfig8](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000288.png)

源码如上图，首先将字符串 “Hello World”的地址存储到 EDI 寄存器中，再将字符 d 
存储到 AL 寄存器中，最后将立即数 15 存储到 CX 寄存器中，表示查找字符的最大次
数。调用 CLD 指令让 EDI 每次增加 1. SCASB 指令配合 REPNE 指令使用，表示 
SCASB 每次执行后，如果对比的字符不相等，那么继续对比，使 EDI 加 1，然后 CX 
减一。当 CX 减到 0 时停止对比。对比过程中，如果找到相同的字符也停止对比，对
比的结果会影响 EFLAGS 的值。如果 ZF 置位，则跳转到 ZF_SJ 分支，并将立即数 1 
存储到 DX 寄存器中。如果 ZF 未置位，则跳转到 ZF_CJ 分支，并将立即数 0 存储
到 DX 寄存器中。最终将 DX 寄存器的值存储到 ZF 变量中，将 CX 寄存器的值存储到
变量 AX 中。

#### 运行结果如下：

![Menuconfig9](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000289.png)

#### 运行分析：

首先将字符串 “Hello World”的地址存储到 EDI 寄存器中，再将字符 d 存储到 AL 
寄存器中，最后将立即数 15 存储到 CX 寄存器中，表示查找字符的最大次数为 15 
次，当查找超过 15 次表示没有找到。调用 CLD 指令让 EDI 每次增加 1. SCASB 指
令配合 REPNE 指令使用，表示 SCASB 每次执行后，如果对比的字符不相等，那么继
续对比，使 EDI 加 1，然后 CX 减一。当 CX 减到 0 时停止对比。对比过程中，如
果找到相同的字符也停止对比，对比的结果会影响 EFLAGS 的值。查找过程如下：

{% highlight ruby %}
第一次查找： H 与 d 不符合
第二次查找： e 与 d 不符合
第三次查找： l 与 d 不符合
第四次查找： l 与 d 不符合
第五次查找： o 与 d 不符合
第六次查找：   与 d 不符合
第七次查找： W 与 d 不符合
第八次查找： o 与 d 不符合
第九次查找： r 与 d 不符合
第十次查找： l 与 d 不符合
第十一次查找： d 与 d 符合, 找到
{% endhighlight %}

从上面分析可以看出，SCASB 指令找到第十一次才第一次找到特定的字符。此时 CX 并
未减到 0，所以是一次正确的匹配到字符。由于查找的过程就是用 AL 寄存器的值去
见 EDI 指向的字符，每单找到指定字符时候，两个值相见为 0，结果为零，则 ZF 也
置位。ZF 置位，则跳转到 ZF_SJ 分支，并将立即数 1 存储到 DX 寄存器中。CX 依次
递减了十一次，最后将 DX 寄存器的值 1 存储到 ZF 变量中。将 CX 寄存器中的值 4 
存储到 AX 变量中。

#### 实践结论：

SCASB 指令在查找字符过程中会影响 ZF 的置位。

## 运用场景分析

## 附录

[1. SCASB 指令: Intel Architectures Software Developer's Manual: Combined Volumes: 2 Instruction Set Reference,M-U-- Chapter 4 Instruction Set Reference,M-U: 4.3 Instruction(M-U) : SCASB -- Scan string](https://software.intel.com/en-us/articles/intel-sdm)

[2. Intel Architectures Software Developer's Manual](https://github.com/BiscuitOS/Documentation/blob/master/Datasheet/Intel-IA32_DevelopmentManual.pdf)
