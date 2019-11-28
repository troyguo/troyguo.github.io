













> PAGE_OFFSET: DRAM 起始物理地址对应的虚拟地址，即第一个物理地址对应的虚拟地址。
>
> PHYS_OFFSET: DRAM 起始物理地址，即第一个物理地址。
>
> vmalloc_limit: VMALLOC 分配器可分配的最小物理地址。
>
> arm_lowmem_limit: 低端内存终止物理地址
>
> high_memory: 高端内存起始虚拟地址
>
> KERNEL_START: 内核代码段开始的虚拟地址
>
> KERNEL_END: 内核代码段结束的虚拟地址
>
> _stext: 内核代码段开始的虚拟地址
>
> _end: 内核代码段结束的虚拟地址
>
> swapper_pg_dir: 全局页目录对应的虚拟地址
>
> min_low_pfn: DRAM 起始物理地址的页帧号
>
> max_low_pfn: MEMBLOCK 可以分配的最大物理地址的页帧号
>
> max_pfn: DRAM 终止物理地址的页帧号。
