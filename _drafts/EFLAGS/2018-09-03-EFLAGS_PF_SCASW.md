---
layout: post
title:  "SCASW 字符中查找指定字引起的 PF 置位"
date:   2018-09-03 17:56:30 +0800
categories: [MMU]
excerpt: SCASW 字符中查找指定字引起的 PF 置位.
tags:
  - EFLAGS
  - PF
---

## 原理

Intel X86 提供了 SCASW 指令，该指令用于在字符串中查找指定的字首次出现的位置，
SCASW 指令会将 AX 寄存器中的字和 EDI 指向的字符串进行比较，SCASW 指令常常和 
REPNE 指令配合使用，以此循环对比字符串中的字。每次字做对比就是两个字之间的减
法操作，相减的结果的 LSB 最低有效字节会影响 PF 标志位。如果 LSB 字节中含有偶
数个 1， 则 PF 置位；反之含有奇数个 1，则 PF 清零。

## 实践

BiscuitOS 提供了 SCASW 相关的实例代码，开发者可以使用如下命令：

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

选择 **SCASW Scan string in word**.

![Menuconfig6](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000206.png)

运行实例代码，使用如下代码：

{% highlight ruby %}
cd BiscuitOS/kernel/linux_1.0.1.2/
make 
make start
{% endhighlight %}

![Menuconfig7](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000166.png)

## 源码分析

源码位置：

{% highlight ruby %}
BiscuitOS/kernel/linux_1.0.1.2/tools/demo/mmu/storage/register/EFLAGS/eflags.c
{% endhighlight %}

![Menuconfig8](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000167.png)

源码如上图，首先将字符串 “Hello World”的地址存储到 EDI 寄存器中，再将字 Wo 
存储到 AX 寄存器中，最后将立即数 15 存储到 CX 寄存器中，表示查找字符的最大
次数。调用 CLD 指令让 EDI 每次增加 2. SCASW 指令配合 REPNE 指令使用，表示 
SCASW 每次执行后，如果对比的字符不相等，那么继续对比，使 EDI 加 2，然后 CX 
减一。当 CX 减到 0 时停止对比。对比过程中，如果找到相同的字也停止对比，对比
的结果会影响 EFLAGS 的值。如果 PF 置位，则跳转到 PF_SN 分支，并将立即数 1 存
储到 DX 寄存器中。如果 PF 未置位，则跳转到 PF_CN 分支，并将立即数 0 存储到 
DX 寄存器中。最终将 DX 寄存器的值存储到 PF 变量中，将 CX 寄存器的值存储到变
量 AX 中。

#### 运行结果如下：

![Menuconfig9](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000168.png)

#### 运行分析：

首先将字符串 “Hello World”的地址存储到 EDI 寄存器中，再将字 Wo 存储到 AX 寄
存器中，最后将立即数 15 存储到 CX 寄存器中，表示查找字符的最大次数为 15 次，
当查找超过 15 次表示没有找到。调用 CLD 指令让 EDI 每次增加 2. SCASB 指令配
合 REPNE 指令使用，表示 SCASW 每次执行后，如果对比的字不相等，那么继续对比，
使 EDI 加 2，然后 CX 减一。当 CX 减到 0 时停止对比。对比过程中，如果找到相同
的字也停止对比，对比的结果会影响 EFLAGS 的值。查找过程如下：

{% highlight ruby %}
第一次查找： He 与 Wo 不符合
第二次查找： ll 与 Wo 不符合
第三次查找：  o  与 Wo 不符合
第四次查找： Wo 与 Wo 符合, 找到
{% endhighlight %}

从上面分析可以看出，SCASW 指令找到第四次才第一次找到特定的字。此时 CX 并未
减到 0，所以是一次正确的匹配到字。由于查找的过程就是用 AX 寄存器的值去见 
EDI 指向的字，每单找到指定字时候，两个值相见为 0，结果 0 中含有偶数个 1，
则 PF 也置位。PF 置位，则跳转到 PF_SN 分支，并将立即数 1 存储到 DX 寄存器
中。CX 依次递减了四次，最后将 DX 寄存器的值 1 存储到 PF 变量中。将 CX 寄存
器中的值 4 存储到 AX 变量中。

#### 实践结论：

SCASW 指令在查找字过程中会影响 PF 的置位

## 运用场景分析

## 附录

[1. SCASW 指令: Intel Architectures Software Developer's Manual: Combined Volumes: 2 Instruction Set Reference,M-U-- Chapter 4 Instruction Set Reference,M-U: 4.3 Instruction(M-U) : SCASW -- Scan String](https://software.intel.com/en-us/articles/intel-sdm)

[2. Intel Architectures Software Developer's Manual](https://github.com/BiscuitOS/Documentation/blob/master/Datasheet/Intel-IA32_DevelopmentManual.pdf)
