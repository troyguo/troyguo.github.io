---
layout: post
title:  "CMPSD 字符串按双字比较运算引起的 PF 置位"
date:   2018-08-30 14:21:30 +0800
categories: [MMU]
excerpt: CMPSD 字符串按双字比较运算引起的 PF 置位.
tags:
  - EFLAGS
  - PF
---

## 原理

Intel X86 提供了 CMPSD 指令，该指令用于字符串按双字比较运算，字符串每个双字
的比较都会影响 EFLAGS 寄存器的标志位。当两个双字之间的差值的 LSB (Least 
significant Byte 最低有效字节) 含有偶数个 1 则 PF 置位，反之 LSB 含有奇数个 
1 则 PF 清零。

## 实践

BiscuitOS 提供了 CMPSD 相关的实例代码，开发者可以使用如下命令：

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

选择 **CMPSD Compare string operands in double-word**.

![Menuconfig6](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000189.png)

运行实例代码，使用如下代码：

{% highlight ruby %}
cd BiscuitOS/kernel/linux_1.0.1.2/
make 
make start
{% endhighlight %}

![Menuconfig7](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000127.png)

## 源码分析

源码位置：

{% highlight ruby %}
BiscuitOS/kernel/linux_1.0.1.2/tools/demo/mmu/storage/register/EFLAGS/eflags.c
{% endhighlight %}

![Menuconfig8](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000128.png)

源码如上图，将字符串 “HellEWorld”的地址存储到 ESI 寄存器中，再将字符串 
“HellBiscuitOS”的地址存储到 EDI 寄存器中，再将立即数 10 存储到 CX 寄存器
中。CX 寄存器中值表示对比的次数。调用 CLD 指令清除 EFLAGS 寄存器中的 DF 清
零，以此 ESI 寄存器和 EDI 寄存器在 REP 指令循环过程中产生递增操作。接着调
用 REPZ 和 CMPSD 指令，两个指令联合起来达到循环对比的效果，当这两个指令执
行之后，ESI 和 EDI 寄存器指向的字符串会从各自字符串的第一个字节开始，依次
递增 4 个字节进行比较，直到遇到第一个不相等的双字时候停止循环， CX 寄存器
为 0 时，停止对比。如果最后一次比较，四个字节的差值的最低字节含有偶数个 1 
则 PF 置位，跳转到 PF_SA 分支，并将立即数 1 存储到 DX 寄存器；如果四个字节
的差值的最低字节含有奇数个 1 则 PF 清零，跳转到 PF_CA 分支，并将立即数 0 存
储到 DX 寄存器。最后将 CX 寄存器的值存储到 AX 变量中，将 DX 寄存器的值存储
到 PF 变量中。

#### 运行结果如下：

![Menuconfig9](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000129.png)

#### 运行分析：

将字符串 “HellEWorld”的地址存储到 ESI 寄存器中，再将字符串 
“HellBiscuitOS” 的地址存储到 EDI 寄存器中，再将立即数 10 存储到 CX 寄
存器中。CX 寄存器中值表示对比的次数。调用 CLD 指令清除 EFLAGS 寄存器中的 
DF 清零，以此 ESI 寄存器和 EDI 寄存器在 REP 指令循环过程中产生 4 字节的递
增操作。接着调用 REPZ 和 CMPSD 指令，两个指令联合起来达到循环对比的效果，
当这两个指令执行之后，ESI 和 EDI 寄存器指向的字符串会从各自字符串的第一个
字节开始，依次递增四个字节进行比较，直到遇到第一个不相等的双字时候停止循
环， CX 寄存器为 0 时，停止对比。对比过程如下：

{% highlight ruby %}
第一次比较： Hell 和 Hell
第二次比较： EWor 和 Bisc
{% endhighlight %}

从上面的对比可以看出，第 2 次对比的时候，ESI 对应的字符串 EWor 和 EDI 对
应的字符串 Bisc 不同，此时，两个字符串按字节相减，即 
‘E’- ‘B’= 0x69 - 0x66 = 0x3. 结果最低有效字节为 0x3， 含有 2 个 1，
所以 PF 置位。 PF 置位，跳转到 PF_SA 分支，并将立即数 1 存储到 DX 寄存器。
最后将 CX 寄存器的值存储到 AX 变量中，将 DX 寄存器的值 1 存储到 PF 变量中。

#### 实践结论：

调用 CMPSD 进行字符串按双字比较运算时，只要四个字节之间的差值的最低 8 位
含有偶数个 1 则 PF 置位，反之含有奇数个 1 则 PF 清零。

## 运用场景分析

## 附录

[1. CMPSD 指令: Intel Architectures Software Developer's Manual: Combined Volumes: 2 Instruction Set Reference,A-Z-- Chapter 3 Instruction Set Reference,A-L: 3.2 Instruction(A-L) : CMP -- Compare two operands in Double-word](https://software.intel.com/en-us/articles/intel-sdm)

[2. Intel Architectures Software Developer's Manual](https://github.com/BiscuitOS/Documentation/blob/master/Datasheet/Intel-IA32_DevelopmentManual.pdf)
