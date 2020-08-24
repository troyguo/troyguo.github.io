---
typora-root-url: ..\..


---

# <center>Formal SVA</center>

[TOC]

# 序言

本文是读《Formal Verification An Essential Toolkit for Modern VLSI Design》第三章，做的一些笔记。



# 一个简单的例子  

本章以一个arbiter 作为例子来阐述一些概念，这个冲裁器有4个request来自不同的agent，req的每个bit表示相应的仲裁请求发起。gnt信号每个bit表示相应的请求被允许。同时，这里还有一个opcode输入，用来override正常的请求，例如强制某个agent获得grant，或者让所有的gnt都无效一段时间。error信号表示一些错误的输入序列或者错误的opcode。

![图1 arbiter](/images/formal/sva/1_arbiter.PNG)

interface代码如下：

```verilog
typedef enum logic[2:0] {NOP,FORCE0,FORCE1,FORCE2,FORCE3,ACCESS_OFF,ACCESS_ON} t_opcode;
module arbiter(
    input logic [3:0] req,
    input t_opcode opcode,
    input logic clk, rst,
    output logic [3:0] gnt,
    output logic op_error
);
```



# 一些基本概念



## Assertion

​	Assertion一般用来表示一个表达式恒为True，比如agent0未发起request，那肯定gnt[0]不应该被拉起来.

```
check_grant: assert property (!(gnt[0] && !req[0])) else $error(“Grant
without request for agent 0!”);
```



## Assumption  

Assertion一般用于检查DUT内部的状态，而Assumption则主要用于约束验证环境，一般用于约束输入。例如我们期望opcode应该是合法的一些参数:

```
good_opcode: assume property (opcode inside {FORCE0,FORCE1,FORCE2,
FORCE3,ACCESS_OFF,ACCESS_ON}) else $error(“Illegal opcode.”);
```

在simulation里，assumption跟assertion一样。在Formal里面，二者则有很多的区别。对于上面那个assumption，在simulation中，不断的检测opcode，不过不在这些数里面则报一个assertion failure。在Formal里，这是表示我的opcode激励只能在这些数里面取值。



## COVER POINTS  

这个没什么好说的，做验证的同学，如果这都不懂，可以撞墙了。

不过需要注意的是，FV通常可以全覆盖。但是因为有assumption，我们有时候会overconstraint ，这样有些东西就可能被漏掉。所以coverpoint在FV里面至关重要。通常来说，FV上来就先写coverpoint。其次还是assertion和assumption。



# SVA ASSERTION  语言基础

SVA Asssertion 语言分为几个等级:

- Booleans  

  Booleans 即布尔表达式，一些与或非的逻辑，例如:

  ```verilog
  (req[0]&&req[1]&&req[2]&&req[3])
  ```

- Sequences  

  Sequences  顾名思义，就是boolean 表达式的序列，也就是说一段时间（几个cycle）的booleans的组合，以来与clock event来定义这个区间，例如req0有效两个cycle后gnt0有效

  ```verilog
  req[0] ##2 gnt[0]
  ```

- Properties  

  Properties  则是进一步将sequences和一些操作符组合起来，表示一个implication或者其他的。比如：

  ```verilog
  req[0] ##2 gnt[0] |-> ##1 !gnt[0]
  ```

- Assertion Statements   

  Assertion Statements  则是用*assert*, *assume*, *cover*等关键词将properties例化，把SVA property   转换成真正意义的assertion, assumption, cover point. 例如：

  ```verilog
  gnt_falls: assert property(req[0] ##2 gnt[0] |-> ##1 !gnt[0]);
  ```



![图2 sva_layer](/images/formal/sva/2_sva_layer.PNG)



另外还有两个概念需要明确:

- immediate assertions

  Immediate assertion 简单的assertion语句，只能用于procedural  语句里面。 只支持booleans，不能有clock， reset或者property语句。

  ```
  imm1: assert (!(gnt[0] && !req[0]))
  ```

  

