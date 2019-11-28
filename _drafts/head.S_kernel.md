---
layout:             post
title:              "实践 ARM Linux 5.0 内核之内核第一行代码"
date:               2019-04-20 08:41:30 +0800
categories:         [MMU]
excerpt:            ARM Linux from first code.
tags:
  - MMU
---

> [GitHub Bootstrap ARM](https://github.com/BiscuitOS/Bootstrap_arm)
>
> Email: BuddyZhang1 <buddy.zhang@aliyun.com>
>
> Info: ARM 32 -- Linux 5.0

# 目录

> - [简介](#简介)
>
> - [实践](#实践)
>
> - [附录](#附录)

--------------------------------------------------------------
<span id="简介"></span>

![MMU](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/IND00000A.jpg)

# 简介


--------------------------------------------------------------
<span id="实践"></span>

![MMU](https://raw.githubusercontent.com/EmulateSpace/PictureSet/master/BiscuitOS/kernel/IND00000A.jpg)

# 实践

> - [vmlinux 入口：第一行运行的代码](#vmlinux first code)

### <span id="vmlinux first code">vmlinux 入口：第一行运行的代码</span>

内核源码经过编译汇编成目标文件，再通过链接脚本链接成可执行 ELF 文件 vmlinux。vmlinux
位于源码顶层目录，以及使用的链接脚本是 arch/arm/kernel/vmlinux.lds.S。首先开发者应该
找到 vmlinux 的入口地址，然后从入口地址开始调试内核。为了确定 vmlinux 内核的起始地址，
首先通过 vmlinux.lds.S 链接脚本进行分析。

##### vmlinux.lds.S

vmlinux.lds.S 用于说明内核源码的链接过程，通过链接脚本将所有目标文件链接成一个
ELF 文件，这个文件就是源码顶层目录的 vmlinux。通过分析 vmlinux 对内核的启动
和内存布局都有学习有一定帮助。vmlinux.lds.S 位于 arch/arm/kernel 目录下，经过
预处理，vmlinux.lds.S 会生成 vmlinux.lds。为了了解 ARM linux 的启动过程，需要
通过对链接脚本的分析，从而找到 vmlinux 的入口函数。具体分析如下：

{% highlight bash %}
/* SPDX-License-Identifier: GPL-2.0 */
/* ld script to make ARM Linux kernel
 * taken from the i386 version by Russell King
 * Written by Martin Mares <mj@atrey.karlin.mff.cuni.cz>
 */

#ifdef CONFIG_XIP_KERNEL
#include "vmlinux-xip.lds.S"
#else

#include <asm-generic/vmlinux.lds.h>
#include <asm/cache.h>
#include <asm/thread_info.h>
#include <asm/memory.h>
#include <asm/mpu.h>
#include <asm/page.h>
#include <asm/pgtable.h>

#include "vmlinux.lds.h"

OUTPUT_ARCH(arm)
ENTRY(stext)
{% endhighlight %}

首先 vmlinux.lds.S 起始处的代码如上，根据链接脚本语法，可以知道 OUTPUT_ARCH 关键字
指定了链接之后的输出文件的体系结构是 ARM。ENTRY 关键字指定了输出文件 vmlinux 的入口
地址是 stext, 因此开发者只需找到 stext 的定义就可以知道 vmlinux 的入口函数。接下来
的代码是：

{% highlight bash %}
SECTIONS
{
        /*
         * XXX: The linker does not define how output sections are
         * assigned to input sections when there are multiple statements
         * matching the same input section name.  There is no documented
         * order of matching.
         *
         * unwind exit sections must be discarded before the rest of the
         * unwind sections get included.
         */
        /DISCARD/ : {
                ARM_DISCARD
#ifndef CONFIG_SMP_ON_UP
                *(.alt.smp.init)
#endif
        }

        . = PAGE_OFFSET + TEXT_OFFSET;
        .head.text : {
                _text = .;
                HEAD_TEXT
        }
{% endhighlight %}

关键字 SECTIONS 定义了 vmlinux 内各个 section 的布局。其中关键 /DISCARD/ 定义
了 vmlinux 在生成过程了，将输入文件指定的段丢弃，这里不做过多讨论。接着链接脚本
指定了一下内存的地址，使当前地址指向了 "PAGE_OFFSET + TEXT_OFFSET", 这里先看看
两个宏的函数，首先是 TEXT_OFFSET, 其定义在 arch/arm/Makefile, 如下：

{% highlight bash %}
# Text offset. This list is sorted numerically by address in order to
# provide a means to avoid/resolve conflicts in multi-arch kernels.
textofs-y       := 0x00008000
# We don't want the htc bootloader to corrupt kernel during resume
textofs-$(CONFIG_PM_H1940)      := 0x00108000
# SA1111 DMA bug: we don't want the kernel to live in precious DMA-able memory
ifeq ($(CONFIG_ARCH_SA1100),y)
textofs-$(CONFIG_SA1111) := 0x00208000
endif
textofs-$(CONFIG_ARCH_MSM8X60) := 0x00208000
textofs-$(CONFIG_ARCH_MSM8960) := 0x00208000
textofs-$(CONFIG_ARCH_MESON) := 0x00208000
textofs-$(CONFIG_ARCH_AXXIA) := 0x00308000

# The byte offset of the kernel image in RAM from the start of RAM.
TEXT_OFFSET := $(textofs-y)
{% endhighlight %}

因此可以知道 TEXT_OFFSET 的含义就是内核镜像在 DRAM 内的偏移，从上面的定义来看，
默认情况下，内核镜像位于 DRAM 0x00008000 处。接着看一下 PAGE_OFFSET 的定义，
定义在 arch/arm/include/asm/memory.h 里，如下：

{% highlight bash %}
/* PAGE_OFFSET - the virtual address of the start of the kernel image */
#define PAGE_OFFSET             UL(CONFIG_PAGE_OFFSET)
{% endhighlight %}

从上面的定义可以知道，PAGE_OFFSET 用于指定内核镜像的起始虚拟地址。PAGE_OFFSET 的定
义与 CONFIG_PAGE_OFFSET 有关，该宏定义在 arch/arm/Kconfig 里，如下：

{% highlight bash %}
choice
        prompt "Memory split"
        depends on MMU
        default VMSPLIT_3G
        help
          Select the desired split between kernel and user memory.

          If you are not absolutely sure what you are doing, leave this
          option alone!

        config VMSPLIT_3G
                bool "3G/1G user/kernel split"
        config VMSPLIT_3G_OPT
                depends on !ARM_LPAE
                bool "3G/1G user/kernel split (for full 1G low memory)"
        config VMSPLIT_2G
                bool "2G/2G user/kernel split"
        config VMSPLIT_1G
                bool "1G/3G user/kernel split"

config PAGE_OFFSET
        hex
        default PHYS_OFFSET if !MMU
        default 0x40000000 if VMSPLIT_1G
        default 0x80000000 if VMSPLIT_2G
        default 0xB0000000 if VMSPLIT_3G_OPT
        default 0xC0000000
{% endhighlight %}

根据 CONFIG_PAGE_OFFSET 宏定义可以知道，其值与 MMU，VMSPLIT_1G, VMSPLIT_2G,
VMSPLIT_3G_OPT 的定义有关，这几个宏的定义如上。开发者可以在
BiscuitOS/output/linux-5.x-arm32/linux/linux/.config 中查看当前内核配置，其
本实践平台基于 vexpress 平台，使用的是 VMSPLIT_2G，所以 PAGE_OFFSET 的值为
0x8000000。

分析完上面两个宏的定义之后，再回到之前的链接脚本源码：

{% highlight bash %}
        . = PAGE_OFFSET + TEXT_OFFSET;
        .head.text : {
                _text = .;
                HEAD_TEXT
        }
{% endhighlight %}

将当前地址设置为 "PAGE_OFFSET + TEXT_OFFSET", 其含义就是内核镜像的起始虚拟地址
加上内核镜像在 DRAM 中的偏移。接着定义了一个输出段 .head.text, 段内容首先定义了
一个 _text 指向当前地址，然后将 HEAD_TEXT 加入到段内，HEAD_TEXT 的定义如下：

{% highlight bash %}
/* Section used for early init (in .S files) */
#define HEAD_TEXT  KEEP(*(.head.text))
{% endhighlight %}

HEAD_TEXT 的定义使用了 KEEP 关键字，其作用就是保留所有输入文件的 .head.text 段。
更多 KEEP 使用方法，请看：

> [LD scripts 关键字 -- KEEP](https://biscuitos.github.io/blog/LD-KEEP/)

从上面的定义可以知道，输出文件的 .head.text 段包含了所有输入文件的 .head.text 段，
因此可以知道内核镜像文件中，最前面位置的代码位于 .head.text 段中，vmlinux 的入口
函数 stext 也可能位于 .head.text 段中，因此在 arch/arm/kernel 目录下查找含有
.head.text 段和 stext 的位置。通过查找，在 arch/arm/kernel/head.S 文件中找到
stext 的定义，如下：

{% highlight bash %}
        .arm

        __HEAD
ENTRY(stext)
{% endhighlight %}

从这里虽然找到了 stext 的定义，但还需要确定 stext 是否位于 .head.text 段中，通过
上面的源码，查看 __HEAD 的定义，如下：

{% highlight bash %}
/* For assembly routines */
#define __HEAD          .section        ".head.text","ax"
{% endhighlight %}

因此，__HEAD 宏就是用于指定段属性为 ".head.text", 因此根据此前的分析，
arch/arcm/kernel/head.S 中的 stext 就是 vmlinux 的入口函数。因此，开发者可以从
 stext 处开始调试内核。开发者可以在 stext 处添加断点，然后 GDB 在线调试，调试
情况如下：

{% highlight bash %}
buddy@BDOS: BiscuitOS/output/linux-5.0-arm32$ BiscuitOS/output/linux-5.0-arm32/arm-linux-gnueabi/arm-linux-gnueabi/bin/arm-linux-gnueabi-gdb -x BiscuitOS/output/linux-5.0-arm32/package/gdb/gdb_Image
GNU gdb (Linaro_GDB-2019.02) 8.2.1.20190122-git
Copyright (C) 2018 Free Software Foundation, Inc.
License GPLv3+: GNU GPL version 3 or later <http://gnu.org/licenses/gpl.html>
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.
Type "show copying" and "show warranty" for details.
This GDB was configured as "--host=x86_64-unknown-linux-gnu --target=arm-linux-gnueabi".
Type "show configuration" for configuration details.
For bug reporting instructions, please see:
<http://www.gnu.org/software/gdb/bugs/>.
Find the GDB manual and other documentation resources online at:
    <http://www.gnu.org/software/gdb/documentation/>.

For help, type "help".
Type "apropos word" to search for commands related to "word".
warning: No executable has been specified and target does not support
determining executable automatically.  Try using the "file" command.
0x60000000 in ?? ()
add symbol table from file "/xspace/OpenSource/BiscuitOS/BiscuitOS/output/linux-5.0-arm32/linux/linux/vmlinux" at
	.text_addr = 0x60100000
	.head.text_addr = 0x60008000
	.rodata_addr = 0x60800000
(gdb) b stext
Breakpoint 1 at 0x60008000: file arch/arm/kernel/head.S, line 89.
(gdb) c
Continuing.

Breakpoint 1, stext () at arch/arm/kernel/head.S:89
89		bl	__hyp_stub_install
(gdb) info reg pc
pc             0x60008000          0x60008000 <stext>
(gdb)
{% endhighlight %}

从上面的调试可以看出，stext 确实是内核所在的物理起始地址，此时 pc 正好指向内核
解压之后的起始地址 0x60008000, 因此 arch/arm/kernel/head.S 目录下的内容就是
vmlinux 的入口函数 stext 所在的位置。接下来，开发者可以从这个文件开始，一步步
调试内核源码。

首先，开发者可以查看一下这部分代码的注释介绍，如下：

{% highlight bash %}
/*
 * Kernel startup entry point.
 * ---------------------------
 *
 * This is normally called from the decompressor code.  The requirements
 * are: MMU = off, D-cache = off, I-cache = dont care, r0 = 0,
 * r1 = machine nr, r2 = atags or dtb pointer.
 *
 * This code is mostly position independent, so if you link the kernel at
 * 0xc0008000, you call this at __pa(0xc0008000).
 *
 * See linux/arch/arm/tools/mach-types for the complete list of machine
 * numbers for r1.
 *
 * We're trying to keep crap to a minimum; DO NOT add any machine specific
 * crap here - that's what the boot loader (or in extreme, well justified
 * circumstances, zImage) is for.
 */
        .arm

        __HEAD
ENTRY(stext)
{% endhighlight %}

注释中说明了 stext 为内核启动的入口，当 zImage 解压完内核之后，这里就会被最先调用。
为了调用这个入口，MMU 必须关闭，D-cache 必须关闭，I-cache 无所谓，r0 必须为 0，
r1 必须存储体系相关的 ID，以及 r2 必须存储着 ATAG 或者 DTB 的指针。内核镜像的位置
通常都是独立的，如果需要将内核镜像的虚拟地址设置为 0xc0008000, 那么内核镜像的物理
地址可以通过 __pa(0xc0008000) 获得。r1 寄存器中包含了体系相关的 ID 信息，内核在
linux/arch/arm/tools/mach-types 文件中描述了 ID 对应的信息。
