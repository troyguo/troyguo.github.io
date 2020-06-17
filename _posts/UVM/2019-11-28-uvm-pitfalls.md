# <center>Pitfall of UVM</center>

总结些UVM使用过程中遇到的一些坑



## 1. start() vs `uvm_do

start() task的声明：

```
 virtual task start (uvm_sequencer_base sequencer,
                      uvm_sequence_base parent_sequence = null,
                      int this_priority = -1,
                      bit call_pre_post = 1);
```

而`uvm_do宏的定义如下：

```
`define uvm_do_on_pri_with(SEQ_OR_ITEM, SEQR, PRIORITY, CONSTRAINTS) \
  begin \
  uvm_sequence_base __seq; \
  `uvm_create_on(SEQ_OR_ITEM, SEQR) \
  if (!$cast(__seq,SEQ_OR_ITEM)) start_item(SEQ_OR_ITEM, PRIORITY);\
  if ((__seq == null || !__seq.do_not_randomize) && !SEQ_OR_ITEM.randomize() with CONSTRAINTS ) begin \
    `uvm_warning("RNDFLD", "Randomization failed in uvm_do_with action") \
  end\
  if (!$cast(__seq,SEQ_OR_ITEM)) finish_item(SEQ_OR_ITEM, PRIORITY); \
  else __seq.start(SEQR, this, PRIORITY, 0); \
  end

```

注意，**call_pre_post**这个参数，在start()默认为1，而uvm_do宏里默认为0. 所以二者最大的差别就在于调用uvm_do启动sequence的时候，不会调用sequence的pre_body和post_body；如果想在pre_body()和post_body()里做些操作的话，请用start(). 否则会踩坑。。。。