- concurrent assertions

  Concurrent assertion  语句则一般用于检查多个cycle期间段的一些property，一般我们说SVA基本代指Concurrent assertion 

  ```
  conc1: assert property (!(gnt[0] && !req[0]))
  ```



# CONCURRENT ASSERTION BASICS AND CLOCKING  

下面是个例子:

```verilog
safe_opcode: assert property (
@(posedge clk)
disable iff (rst)
(opcode inside {FORCE0,FORCE1,FORCE2,FORCE3,ACCESS_OFF,ACCESS_ON}))
else $error(“Illegal opcode.”);
```

与immediate assertion不同，concurrent assertion一般包含下面几点：

- 带关键词assert property.
- 带clock
- 可选的disable iff语句

![图3 一些常用的函数](/images/formal/sva/3_useful_blocks.PNG)

![图4 most useful blocks](/images/formal/sva/4_most_useful_blocks.PNG)



## Disable iff

​	Disable iff语句，顾名思义就是在某个条件成立的时候将assertion语句disable掉。但这里有点需要特别注意的是，diasable iff里面的逻辑采样不是基于clock的，或者说相对clock来说是异步的。建议里面只放reset逻辑，不要放其他的东西。我们举个例子，如果有gnt，那么铁定有个req，两种写法：

```
bad_assert: assert property (@(posedge clk)
disable iff
(real_rst || ($countones(gnt) == 0))
($countones(req) > 0));
```

```
good_assert: assert property (@(posedge clk)
disable iff (real_rst)
(($countones(req) > 0) ||
($countones(gnt) == 0)));
```

咋一看二者好像一样。仔细分析下，在clock 8的phase，由于gnt=0，整个assertion直接被disable，我们也就没法检测出上一个cycle的failure。

![图5 bad_disab_diff](/images/formal/sva/5_disable_iff.PNG)



# SEQUENCE SYNTAX AND EXAMPLES  

## delay

sequence 基本的操作符是#,即delay，\##n (延时特定个cycle) or ##[a:b] (延时 a 到b 个cycle)  。

![Figure 6 sva_exmample](/images/formal/sva/6_sva_example_1.PNG)



## repetition

​	repetition 操作符 [\*m:n]  ，表示subsequence  重复多少次。

![figure 7 ](/images/formal/sva/7_sva_example_2.PNG)

## logical ops

Sequences  可以通过and 或者or组合起来。

and: 两个sequence同时start，但它们的结束点未必相同。

or:   两个sequence至少有一个match

throughout : Boolean expression remains true for the whole execution of a sequence  

within:   one sequence occurs within the execution of another  

![Figure 8.1](/images/formal/sva/8_sva_logical_1.PNG)

![Figure 8.2](/images/formal/sva/8_sva_logical_2.PNG)

![Figure 8.3](/images/formal/sva/8_sva_logical_3.PNG)



## go to repetetion

goto repetition 操作符，即 [- > n] 和 [ =n]  ，表示有value重复了正好n次，不定是连续。两个操作符的区别在于：

​	这两个操作符如果后面不接其他的东西的话，是等价的。如果后面带有其他的sequence的话，意义有点不一样：

- \[->n\]:  goto repetition， 	下一个sequence必须紧接着。
- \[=n\]:  nonconsecutive  goto repetition， 下一个seuquece出现前允许插入若干个cycle的空闲

![Figure 8.4 goto repetition](/images/formal/sva/8_sva_goto.PNG)



# Implication  

sequence |-> property ： sequence match后立即检查property

sequence |=> property.  ： sequence match后delay一个cycle再检查property

左边称为antecedent  ，必须为sequence；右边称为consequent  ，可以是squence或者property。

![Figure 9.1 ](/images/formal/sva/9_sva_impl_1.PNG)

![Figure 9.2](/images/formal/sva/9_sva_impl_2.PNG)