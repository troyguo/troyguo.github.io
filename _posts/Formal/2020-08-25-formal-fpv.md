---
typora-root-url: ..\..



---

# <center>Formal property verification  </center>

[TOC]

# 序言

本文是读《Formal Verification An Essential Toolkit for Modern VLSI Design》第四章，做的一些笔记。



# WHAT IS FPV?  

简单来讲，FPV是用来数学方法来证明，RTL符合用户指定的一堆property（一般是SVA书写）。FPV工具，基于输入的约束，用数学方法分析RTL逻辑执行的所有可能的空间。与Simulation不同，FPV会同时check当前约束所有合法的值。

FPV的输入一般有：

- RTL
- 待证明的property： assertions, cover points
- 约束： assumptions, clock , reset

FPV输出一般有：

- 证明了的property：proven assertion,  unreachable cover points.
- 对于fail的assertion，或者reachable cover point ，都有一个对应的波形来显示failure或者reachbility
- bounded or inconclusive proofs：不确定证明的一些assertion和coverpooint



![](/images/formal/fpv/4_1.PNG)

图4.2展示了一个FPV执行空间的例子:

- RTL所有可能的空间：最外层表示RTL design里所有可能的状态空间
- Reset state:  起始状态空间
- Reachable states:  从reset state开始，实际所有可能达到的状态空间
- Assumptions:  每个assumption对design的behavior做些约束，把一些状态空间排除掉
- Assertions:  每个assertion语句用来检查design的非法状态
- cover points:  每个cover point定义了一些我们期望达到的好的状态空间。

![](/images/formal/fpv/4_2.PNG)



# FPV 类型

- Design exercise FPV 

  主要用于design刚开始的时候，无需创建simulation testbench，用formal来验证基本功能。

- Bug hunting FPV  

  主要用于一些复杂的block，除了simulation，同时搭建formal环境来分析一些corner case

- Full proof FPV  

  针对复杂或者风险较大的模块，创建property保证设计符合sepc

- Application-specific FPV  

  一些特定的应用场景，如总线协议、控制寄存器、连线等



# EXAMPLE FOR THIS CHAPTER: COMBINATION LOCK  

这里举的例子是一个简单智能组合锁，输入特定序列才能打开。

![](/images/formal/fpv/4_3.PNG)

![](/images/formal/fpv/4_4.PNG)



