---
layout: post
title:  "SHR 逻辑右移引起的 CF 置位"
date:   2018-08-24 15:32:30 +0800
categories: [MMU]
excerpt: SHR 逻辑右移引起的 CF 置位.
tags:
  - EFLAGS
  - CF
---

## 原理

Intel X86 提供了 SHR 指令，该指令用于逻辑右移，SHR 将 LSB (最低有效位) 
移动到 CF 标志位，以此引起 CF 置位或清零。

## 实践

BiscuitOS 提供了 SHR 相关的实例代码，开发者可以使用如下命令：

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

选择 **SHR   Shift logical right**.

![Menuconfig6](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000075.png)

运行实例代码，使用如下代码：

{% highlight ruby %}
cd BiscuitOS/kernel/linux_1.0.1.2/
make 
make start
{% endhighlight %}

![Menuconfig7](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000076.png)

## 源码分析

源码位置：

{% highlight ruby %}
BiscuitOS/kernel/linux_1.0.1.2/tools/demo/mmu/storage/register/EFLAGS/eflags.c
{% endhighlight %}

![Menuconfig7](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000077.png)

源码如上图，根据 SHR 指令第一个参数的类型分作三种情况

##### 8 位逻辑右移

将立即数 0x3 存储到 AL 寄存器中，将立即数 0x1 存储到 CL 寄存器，调用 SHR 
指令，将 AL 寄存器中的值右移，右移的位数存储在 CL 寄存器中。由于 SHR 的第
一个参数是 AL 寄存器，位宽为 8 位，所以 SHR 认为这是一次 8 位逻辑右移运算，
运算之后的值存储在 AL 寄存器中。如果 CF 置位，则跳转到 CF_SET21 分支中，
并将立即数存储到 BX 寄存器中。如果 CF 清零，则跳转到 CF_CLEAR21 分支，并将
立即数 0 存储到 BX 寄存器中。最终寄存器 AX 的值存储到变量 AX 中。

##### 16 位逻辑右移

将立即数 0x101 存储到 AX 寄存器中，将立即数 0x01 存储到 CL 寄存器，调用 SHR 
指令，将 AX 寄存器中的值右移，右移的位数存储在 CL 寄存器中。由于 SHR 的第一
个参数是 AX 寄存器，位宽为 16 位，所以 SHR 认为这是一次 16 位逻辑右移运算，
运算之后的值存储在 AX 寄存器中。如果 CF 置位，则跳转到 CF_SET22 分支中，并将
立即数存储到 BX 寄存器中。如果 CF 清零，则跳转到 CF_CLEAR22 分支，并将立即
数 0 存储到 BX 寄存器中。最终寄存器 AX 的值存储到变量 AX 中。

##### 32 位逻辑右移

将立即数 0x1000001 存储到 EAX 寄存器中，将立即数 0x01 存储到 CL 寄存器，调
用 SHR 指令，将 EAX 寄存器中的值右移，右移的位数存储在 CL 寄存器中。由于 
SHR 的第一个参数是 EAX 寄存器，位宽为 32 位，所以 SHL 认为这是一次 32 位逻
辑右移运算，运算之后的值存储在 EAX 寄存器中。如果 CF 置位，则跳转到 
CF_SET23 分支中，并将立即数存储到 BX 寄存器中。如果 CF 清零，则跳转到 
CF_CLEAR23 分支，并将立即数 0 存储到 BX 寄存器中。最终寄存器 EAX 的值存储到
变量 EAX 中。

#### 运行结果如下：

![Menuconfig7](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/MMU000078.png)

#### 运行分析：

根据 SHL 指令第一个参数的类型分作三种情况

##### 8 位逻辑右移

将立即数 0x3 存储到 AL 寄存器中，将立即数 0x01 存储到 CL 寄存器，调用 SHR 
指令，将 AL 寄存器中的值右移，右移的位数存储在 CL 寄存器中。由于 SHR 的第
一个参数是 AL 寄存器，位宽为 8 位，所以 SHL 认为这是一次 8 位逻辑右移运算，
运算之后的值存储在 AL 寄存器中。0x3 向右移位一位之后变成 0x1， 产生了一个
进位，CF 置位。CF 置位，则跳转到 CF_SET21 分支中，并将立即数存储到 BX 寄存
器中。最终寄存器 AX 的值存储到变量 AX 中为 0x1。

###### 16 位逻辑右移

将立即数 0x101 存储到 AX 寄存器中，将立即数 0x01 存储到 CL 寄存器，调用 
SHR 指令，将 AX 寄存器中的值右移，右移的位数存储在 CL 寄存器中。由于 SHR 
的第一个参数是 AX 寄存器，位宽为 16 位，所以 SHL 认为这是一次 16 位逻辑右移
运算，运算之后的值存储在 AX 寄存器中 。0x101 向右一位之后变成 0x80， 产生
一个进位，CF 置位。 CF 置位，则跳转到 CF_SET122 分支中，并将立即数存储到 
BX 寄存器中。最终寄存器 AX 的值存储到变量 AX 中为 0x80。

##### 32 位逻辑右移

将立即数 0x100001 存储到 EAX 寄存器中，将立即数 0x01 存储到 CL 寄存器，调
用 SHR 指令，将 EAX 寄存器中的值右移，右移的位数存储在 CL 寄存器中。由于 
SHR 的第一个参数是 EAX 寄存器，位宽为 32 位，所以 SHL 认为这是一次 32 位逻
辑右移运算，运算之后的值存储在 EAX 寄存器中。0x1000001 向右移位一位为 
0x800000，产生一次进位， CF 置位。 CF 置位，则跳转到 CF_SET23 分支中，并将
立即数存储到 BX 寄存器中。最终寄存器 EAX 的值存储到变量 EAX 中为 0x800000。


#### 实践结论：

SHR 逻辑右移会引起 CF 的置位。

## 运用场景分析

## 附录

[1. SHR 指令: Intel Architectures Software Developer's Manual: Combined Volumes: 2 Instruction Set Reference,A-Z-- Chapter 4 Instruction Set Reference,M-U: 4.3 Instruction(M-U) : SAL/SAR/SHL/SHR -- Shift](https://software.intel.com/en-us/articles/intel-sdm)

[2. Intel Architectures Software Developer's Manual](https://github.com/BiscuitOS/Documentation/blob/master/Datasheet/Intel-IA32_DevelopmentManual.pdf)
