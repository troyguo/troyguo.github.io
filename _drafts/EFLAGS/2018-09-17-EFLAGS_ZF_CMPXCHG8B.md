---
layout: post
title:  "CMPXCHG8B 对比 64 位数并交换操作引起的 ZF 置位"
date:   2018-09-17 14:10:30 +0800
categories: [MMU]
excerpt: CMPXCHG8B 对比 64 位数并交换操作引起的 ZF 置位.
tags:
  - EFLAGS
  - ZF
---

## 原理

Intel X86 提供了 CMPXCHG8B 指令，该指令用于将 64 位目的操作数和 EDX：EAX 
寄存器内的 64 位值作对比，如果目的操作数与 EDX：EAX 寄存器的值相同，则 ZF 
置位，并将 ECX：EBX 寄存器的 64 位值加载到目的操作数；反之，如果目的操作数
的值与 EDX：EAX 寄存器内的值不等，则将目的操作数的值存储到 EDX：EAX 寄存器
中，ZF 清零。

## 实践

BiscuitOS 提供了 CMPXCHG8B 相关的实例代码，开发者可以使用如下命令：

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

![Menuconfig6](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000318.png)

运行实例代码，使用如下代码：

{% highlight ruby %}
cd BiscuitOS/kernel/linux_1.0.1.2/
make 
make start
{% endhighlight %}

![Menuconfig7](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000319.png)

## 源码分析

源码位置：

{% highlight ruby %}
BiscuitOS/kernel/linux_1.0.1.2/tools/demo/mmu/storage/register/EFLAGS/eflags.c
{% endhighlight %}

![Menuconfig8](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000320.png)

源码如上图，首先构建一个 64 位变量，存储到 dest 变量里，将 64 位立即数 
0x2030405060708090 存储到 EDX：EAX 组成的 64 位寄存器中，接着将 64 位立即
数 0x1122334455667788 存储到 ECX：EBX 组成的 64 位寄存器中。调用 CMPXCHG8B 
指令，dest 作为其目的操作数。进行对比，如果 dest 对应的 64 位值与 EDX：EAX 
组成的 64 位值相同，则 ZF 置位，并将 ECX：EBX 寄存器组成的 64 位值存储到 
dest 位置。ZF 置位则跳转到 ZF_SS/ZF_ST 分支，并将立即数 1 存储到寄存器 DI 
里；反之，如果 dest 对应的 64 位值与 EDX：EAX 组成的 64 位值不相同，则 ZF 
清零，则将 dest 对应的 64 位值存储到 EDX：EAX 组成的 64 位寄存器中。最后将 
DI 寄存器的值存储到 ZF 变量里，将 EDX 寄存器的值存储到 EDX 变量里，将 EAX 
寄存器的值存储到 EAX 变量里，将 EBX 寄存器的值存储到 EBX 变量里，将 ECX 寄
存器的值存储到 ECX 变量里，将 EDX 寄存器的值存储到 EDX 变量里。

#### 运行结果如下：

![Menuconfig9](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000321.png)

#### 运行分析：

通过源码分析，我们分作两种情况，如下：

###### 情况一

EDX：EAX 组成的寄存器存储 64 位值 0x2030405060708090, ECX:EBX 组成的寄存器
存储 64 位值为 0x1122334455667788，CMPXCHG8B 目的操作数为 0x2030405060708090 
与 EDX：EAX 组成的 64 位值相等，所以调用 CMPXCHG8B 指令之后，ECX：EBX 寄存器
组成的 64 位值会存储到 CMPXCHG8B 对应的地址上，此时 ZF 置位，程序跳转到 
ZF_SS 分支，并将立即数 1 存储到 DI 寄存器中。最终 DI 寄存器的值存储到  ZF 
变量里。

###### 情况一

EDX：EAX 组成的寄存器存储 64 位值 0x2030405060708090, ECX:EBX 组成的寄存器
存储 64 位值为 0x1122334455667788，CMPXCHG8B 目的操作数为 0x2030405060708099 
与 EDX：EAX 组成的 64 位值不相等，所以调用 CMPXCHG8B 指令之后，目的操作数的
值存储到 EDX：EAX 组成的 64 位地址上，此时 ZF 清零，程序跳转到 ZF_CT 分支，
并将立即数 0 存储到 DI 寄存器中。最终 DI 寄存器的值存储到  ZF 变量里。

#### 实践结论：

CMPXCHG8B 指令会引起 ZF 置位

## 运用场景分析

## 附录

[1. CMPXCHG8B 指令: Intel Architectures Software Developer's Manual: Combined Volumes: 3 Instruction Set Reference,A-L-- Chapter 3 Instruction Set Reference,A-L: 4.3 Instruction(A-L) : CMPXCHG8B -- Compare and exchange Byte](https://software.intel.com/en-us/articles/intel-sdm)

[2. Intel Architectures Software Developer's Manual](https://github.com/BiscuitOS/Documentation/blob/master/Datasheet/Intel-IA32_DevelopmentManual.pdf)
