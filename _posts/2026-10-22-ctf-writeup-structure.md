---
layout: post
title: "Dreamhack - special_rsa_parameter"
description: "dreamhack crypto writeup"
categories: [ctf-wargame]
tags: [ctf, wargame, writeup]
---

# Dreamhack - special_rsa_parameter

[문제 링크](https://dreamhack.io/wargame/challenges/650)

Dreamhack의 `special_rsa_parameter`라는 문제다.

## 1. 문제 분석

```python
from Crypto.Util.number import getPrime, bytes_to_long
from secret import flag

e = 257
P = bytes_to_long(flag)

while True:
    p = getPrime(1024)
    if (p - 1) % e**2 != 0 and (p - 1) % e == 0:
        break

q = getPrime(1024)

n = p * q

C = pow(P, e, n)

assert (q - 1) % e != 0
assert (p - 1) % e == 0
assert (p - 1) % e**2 != 0

print(f"p = {p}")
print(f"q = {q}")
print(f"e = {e}")
print(f"n = {n}")
print(f"C = {C}")
```

문제를 본 순간 엥? 싶었는데, 이 문제는 $p$, $q$, $e$, $n$, $C$를 모두 출력한다.

일단 천천히 조건들을 살펴보면 다음과 같다.

1. $e = 257$, $n = pq$
2. $p$, $q$는 1024-bit 소수
3. $p-1 \equiv 0 \pmod{e}$
4. $p-1 \not\equiv 0 \pmod{e^2}$
5. $q-1 \not\equiv 0 \pmod{e}$

3번 조건이 좀 특이한데, 일반적인 RSA에서는

$$
\gcd(\phi(n), e) = 1
$$

일 때 $e$의 모듈러 역원 $d$가 존재하여 암호문 $C$를 복호화할 수 있다.

하지만 문제의 3번 조건에 의해

$$
\gcd(p-1, e) = e
$$

이고,

$$
\begin{aligned}
\gcd(\phi(n), e)
&= \gcd((p-1)(q-1), e) \\
&= e
\end{aligned}
$$

가 된다.

즉, $\gcd(\phi(n), e) \neq 1$이므로 일반적인 RSA 복호화에 사용하는 개인 지수 $d$가 존재하지 않는다.

다시 암호화 과정을 살펴보자.

$$
C \equiv P^e \pmod{n}
$$

$n = pq$이고 $p$, $q$는 서로 다른 소수이므로, 중국인의 나머지 정리(CRT)에 의해 위 합동식은 다음 두 합동식으로 분리할 수 있다.

$$
\begin{cases}
P^e \equiv C \pmod{p} \\
P^e \equiv C \pmod{q}
\end{cases}
$$

일반적인 RSA에서는 각각의 합동식에 대한 해가 유일하므로 $\pmod{n}$에서도 유일한 평문을 구할 수 있다.

하지만 이 문제에서는 $p$와 $q$에 대한 조건이 서로 다르므로 각각의 경우를 나누어 생각해야 한다.

이후의 풀이에서는 $P \not\equiv 0 \pmod{p}$, $P \not\equiv 0 \pmod{q}$인 경우를 가정한다.

---

## 2. 풀이

### 2.1. $P^e \equiv C \pmod{q}$

먼저 $q$에 대한 합동식을 살펴보자.

$$
P^e \equiv C \pmod{q}
$$

$e$의 역원 $d'$이 존재한다면 다음과 같은 방법으로 평문을 구할 수 있다.

$$
P^{ed'} \equiv P \equiv C^{d'} \pmod{q}
$$

결론부터 말하자면, $\pmod{q}$에 대해서는 해가 유일하게 하나 존재한다.

#### 해의 유일성 증명

두 해 $P_1$, $P_2$가 존재한다고 가정하자.

$$
P_1^e \equiv C \pmod{q}
$$

$$
P_2^e \equiv C \pmod{q}
$$

두 식을 나누면,

$$
\left(P_1 P_2^{-1}\right)^e \equiv 1 \pmod{q}
$$

여기서

$$
x \equiv P_1 P_2^{-1} \pmod{q}
$$

라고 정의하면,

$$
x^e \equiv 1 \pmod{q}
$$

가 된다.

소수 $q$에 대한 곱셈군 $(\mathbb{Z}/q\mathbb{Z})^\times$는 위수가 $q-1$인 순환군이다.

따라서 위 합동식의 해의 개수는

$$
\gcd(e, q-1)
$$

이다.

문제에서 $e = 257$은 소수이고, $q-1$은 $e$의 배수가 아니므로

$$
\gcd(e, q-1) = 1
$$

이다.

따라서 $x$의 유일한 해는

$$
x \equiv 1 \pmod{q}
$$

이고,

$$
P_1 P_2^{-1} \equiv 1 \pmod{q}
$$

$$
\therefore P_1 \equiv P_2 \pmod{q}
$$

이다.

즉, 암호문이 실제 평문으로부터 생성되었으므로 해가 존재하며, 위 증명에 의해 그 해는 유일하다.

#### 지수 $e$의 역원 구하기

그럼 평문을 구하기 위한 지수 $e$의 역원 $d'$은 어떻게 구할까?

먼저 모듈러에서의 지수 연산을 살펴보자.

페르마의 소정리에 의해, $p$가 소수이고 $\gcd(a,p)=1$일 때

$$
a^{p-1} \equiv 1 \pmod{p}
$$

이다.

따라서 음이 아닌 정수 $b$에 대해

$$
a^b \equiv a^{b \bmod (p-1)} \pmod{p}
$$

가 성립한다.

즉, 지수는 $p-1$을 법으로 하여 줄일 수 있다.

다시 $q$에 대한 합동식을 살펴보면, 지수 $e$의 역원 $d'$은 다음과 같이 정의할 수 있다.

$$
ed' \equiv 1 \pmod{q-1}
$$

$\gcd(e,q-1)=1$이므로 이러한 $d'$은 항상 존재한다.

어떤 정수 $t$에 대해

$$
ed' = 1 + t(q-1)
$$

이므로,

$$
\begin{aligned}
C^{d'}
&\equiv (P^e)^{d'} \pmod{q} \\
&\equiv P^{ed'} \pmod{q} \\
&\equiv P^{1+t(q-1)} \pmod{q} \\
&\equiv P \cdot (P^{q-1})^t \pmod{q} \\
&\equiv P \pmod{q}
\end{aligned}
$$

따라서 다음과 같이 유일한 해 $x_q$를 구할 수 있다.

$$
\boxed{x_q \equiv C^{d'} \pmod{q}}
$$

이를 Python으로 구현하면 다음과 같다.

```python
d_q = pow(e, -1, q - 1)
xq = pow(C, d_q, q)
```

---

### 2.2. $P^e \equiv C \pmod{p}$

$p$에 대한 합동식은 $q$에 대한 합동식과는 상황이 조금 다르다.

$$
P^e \equiv C \pmod{p}
$$

앞에서 $x^e \equiv 1 \pmod{p}$의 해의 개수는 $\gcd(e,p-1)$이라고 했다.

그런데 문제의 조건에 의해

$$
p-1 \equiv 0 \pmod{e}
$$

이므로,

$$
\gcd(e,p-1)=e=257
$$

이다.

즉, $x^e \equiv 1 \pmod{p}$의 해가 총 $e$개 존재한다.

심지어 $\gcd(e,p-1) \neq 1$이기 때문에 $e$의 모듈러 역원도 존재하지 않는다.

따라서 좀 다른 방법으로 $e$개의 해를 찾아보자.

#### 하나의 해 $x_0$ 구하기

먼저 다음 합동식을 만족하는 하나의 해 $x_0$를 구하고자 한다.

$$
x_0^e \equiv C \pmod{p}
$$

하지만 위에서 말했듯이 $\gcd(e,p-1)=e$이므로 일반적인 방식으로는 역원을 구할 수 없다.

대신 문제에서 주어진 나머지 조건에 주목해 보자.

$$
p-1 \equiv 0 \pmod{e}
$$

$$
p-1 \not\equiv 0 \pmod{e^2}
$$

첫 번째 조건에 의해 $p-1$을 다음과 같이 표현할 수 있다.

$$
p-1 = ek
$$

$$
k = \frac{p-1}{e}
$$

두 번째 조건에 의해 $k$는 $e$의 배수가 아니다.

또한 $e$는 소수이므로

$$
\gcd(e,k)=1
$$

이다.

따라서 $\pmod{k}$에서의 $e$의 유일한 역원 $d$를 구할 수 있다.

$$
ed \equiv 1 \pmod{k}
$$

어떤 정수 $m$에 대해 다음이 성립한다.

$$
ed = 1 + mk
$$

이 $d$로 무엇을 할 수 있을까?

$C^d$가 $P^e \equiv C \pmod{p}$의 해가 될 수 있는지 확인해 보자.

즉, 다음 합동식이 성립함을 보이면 된다.

$$
(C^d)^e \equiv C \pmod{p}
$$

먼저 $ed=1+mk$이므로,

$$
\begin{aligned}
C^{ed}
&= C^{1+mk} \\
&= C \cdot (C^k)^m
\end{aligned}
$$

이다.

따라서 $C^k \equiv 1 \pmod{p}$임을 보이면 된다.

RSA의 암호화 과정에 의해

$$
C \equiv P^e \pmod{p}
$$

이므로,

$$
\begin{aligned}
C^k
&\equiv P^{ek} \pmod{p} \\
&\equiv P^{p-1} \pmod{p} \\
&\equiv 1 \pmod{p}
\end{aligned}
$$

이다.

마지막 식은 페르마의 소정리에 의해 성립한다.

이를 다시 대입하면,

$$
\begin{aligned}
C^{ed}
&\equiv C \cdot (C^k)^m \pmod{p} \\
&\equiv C \cdot 1^m \pmod{p} \\
&\equiv C \pmod{p}
\end{aligned}
$$

따라서

$$
(C^d)^e \equiv C \pmod{p}
$$

가 성립하고, 다음과 같이 하나의 해 $x_0$를 구할 수 있다.

$$
\boxed{x_0 \equiv C^d \pmod{p}}
$$

이를 Python으로 구현하면 다음과 같다.

```python
k = (p - 1) // e
d = pow(e, -1, k)

x0 = pow(C, d, p)
```

#### 나머지 해 구하기

그럼 하나의 해 $x_0$를 이용해 나머지 $e-1$개의 해를 만들면 된다.

$\pmod{p}$에서 위수(order)가 $e$인 원소를 $z$라고 하자.

$$
\operatorname{ord}_p(z)=e
$$

따라서

$$
z^e \equiv 1 \pmod{p}
$$

이다.

이를 이용하면,

$$
\begin{aligned}
(x_0 \cdot z^i)^e
&\equiv x_0^e \cdot z^{ie} \pmod{p} \\
&\equiv C \cdot (z^e)^i \pmod{p} \\
&\equiv C \cdot 1^i \pmod{p} \\
&\equiv C \pmod{p}
\end{aligned}
$$

이므로 다음과 같은 해들을 만들 수 있다.

$$
\boxed{
x_i \equiv x_0 \cdot z^i \pmod{p},
\quad i=0,1,\ldots,e-1
}
$$

이때 $z$의 위수가 $e$이므로

$$
1,z,z^2,\ldots,z^{e-1}
$$

은 모두 서로 다른 원소이다.

$x_0 \not\equiv 0 \pmod{p}$이므로 $x_i$ 역시 서로 다르다.

따라서 총 $e$개의 해를 구할 수 있다.

#### 위수가 $e$인 원소 $z$ 구하기

그렇다면 위수가 $e$인 원소 $z$는 어떻게 구할 수 있을까?

임의의 원소 $a \in (\mathbb{Z}/p\mathbb{Z})^\times$에 대해 다음과 같이 정의하자.

$$
z \equiv a^k \pmod{p}
$$

여기서 $k=(p-1)/e$이다.

그러면

$$
\begin{aligned}
z^e
&\equiv (a^k)^e \pmod{p} \\
&\equiv a^{ke} \pmod{p} \\
&\equiv a^{p-1} \pmod{p} \\
&\equiv 1 \pmod{p}
\end{aligned}
$$

이다.

따라서 $z$의 위수는 $e$의 약수이다.

$e=257$은 소수이므로 가능한 위수는 $1$ 또는 $e$뿐이다.

즉, $z \neq 1$인 원소를 찾으면 해당 원소의 위수는 반드시 $e$이다.

```python
from random import randrange

while True:
    a = randrange(2, p)
    z = pow(a, k, p)

    if z != 1:
        break
```

이제 $z$를 이용하여 모든 해를 구할 수 있다.

```python
roots_p = [
    (x0 * pow(z, i, p)) % p
    for i in range(e)
]
```

---

### 2.3. Chinese Remainder Theorem (CRT)

지금까지 구한 결과를 정리하면 다음과 같다.

| 합동식 | 해의 개수 |
| --- | ---: |
| $P^e \equiv C \pmod{p}$ | $e=257$개 |
| $P^e \equiv C \pmod{q}$ | 1개 |

$p$에 대한 해를 $x_i$, $q$에 대한 유일한 해를 $x_q$라고 하면,

$$
\begin{cases}
P_i \equiv x_i \pmod{p} \\
P_i \equiv x_q \pmod{q}
\end{cases}
$$

를 만족하는 $P_i$를 CRT를 통해 구할 수 있다.

$p$와 $q$는 서로소이므로 각각의 해의 조합에 대해 $\pmod{n}$에서 유일한 $P_i$가 존재한다.

결과적으로

$$
P_i^e \equiv C \pmod{n}
$$

을 만족하는 평문 후보를 총 $e=257$개 얻을 수 있다.

이 평문 후보들을 바이트 문자열로 변환한 뒤, flag 형식을 만족하는 것을 찾으면 된다.

---

## 3. Exploit Code

```python
from sympy.ntheory.modular import crt
from Crypto.Util.number import long_to_bytes

p = 102917468046616568070479080437602349605790044856847368227989900438678598347252242912474630778930183524103498634272903762436029311481137741713080659077027483465896792512517855786714336938418831349151567425537183094315541122606131460802382497841037179253750742567612375678233281962828108691356598122015035462931

q = 155409405226203238058015527018600466439894178201393804291867914008619674289107580497614221099756010997177702316412488380301911465872315087011512265127913696978059566003514595719636467623534496220114055190116473471302619324855013682151351145662146108598413909004492093001297173273875378143449965795752096407249

e = 257
n = p * q

C = 9616384404213524657863670808981125526907268432622976664325249394851244870192789713737122799469499856887739253362805246859649606786263701308805488844336941066141053596437114630658542913559798796936296332917154444568198618992503828589914317105542317632873299732945292007245940129956165369995868033142331830348424499649247621627957887323716236781832428323377989036111392368810898382355775057357502240259332598797482858241354811610086476550911065698726091155648159869780115791767209206584503973202288411298660473001567148602289414544500536763463431773097574512189310225492456529147806648758189442259263483402853811323777

z = 25936144259918918889259412520942241260392248302124655698397848504163974782292081996158191923002710662325068772030686361357556508183335675333890381179845119398466462871160150710415185024501319727518984432217100629318145433999030466774035132242254402177214084326804867018251410340540336550857392535563249574107

# mod q에서의 유일해
d_q = pow(e, -1, q - 1)
xq = pow(C, d_q, q)

# mod p에서의 하나의 해
k = (p - 1) // e
d = pow(e, -1, k)
x0 = pow(C, d, p)

# z의 위수 확인
assert z != 1
assert pow(z, e, p) == 1

# mod p에서의 모든 해
roots_p = [
    (x0 * pow(z, i, p)) % p
    for i in range(e)
]

targets = [b"DH{", b"BISC{", b"FLAG{", b"CTF{"]

# CRT를 이용한 평문 복원
for i, xp in enumerate(roots_p):
    ans, _ = crt([p, q], [xp, xq])
    ans = int(ans)

    assert pow(ans, e, n) == C

    plaintext = long_to_bytes(ans)

    for target in targets:
        if plaintext.startswith(target):
            print("FOUND i =", i)
            print(plaintext)
```

실제로 flag의 형식은 `BISC{...}`였다.

---

## 4. 정리

이 문제는 일반적인 RSA와 달리

$$
\gcd(e,\phi(n)) \neq 1
$$

이므로 개인 지수 $d$를 직접 구할 수 없는 문제였다.

하지만 $p$와 $q$에 대한 합동식을 분리하고, 각각의 조건을 이용하면 평문 후보들을 구할 수 있다.

핵심은 다음 세 가지이다.

- $\gcd(e,q-1)=1$을 이용하여 $\pmod{q}$에서 유일해를 구한다.
- $p-1=ek$와 $\gcd(e,k)=1$을 이용하여 $\pmod{p}$에서 하나의 해를 구한 뒤, 위수가 $e$인 원소를 이용하여 모든 해를 생성한다.
- CRT를 이용하여 총 $e$개의 평문 후보를 복원하고 flag를 찾는다.