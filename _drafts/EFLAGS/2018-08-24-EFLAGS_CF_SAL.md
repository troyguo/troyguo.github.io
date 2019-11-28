---
layout: post
title:  "SAL 算术左移引起的 CF 置位"
date:   2018-08-24 15:20:30 +0800
categories: [MMU]
excerpt: SAL 算术左移引起的 CF 置位.
tags:
  - EFLAGS
  - CF
---

## 原理

Intel X86 提供了 SAL 指令，该指令用于算术左移，SAL 将 MSB (最高有效位) 
移动到 CF 标志位，以此引起 CF 置位或清零。

## 实践

BiscuitOS 提供了 SAL 相关的实例代码，开发者可以使用如下命令：

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

选择 **CF    Carry Flag(bit 0)**.

选择 **SAL   Shift arithmetic left**.

![Menuconfig6](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000079.png)

运行实例代码，使用如下代码：

{% highlight ruby %}
cd BiscuitOS/kernel/linux_1.0.1.2/
make 
make start
{% endhighlight %}

![Menuconfig7](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000080.png)
## 源码分析

源码位置：

{% highlight ruby %}
BiscuitOS/kernel/linux_1.0.1.2/tools/demo/mmu/storage/register/EFLAGS/eflags.c
{% endhighlight %}

![Menuconfig7](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000081.png)

源码如上图，根据 SAL 指令第二个参数的类型分作三种情况

##### 8 位算术左移

将立即数 0x80 存储到 AL 寄存器中，将立即数 0x1 存储到 CL 寄存器，调用 SAL 
指令将 AL 寄存器中的值算术左移，移动的次数存储在 CL 寄存器中。如果执行 SAL 
之后，CF 置位，那么跳转到 CF_SET24 分支，并将立即数 1 存储到 BX 寄存器中；
如果 CF 清零，那么跳转到 CF_CLEAR24 分支，并将立即数 0 存储到寄存器 BX 中。
最后将 AX 寄存器中值存储到变量 AX 中，寄存器 BX 的值存储到变量 CF 中。

##### 16 位算术左移

将立即数 0x8000 存储到 AX 寄存器中，将立即数 0x1 存储到 CL 寄存器，调用 SAL 
指令将 AX 寄存器中的值算术左移，移动的次数存储在 CL 寄存器中。如果执行 SAL 
之后，CF 置位，那么跳转到 CF_SET25 分支，并将立即数 1 存储到 BX 寄存器中；
如果 CF 清零，那么跳转到 CF_CLEAR25 分支，并将立即数 0 存储到寄存器 BX 中。
最后将 AX 寄存器中值存储到变量 AX 中，寄存器 BX 的值存储到变量 CF 中。

##### 32 位算术左移

将立即数 0x80000000 存储到 EAX 寄存器中，将立即数 0x1 存储到 CL 寄存器，
调用 SAL 指令将 EAX 寄存器中的值算术左移，移动的次数存储在 CL 寄存器中。
如果执行 SAL 之后，CF 置位，那么跳转到 CF_SET26 分支，并将立即数 1 存储到 
BX 寄存器中；如果 CF 清零，那么跳转到 CF_CLEAR26 分支，并将立即数 0 存储到
寄存器 BX 中。最后将 EAX 寄存器中值存储到变量 EAX 中，寄存器 BX 的值存储
到变量 CF 中。

#### 运行结果如下：

![Menuconfig7](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000082.png)

#### 运行分析：

根据 SAL 指令第二个参数的类型分作三种情况

##### 8 位算术右移

将立即数 0x80 存储到 AL 寄存器中，将立即数 0x1 存储到 CL 寄存器，调用 SAL 
指令将 AL 寄存器中的值算术左移，移动的次数存储在 CL 寄存器中。此时 CL 寄存
器的值为 1，所以向做一次算术左移。由于 AL 寄存器 MSB 的值为 1，所以右移一位
之后，MSB 的值存储到 CF 标志位上，CF 此时的值为 1. CF 置位跳转到 CF_SET24 并
将立即数 1 存储到 BX 寄存器，最终 BX 寄存器的值存储到变量 CF 中，寄存器 AL 
的值存储到变量 AX 中，此时为 0x0。

##### 16 位算术右移

将立即数 0x8000 存储到 AX 寄存器中，将立即数 0x1 存储到 CL 寄存器，调用 
SAL 指令将 AX 寄存器中的值算术左移，移动的次数存储在 CL 寄存器中。此时 CL 
寄存器的值为 1，所以向左做一次算术右移。由于 AX 寄存器 MSB 的值为 1，所以左
移一位之后，MSB 的值存储到 CF 标志位上，CF 此时的值为 1. CF 置位跳转到 
CF_SET25 并将立即数 1 存储到 BX 寄存器，最终 BX 寄存器的值存储到变量 CF 中，
寄存器 AX 的值存储到变量 AX 中，此时为 0x0。

##### 32 位算术右移

将立即数 0x80000000 存储到 EAX 寄存器中，将立即数 0x1 存储到 CL 寄存器，调用
 SAL 指令将 EAX 寄存器中的值算术左移，移动的次数存储在 CL 寄存器中。此时 CL
寄存器的值为 1，所以向右做一次算术左移。由于 EAX 寄存器 MSB 的值为 1，所以左
移一位之后，MSB 的值存储到 CF 标志位上，CF 此时的值为 1. CF 置位跳转到 
CF_SET26 并将立即数 1 存储到 BX 寄存器，最终 BX 寄存器的值存储到变量 CF 中，
寄存器 EAX 的值存储到变量 EAX 中，此时为 0x0。

#### 实践结论：

SAL 算术左移操作会对 CF 的置位产生影响。

## 运用场景分析

## 附录

[1. SAL 指令: Intel Architectures Software Developer's Manual: Combined Volumes: 2 Instruction Set Reference,A-Z-- Chapter 4 Instruction Set Reference,M-U: 4.3 Instruction(M-U) : SAL/SAR/SHL/SHR -- Shift](https://software.intel.com/en-us/articles/intel-sdm)

[2. Intel Architectures Software Developer's Manual](https://github.com/BiscuitOS/Documentation/blob/master/Datasheet/Intel-IA32_DevelopmentManual.pdf)