代码和环境可以从[github](https://github.com/troyguo/formal_study/ch4)上下载，脚本运行在jaspergold上。



## 创建cover points

**FPV最先应该先写的就是cover points**,  太多的人先关注assertion，这是极其错误的想法。FPV最应该关注的就是coverrage。

cover points的创建依赖于实际的design，可能但不局限于：

- Spec文档的某些数据流：某些时序
- input/output 可以assume一些感兴趣的值
- 状态机
- FIFO/Queue empty/Full
- Error type

本例比较简单，主要关注以下几点：

- 锁是否能打开或关闭

  ```verilog
  c1: cover property (open 55 0);
  c2: cover property (open 55 1);
  ```

- 每次输入数字（组合）都touch到

  ```
  generate
  	for (genvar i=0; i<4; i++) begin
          for (genvar j=0; j<10; j++) begin
              c3: cover property (digits[i][j] == 1);
          end
  	end
  endgenerate
  ```

  

## 创建Assumption

接下来要约束输入的behavior， 把FPV约束在我们感兴趣并且合法的状态空间。有一点需要强调，assumptiion一般不太可能一次就写全，基本上都是不断迭代的一个过程。FPV大部分时间其实都是花在看波形，debug，修改assumption上。最开始的时候，先写一些简单的assumption，后面再一步步追加。

本例中，我们输入的四个数字是one-hot，分别代表输入的数字是0-9.所以asumption比较简单:

```
generate for (genvar i = 0; i < 4; i++) begin
	a1: assume property ($onehot(digits[i]));
end
```

如果我们稍微看看代码，其实能发现还有另一个assumption需要加入。不过这里暂时不加，正好待会演示下debug过程。



## 创建Assertion

加入assertion来检查一些非法状态，本例中最明显的就是：输入特定数字组合，才能打开锁。这里条件必须是充分必要条件。输入特定数字组合，一定能打开锁。并且如果能打开锁，那么输入的一定是这个数字组合.

```
 sequence correct_combo_entered;
        (digits == COMBO_FIRST_PART) ##1
        (digits == COMBO_SECOND_PART) ##1
        (digits == COMBO_THIRD_PART);
    endsequence


open_good: assert property( correct_combo_entered |=> open);

open_ok2: assert property(open |-> $past(digits, 3) == COMBO_FIRST_PART);
open_ok1: assert property(open |-> $past(digits, 2) == COMBO_SECOND_PART);
open_ok0: assert property(open |-> $past(digits, 1) == COMBO_THIRD_PART);

```

注意：assertion语句尽量简单，这样比较方面debug。比如open_ok0, open_ok1, open_ok2这三个assertion如果合并成一个来写，咋一看很直观，但debug起来就不是那么方便了。

## Clock/Reset

还有两个很重要的点，就是clock和reset，比较简单不再赘述。直接在japsergold里面设置

```
clock clk

```



## Run verification

RTL和脚本都准备好了，吃进jaspergold，开始跑起来， 在japsergold的命令行里source下脚本：

```
source jg.tcl
```



### check coverage

跑完之前，先check coverage。 这里需要注意是的是，不仅要看coverage是不touch到了，更重要的是看下波形以及Bound Cycle.  

![](/images/formal/fpv/4_5.PNG)



我们先看c1 这个coverage， open = 0， 一个cycle touch到，没什么问题，reset过后它就是0

![](/images/formal/fpv/4_6.PNG)



再来看来c2， open=1两个cycle就touch到了，明显不对。我们打开波形追下，看看为什么open=1。原来override=1，相当于插入了一把物理钥匙开锁。

![](/images/formal/fpv/4_7.PNG)



这里有两个该法：第一种是修改c2的coverage，把overide=0与进去。另一种是加一个assumption，我们只关注override=0的情形。采用何种方法取决你关注的点，这里我们不关心override=1的情形，选择采用第二种方法，追加一个assertion：

```
// Assumption added after first stage of debug
    `ifdef PAST_FIRST_DEBUG_STAGE
    Page99_fix1:  assume property (override == 0);
   `endif
```



修改完成之后，我们把22行的宏打开:

```
`define PAST_FIRST_DEBUG_STAGE 1
```



重新跑一遍，这时c2的bound变成4了

![](/images/formal/fpv/4_8.PNG)



但我们还是需要再check下波形，看看是否符合我们的期望。

![](/images/formal/fpv/4_9.PNG)



表面看，已经达到我们的预期了。深入看下，发现这个open的组合不太对。当然可以深入去debug。这里先放过。再看看其他cover point，因为比较简单，就不截图了。



### Check assertion

检查完cover point，我们来看看assertion。几个assertion全fail了，

![](/images/formal/fpv/4_10.PNG)

以open_good为例，看到0123这个组合打不开锁。这里肯定有问题，要不是数字组合不对，要么是代码有bug。需要追下root cause

![](/images/formal/fpv/4_11.PNG)



我们修改下数字组合，把23行的宏开启，重新跑一遍

```
`define PAST_SECOND_DEBUG_STAGE 1
```



发现open_good这个assertion pass了，也就是这个组合可以开锁。但是另外三个open_okx依然Fail，意味着其他组合也能将锁打开。我们的RTL依然有bug，继续继续debug。

![](/images/formal/fpv/4_12.PNG)

经过对着三个assertion的debug，我们发现了bug，修复（把24行的宏打开）

```
`define PAST_THIRD_DEBUG_STAGE 1
```



重新跑下，终于都过了!

![](/images/formal/fpv/4_13.PNG)



# 总结

1. 先关注cover point而后才是assertion，不要本末倒置
2. 一步步加assumption，不断迭代.