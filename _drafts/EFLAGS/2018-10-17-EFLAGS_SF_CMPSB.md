---
layout: post
title:  "CMPSB 字符串按字节比较运算引起的 SF 置位"
date:   2018-10-17 09:41:30 +0800
categories: [MMU]
excerpt: CMPSB 字符串按字节比较运算引起的 SF 置位.
tags:
  - EFLAGS
  - SF
---

## 原理

Intel X86 提供了 CMPSB 指令，该指令用于字符串按字节比较运算，字符串每个字节
的比较都会影响 EFLAGS 寄存器的标志位。当两个字节之间的差值的最高有效位为 1，
则 SF 置位；反之  SF 清零。

## 实践

BiscuitOS 提供了 CMPSB 相关的实例代码，开发者可以使用如下命令：

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

选择 **CMPSB   Compare string operands in byte**

![Menuconfig6](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000379.png)

运行实例代码，使用如下代码：

{% highlight ruby %}
cd BiscuitOS/kernel/linux_1.0.1.2/
make 
make start
{% endhighlight %}

![Menuconfig7](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000380.png)

## 源码分析

源码位置：

{% highlight ruby %}
BiscuitOS/kernel/linux_1.0.1.2/tools/demo/mmu/storage/register/EFLAGS/eflags.c
{% endhighlight %}

![Menuconfig8](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000381.png)

CMPSB 指令用于两个字符串按字节比较。首先将字符串 “Hello World”的首地址存储到
寄存器 ESI 中，再将字符串 “Hello a BiscuitOS”的首地址存储到寄存器 EDI 中，然
后将要对比的次数 8 存储到寄存器 CX 中，最后将立即数 0 存储到寄存器 DX 中。
CMPSB 与 CLD 和 REPZ 指令配合实现循环比较字符串。如果两个字符的字节相同，那么
继续循环比较；如果两个字符串中遇到不相等的字符，那么停止比较。如果比较的结果
的最高有效位为 1，那么 EFLAGS 寄存器的 SF 标志位置位。SF 置位之后，SETS 指令
就将 DL 寄存器值设置为 1. 每比较一次， CX 寄存器中的值减一，如果 CX 的值变为
零，那么对比结束。最后将 DL 寄存器中的值存储到 SF 变量中，并将 CX 寄存器的值
存储到 BX 变量中。

#### 运行结果如下：

![Menuconfig9](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000382.png)

#### 运行分析：

将字符串 “Hello World”的地址存储到 ESI 寄存器中，再将字符串 
“Hello a BiscuitOS”的地址存储到 EDI 寄存器中，再将立即数 8 存储到 CX 寄存器
中。CX 寄存器中值表示对比的次数。调用 CLD 指令清除 EFLAGS 寄存器中的 DF 清
零，以是 ESI 寄存器和 EDI 寄存器在 REP 指令循环过程中产生递增操作。接着调用 
REPZ 和 CMPSB 指令，两个指令联合起来达到循环对比的效果，当这两个指令执行之后，
ESI 和 EDI 寄存器指向的字符串会从各自字符串的第一个字节开始，依次递增进行比
较，直到遇到第一个不相等的字节时候停止循环， CX 寄存器为 0 时，停止对比。对
比过程如下：

{% highlight ruby %}
第一次比较： H 和 H
第二次比较： e 和 e
第三次比较： l 和 l
第四次比较： l 和 l
第五次比较： o 和 o
第六次对比：   和
第七次对比： W 和 a
{% endhighlight %}

从上面的对比可以看出，第七次对比的时候，ESI 对应的字符串字符 W 和 EDI 对应
的字符串 a 不同，此时，两个字符串相减，即 ‘W’- ‘a’= 0x57 - 0x61 = 0xec. 结果的
最高有效位为 1。 SF 置位，那么 SETS 将 DL 寄存器的值设置为 1. 

#### 实践结论：

调用 CMPSB 进行字符串按字节比较运算时，只要两个字节之间的差值的最高有效位置
位，则 SF 置位，反之 SF 清零。

## 运用场景分析

## 附录

[1. CMPSB 指令:Intel Architectures Software Developer's Manual: Combined Volumes: 2 Instruction Set Reference,A-Z-- Chapter 3 Instruction Set Reference,A-L: 3.2 Instruction(A-L) : CMPSB -- Compare two operands in byte](https://software.intel.com/en-us/articles/intel-sdm)

[2. Intel Architectures Software Developer's Manual](https://github.com/BiscuitOS/Documentation/blob/master/Datasheet/Intel-IA32_DevelopmentManual.pdf)
