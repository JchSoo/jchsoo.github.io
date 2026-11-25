---
layout: post
title: "Pcap Programming"
description: "WHS 1기 과제 review"
categories: [development]
tags: [debugging, development, workflow]
---

# [WhiteHat School] Pcap Programming

2023년, 1학년 신입생일 때 했던 Whitehat School 1기 과제 중 하나인 pcap_programming을 리뷰 해보려고 한다.

그당시에는 지금과 달리 LLM으로 코딩하기란 쉽지 않을 일이어서 stack overflow나 여러 블로그들, 예제 코드를 그대로 떠다가 코드를 짰던 기억이 있다. 그래서 그당시 코드를 완전 이해하면서 짜기보단 일단 동작만 시키는데 집중하여, 지금에 와서야 한번 코드를 분석해보려 한다.

- GitHub: https://github.com/JchSoo/pcap_programming

## 1. 과제 설명

과제는 네트워크 패킷을 캡처하고, TCP 통신에 해당하는 패킷의 정보를 출력하는 것이었다.

이를 위해 Ethernet, IP, TCP 헤더를 각각 파싱해야 한다. 일반적인 Ethernet 기반 IPv4 TCP 패킷의 구조는 다음과 같다.

```
+-----------------+-----------------+-----------------+----------+
| Ethernet Header |   IPv4 Header   |   TCP Header    |   Data   |
+-----------------+-----------------+-----------------+----------+
|     14 Bytes    |   20~60 Bytes   |   20~60 Bytes   | Variable |
+-----------------+-----------------+-----------------+----------+
```

libpcap을 통해 전달받는 패킷은 바이트 배열 형태이므로, 각 헤더의 위치를 계산하고 해당 위치의 데이터를 해석하면 원하는 정보를 얻을 수 있다.

## 2. 구조체 정의

패킷의 각 헤더를 파싱하기 위해 Ethernet, IP, TCP 헤더에 대응하는 구조체를 정의했다. 구조체 정의코드는 어디 다른 블로그에서 그대로 떠다 왔던 기억이 있다.

### 2.1. Ethernet Header

```c
struct etherheader {
    u_char  ether_dhost[6];
    u_char  ether_shost[6];
    u_short ether_type;
};
```

Ethernet 헤더는 일반적으로 14 Bytes로 구성된다.

| Field | Size | Description |
| --- | --- | --- |
| ether_dhost | 6 Bytes | 목적지 MAC 주소 |
| ether_shost | 6 Bytes | 출발지 MAC 주소 |
| ether_type | 2 Bytes | 상위 프로토콜의 종류 |

MAC 주소는 48-bit 주소이기 때문에 각각 6 Bytes의 배열로 선언했다.

`ether_type`은 Ethernet 헤더 이후에 어떤 프로토콜의 데이터가 위치하는지를 나타낸다.

대표적인 EtherType 값은 다음과 같다.

| EtherType | Protocol |
| --- | --- |
| `0x0800` | IPv4 |
| `0x0806` | ARP |
| `0x86DD` | IPv6 |
| `0x8100` | IEEE 802.1Q VLAN |

이번 과제에서는 Ethernet 헤더의 `ether_dhost`, `ether_shost`를 이용하여 출발지와 목적지의 MAC 주소를 출력한다.

### 2.2. IPv4 Header

```c
struct ipheader {
    u_char   iph_ihl:4,
             iph_ver:4;
    u_char   iph_tos;
    u_short  iph_len;
    u_short  iph_ident;
    u_short  iph_flag:3,
             iph_offset:13;
    u_char   iph_ttl;
    u_char   iph_protocol;
    u_short  iph_chksum;
    struct in_addr iph_sourceip;
    struct in_addr iph_destip;
};
```

IPv4 헤더의 기본 크기는 20 Bytes이며, IP Option의 존재 여부에 따라 최대 60 Bytes까지 확장될 수 있다.

| Field | Description |
| --- | --- |
| iph_ihl | IP 헤더의 길이 |
| iph_ver | IP 버전 |
| iph_tos | Type of Service |
| iph_len | IP 헤더와 데이터를 포함한 전체 길이 |
| iph_ident | IP 패킷 식별자 |
| iph_flag | Fragmentation 관련 플래그 |
| iph_offset | Fragment Offset |
| iph_ttl | Time To Live |
| iph_protocol | 상위 프로토콜의 종류 |
| iph_chksum | IP 헤더의 Checksum |
| iph_sourceip | 출발지 IP 주소 |
| iph_destip | 목적지 IP 주소 |

구조체에서 `iph_ihl:4`, `iph_ver:4`와 같이 선언한 부분이 있는데, 이는 C언어의 Bit Field 문법이다.

IPv4 헤더의 첫 번째 Byte에는 Version과 IHL이 각각 4-bit씩 들어간다.

```
  7       4 3       0
+----------+----------+
| Version  |   IHL    |
+----------+----------+
    4-bit      4-bit
```

예를 들어 IPv4 헤더의 첫 번째 Byte가 `0x45`라면,

```
0x45 = 0100 0101

Version = 0100 = 4
IHL     = 0101 = 5
```

IHL은 32-bit Word 단위로 헤더의 길이를 나타내므로, 실제 헤더의 크기는 다음과 같다.

$$
\text{IP Header Length} = \text{IHL} \times 4
$$

따라서 IHL이 5라면 IP 헤더의 크기는 20 Bytes이다.

또한 `iph_protocol` 필드를 통해 IP 패킷이 어떤 상위 프로토콜의 데이터를 담고 있는지 확인할 수 있다.

| Protocol Number | Protocol |
| --- | --- |
| 1 | ICMP |
| 6 | TCP |
| 17 | UDP |

이번 과제에서는 TCP 패킷만을 대상으로 하므로 `iph_protocol`이 6인 패킷만 처리한다.  실제로 아래에 이런 코드가 있다.

```c
  if (iph->iph_protocol != IPPROTO_TCP){
    return;
  }
```

### 2.3. TCP Header

```c
struct tcpheader {
    u_short sport;
    u_short dport;
    u_int   seqnum;
    u_int   acknum;
    u_char  th_off;
    u_char  flags;
    u_short win;
    u_short crc;
    u_short urgptr;
};
```

TCP 헤더 역시 기본 크기는 20 Bytes이며, TCP Option이 존재할 경우 최대 60 Bytes까지 확장될 수 있다.

| Field | Description |
| --- | --- |
| sport | 출발지 Port 번호 |
| dport | 목적지 Port 번호 |
| seqnum | Sequence Number |
| acknum | Acknowledgement Number |
| th_off | Data Offset 등을 포함하는 Byte |
| flags | TCP Control Flags |
| win | Window Size |
| crc | TCP Checksum |
| urgptr | Urgent Pointer |

TCP 헤더의 첫 번째 4 Bytes에는 출발지와 목적지의 Port 번호가 각각 2 Bytes씩 위치한다.

```
 0               15 16              31
+------------------+------------------+
|   Source Port    | Destination Port |
+------------------+------------------+
|           Sequence Number           |
+-------------------------------------+
|        Acknowledgement Number       |
+-------------------------------------+
|              ...                    |
```

## 3. 본격적인 패킷 캡처

libpcap은 네트워크 패킷을 캡처하고 분석할 수 있도록 API를 제공하는 라이브러리라고 한다.

### 3.1. 네트워크 인터페이스 검색

```c
pcap_t *adhandle;
char errbuf[PCAP_ERRBUF_SIZE];
pcap_if_t *alldevs;
pcap_if_t *d;
int i = 0;
int no;

if (pcap_findalldevs(&alldevs, errbuf) < 0) {
    printf("pcap_findalldevs error\n");
    return 1;
}
```

`pcap_findalldevs()`는 패킷 캡처에 사용할 수 있는 네트워크 인터페이스의 목록을 가져오는 함수이다.

```c
int pcap_findalldevs(
    pcap_if_t **alldevsp,
    char *errbuf
);
```

함수가 성공적으로 실행되면 `alldevs`에 네트워크 인터페이스 목록의 시작 주소가 저장된다.

`pcap_if_t` 구조체는 다음과 같은 형태의 Linked List로 구성된다.

```
alldevs
   |
   v
+-----------+     +-----------+     +-----------+
| Interface |     | Interface |     | Interface |
|   name    |     |   name    |     |   name    |
|   next  ------->|   next  ------->|   next  ------> NULL
+-----------+     +-----------+     +-----------+
```

따라서 `next` 포인터를 따라가면서 모든 인터페이스를 탐색할 수 있다.

```c
for (d = alldevs; d; d = d->next) {
    printf("%d : %s\n", ++i,
           (d->description) ? (d->description) : (d->name));
}
```

각 인터페이스의 설명이 존재한다면 `description`을 출력하고, 존재하지 않는다면 인터페이스의 이름인 `name`을 출력한다.

이후 사용자로부터 캡처에 사용할 인터페이스의 번호를 입력받는다.

```c
printf("number : ");
scanf("%d", &no);

if (!(no > 0 && no <= i)) {
    printf("number error\n");
    return 1;
}

for (d = alldevs, i = 0; d; d = d->next) {
    if (no == ++i)
        break;
}
```

선택한 번호에 해당하는 인터페이스를 찾으면 `d`가 해당 인터페이스의 구조체를 가리키게 된다.

### 3.2. 네트워크 인터페이스 열기

```c
if (!(adhandle = pcap_open_live(
        d->name, 65536, 1, 1000, errbuf))) {
    printf("pcap_open_live error %s\n", d->name);
    pcap_freealldevs(alldevs);
    return -1;
}

pcap_freealldevs(alldevs);
```

`pcap_open_live()`는 선택한 네트워크 인터페이스에서 실시간 패킷 캡처를 수행하기 위한 핸들을 생성하는 함수이다.

함수의 정의는 다음과 같다.

```c
pcap_t *pcap_open_live(
    const char *device,
    int snaplen,
    int promisc,
    int to_ms,
    char *errbuf
);
```

| Parameter | Value | Description |
| --- | --- | --- |
| device | d->name | 캡처할 네트워크 인터페이스 |
| snaplen | 65536 | 패킷당 캡처할 최대 Byte 수 |
| promisc | 1 | Promiscuous Mode 활성화 요청 |
| to_ms | 1000 | 패킷 버퍼의 Read Timeout(ms) |
| errbuf | errbuf | 에러 메시지를 저장할 버퍼 |

여기서 Promiscuous Mode는 자신의 MAC 주소로 전달되는 프레임뿐만 아니라, 네트워크 인터페이스에 도달한 다른 프레임도 수신할 수 있도록 하는 모드이다.

다만 스위치 환경에서 Promiscuous Mode를 활성화한다고 해서 다른 장치 간의 모든 통신을 캡처할 수 있는 것은 아니다.

`pcap_open_live()`가 성공하면 `pcap_t` 타입의 핸들을 반환한다.

이후에는 인터페이스 목록이 더 이상 필요하지 않으므로 `pcap_freealldevs()`를 통해 할당된 메모리를 해제한다.

### 3.3. 패킷 캡처 및 Callback 함수

```c
pcap_loop(adhandle, 0, packet_handler, NULL);

pcap_close(adhandle);
```

`pcap_loop()`는 패킷을 지속적으로 캡처하고, 패킷이 캡처될 때마다 지정된 Callback 함수를 호출한다.

```c
int pcap_loop(
    pcap_t *p,
    int cnt,
    pcap_handler callback,
    u_char *user
);
```

`cnt`는 처리할 패킷의 개수를 의미한다.

현재 코드에서는 0으로 지정했으므로 에러가 발생하거나 캡처가 중단될 때까지 계속해서 패킷을 처리한다.

Callback 함수로는 `packet_handler()`를 전달했다.

```c
void packet_handler(
    u_char *param,
    const struct pcap_pkthdr *header,
    const u_char *pkt_data
) {
    got_packet(pkt_data);
}
```

`packet_handler()`는 다음과 같은 정보를 전달받는다.

| Parameter | Description |
| --- | --- |
| param | pcap_loop()에서 전달한 사용자 데이터 |
| header | 캡처 시간, 패킷 길이 등의 메타데이터 |
| pkt_data | 실제 캡처된 패킷 데이터의 시작 주소 |

`header`가 가리키는 `pcap_pkthdr` 구조체는 다음과 같다.

```c
struct pcap_pkthdr {
    struct timeval ts;
    bpf_u_int32 caplen;
    bpf_u_int32 len;
};
```

- `ts`: 패킷이 캡처된 시간
- `caplen`: 실제로 캡처된 데이터의 길이
- `len`: 원래 패킷의 길이

현재 코드에서는 패킷 데이터만을 사용하므로 `pkt_data`를 `got_packet()` 함수로 전달한다.

## 4. 패킷 파싱

코드의 핵심인 got_packet()함수의 전문은 아래와 같다.

```c
void got_packet(const u_char *pkt_data) {
  struct etherheader *etherh = (struct etherheader *)pkt_data;
  struct ipheader *iph = (struct ipheader *)(pkt_data + sizeof(struct etherheader)); 
  struct tcpheader *tcph = (struct tcpheader *)(pkt_data + sizeof(struct ipheader) + sizeof(struct etherheader));

  if (iph->iph_protocol != IPPROTO_TCP){
    return;
  }

  u_char *dmac = etherh->ether_dhost;
  u_char *smac = etherh->ether_shost;

  printf("=========== MAC  HEADER =============\n");
  printf("From: %02x:%02x:%02x:%02x:%02x:%02x\n" "To: %02x:%02x:%02x:%02x:%02x:%02x \n",
  smac[0], smac[1], smac[2], smac[3], smac[4], smac[5],
  dmac[0], dmac[1], dmac[2], dmac[3], dmac[4], dmac[5]);

  printf("============ IP  HEADER =============\n");
  printf("From: %s\n", inet_ntoa(iph->iph_sourceip));   
  printf("To: %s\n", inet_ntoa(iph->iph_destip)); 

  printf("============ TCP HEADER =============\n");
  printf("Src Port : %d\n" , ntohs(tcph->sport));
  printf("Dst Port : %d\n" , ntohs(tcph->dport));
  printf("=====================================\n\n");   
}
```

### 4.1. 각 헤더의 위치 계산

```c
void got_packet(const u_char *pkt_data) {
    struct etherheader *etherh =
        (struct etherheader *)pkt_data;

    struct ipheader *iph =
        (struct ipheader *)(pkt_data
        + sizeof(struct etherheader));

    struct tcpheader *tcph =
        (struct tcpheader *)(pkt_data
        + sizeof(struct ipheader)
        + sizeof(struct etherheader));
```

`pkt_data`는 캡처된 패킷 데이터의 시작 주소를 가리키는 포인터이다.

일반적인 Ethernet 기반 IPv4 TCP 패킷에서 Ethernet 헤더는 패킷의 시작 위치에 존재하므로, 해당 주소를 `struct etherheader *` 타입으로 Casting하면 Ethernet 헤더의 각 필드에 접근할 수 있다.

IP 헤더는 Ethernet 헤더 바로 뒤에 위치하고, TCP 헤더는 IP 헤더 바로 뒤에 위치한다.

Ethernet 헤더가 14 Bytes이고 IP 헤더가 20 Bytes인 경우 다음과 같다.

```
pkt_data
    |
    v
    0             14                 34
    |              |                  |
    v              v                  v
+--------------+------------------+------------------+------+
|   Ethernet   |       IPv4       |       TCP        | Data |
+--------------+------------------+------------------+------+
    etherh           iph                 tcph
```

즉, 패킷의 시작 주소를 $B$라고 하면 각 헤더의 주소는 다음과 같다.

$$
\begin{aligned}
\text{Ethernet Header} &= B \\
\text{IP Header} &= B + 14 \\
\text{TCP Header} &= B + 14 + 20
\end{aligned}
$$

이러한 방식으로 별도의 구조체에 데이터를 복사하지 않고도 패킷의 각 필드에 접근할 수 있다.

다만 현재 코드에서는 IP 헤더의 크기가 항상 20 Bytes라고 가정하고 있다.

IP Option이 존재할 경우 TCP 헤더의 위치가 달라지므로 실제로는 IHL 필드를 이용하여 계산해야 한다.

### 4.2. TCP 패킷 필터링

```c
if (iph->iph_protocol != IPPROTO_TCP) {
    return;
}
```

IPv4 헤더의 Protocol 필드를 확인하여 TCP 패킷이 아니라면 함수에서 바로 반환한다.

`IPPROTO_TCP`는 TCP에 해당하는 Protocol Number인 6으로 정의되어 있다.

즉, TCP 패킷만 이후의 출력 과정을 수행하게 된다.

### 4.3. MAC 주소 출력

```c
u_char *dmac = etherh->ether_dhost;
u_char *smac = etherh->ether_shost;

printf("=========== MAC  HEADER =============\n");

printf("From: %02x:%02x:%02x:%02x:%02x:%02x\n"
       "To: %02x:%02x:%02x:%02x:%02x:%02x\n",
       smac[0], smac[1], smac[2],
       smac[3], smac[4], smac[5],
       dmac[0], dmac[1], dmac[2],
       dmac[3], dmac[4], dmac[5]);
```

MAC 주소는 총 6 Bytes로 구성되므로 각 Byte를 16진수로 출력한다.

`%02x`는 16진수를 최소 두 자리로 출력하며, 두 자리보다 짧을 경우 앞에 0을 채운다.

예를 들어 다음과 같은 Byte 배열이 존재한다면,

```c
unsigned char mac[6] = {
    0x00, 0x1a, 0x2b, 0x03, 0x4d, 0x5e
};
```

출력 결과는 다음과 같다.

```
00:1a:2b:03:4d:5e
```

### 4.4. IP 주소 출력

```c
printf("============ IP  HEADER =============\n");

printf("From: %s\n", inet_ntoa(iph->iph_sourceip));
printf("To: %s\n", inet_ntoa(iph->iph_destip));
```

IPv4 주소는 32-bit의 정수 형태로 저장되어 있다.

하지만 일반적으로 사람이 IP 주소를 확인할 때는 `192.168.0.1`과 같은 Dotted Decimal Notation을 사용한다.

`inet_ntoa()`는 `struct in_addr`에 저장된 IPv4 주소를 이러한 문자열 형태로 변환해 주는 함수이다.

```c
char *inet_ntoa(struct in_addr in);
```

예를 들어 네트워크 바이트 순서로 다음과 같은 데이터가 존재한다면,

```
C0 A8 00 01
```

각 Byte를 10진수로 변환하여 다음과 같이 표현할 수 있다.

```
192.168.0.1
```

> GPT: 참고로 `inet_ntoa()`는 내부의 정적 버퍼를 사용하기 때문에, 현재는 `inet_ntop()`을 사용하는 것이 더 권장된다.
> 

라고 한다.

### 4.5. TCP Port 번호 출력

```c
printf("============ TCP HEADER =============\n");

printf("Src Port : %d\n", ntohs(tcph->sport));
printf("Dst Port : %d\n", ntohs(tcph->dport));

printf("=====================================\n\n");
```

TCP 헤더에서 출발지와 목적지 Port 번호를 가져와 출력한다.

여기서 MAC 주소나 IP 주소와 달리 `ntohs()`라는 함수를 사용하고 있는데, 이는 Endianness 때문이다.

#### Network Byte Order

네트워크에서는 일반적으로 Big Endian을 사용하여 여러 Byte로 구성된 정수 데이터를 전송한다.

반면 일반적인 x86 시스템에서는 Little Endian을 사용한다.

예를 들어 Port 번호가 443이라면,

$$
443_{10} = 0x01BB
$$

네트워크상에서는 다음과 같은 순서로 전송된다.

```
Network Byte Order (Big Endian)

낮은 주소              높은 주소
+----------+----------+
|   0x01   |   0xBB   |
+----------+----------+
```

이를 Little Endian 시스템에서 별도의 변환 없이 16-bit 정수로 읽으면 `0xBB01`로 해석된다.

$$
0xBB01 = 47873
$$

따라서 올바른 값을 얻기 위해서는 Network Byte Order를 Host Byte Order로 변환해야 한다.

```c
ntohs(tcph->sport);
```

`ntohs()`는 Network TO Host Short의 약자이다.

관련 함수들을 정리하면 다음과 같다.

| Function | Description |
| --- | --- |
| htons() | Host to Network, 16-bit |
| htonl() | Host to Network, 32-bit |
| ntohs() | Network to Host, 16-bit |
| ntohl() | Network to Host, 32-bit |

TCP Port 번호는 16-bit 정수이므로 `ntohs()`를 사용한다.

## 5. 컴파일 및 실행

libpcap을 사용하는 프로그램이므로 컴파일 시 `-lpcap` 옵션을 통해 라이브러리를 링크해야 한다.

Ubuntu 환경이라면 다음과 같이 설치할 수 있다.

```bash
sudo apt install libpcap-dev
```

소스 파일의 이름이 `main.c`라고 가정하면,

```bash
gcc main.c -o pcap_programming -lpcap
```

이후 패킷 캡처에 필요한 권한으로 실행한다.

```bash
sudo ./pcap_programming
```

실행하면 네트워크 인터페이스의 목록이 출력되고, 원하는 인터페이스를 선택하여 패킷을 캡처할 수 있다.

출력 형태는 대략 다음과 같다.

```
=========== MAC  HEADER =============
From: 00:11:22:33:44:55
To: aa:bb:cc:dd:ee:ff
============ IP  HEADER =============
From: 192.168.0.10
To: 192.168.0.20
============ TCP HEADER =============
Src Port : 54321
Dst Port : 443
=====================================
```

위 출력은 설명을 위한 예시이다.

## 6. 문제점

당시에는 일단 패킷이 정상적으로 출력되는 것에 집중했던 것 같다.

지금 다시 코드를 살펴보니 몇 가지 문제가 보인다.

### 6.1. IP 헤더의 길이

기존 코드에서는 TCP 헤더의 위치를 다음과 같이 계산했다.

```c
struct tcpheader *tcph =
    (struct tcpheader *)(pkt_data
    + sizeof(struct ipheader)
    + sizeof(struct etherheader));
```

하지만 IP Option이 존재할 경우 실제 IP 헤더의 크기는 20 Bytes보다 커질 수 있다.

따라서 고정된 구조체의 크기가 아닌 IHL 필드를 이용해야 한다.

```c
int ip_header_len = iph->iph_ihl * 4;

struct tcpheader *tcph =
    (struct tcpheader *)(pkt_data
    + sizeof(struct etherheader)
    + ip_header_len);
```

이렇게 하면 IP Option이 존재하는 경우에도 TCP 헤더의 위치를 올바르게 계산할 수 있다.

단, IPv4 Fragmentation이 발생한 경우 첫 번째 Fragment가 아닌 패킷에는 TCP 헤더가 존재하지 않을 수 있으므로 이에 대한 검사도 필요하다.

### 6.2. 패킷 길이 검증

기존 코드에서는 Callback 함수에서 전달받은 `pcap_pkthdr` 구조체를 사용하지 않았다.

```c
void packet_handler(
    u_char *param,
    const struct pcap_pkthdr *header,
    const u_char *pkt_data
) {
    got_packet(pkt_data);
}
```

문제는 실제로 캡처된 패킷의 길이를 확인하지 않고 구조체 포인터를 통해 데이터에 접근한다는 것이다.

패킷이 잘렸거나 비정상적으로 짧은 경우 Out-of-Bounds Read가 발생할 수 있다.

따라서 `header->caplen`을 함께 전달하고, 각 헤더에 접근하기 전에 충분한 길이가 확보되어 있는지 확인해야 한다.

```c
void packet_handler(
    u_char *param,
    const struct pcap_pkthdr *header,
    const u_char *pkt_data
) {
    got_packet(pkt_data, header->caplen);
}
```

예를 들어 Ethernet 헤더에 접근하기 전에는 최소한 다음과 같은 검증이 필요하다.

```c
if (caplen < 14) {
    return;
}
```

이후 IP 헤더와 TCP 헤더에 접근할 때도 각각의 길이를 검증해야 한다.

네트워크에서 전달되는 데이터는 외부 입력이므로 신뢰해서는 안 된다.

## 7. 마무리

당시에는 Ethernet, IP, TCP 헤더가 어떤 구조로 이루어져 있는지 찾아보고, 포인터 연산을 통해 각 헤더의 위치를 계산하는 구조 등 네트워크 관련 지식과 C언어에 대한 기초지식이 모자라 코드를 이해하기 버거웠던 기억이 있다.

지금 다시 코드를 보니 단순히 패킷을 파싱하는 것뿐만 아니라 Endianness, Memory Alignment, Structure Padding, Bit Field, Out-of-Bounds Read 등 시스템 프로그래밍과 관련된 여러 개념이 포함되어 있었다.

특히 외부에서 전달되는 데이터를 파싱할 때 데이터의 길이와 구조를 검증하지 않는다는 점이 눈에 띈다.

당시에는 정상적인 패킷을 처리하는 것에만 집중했지만, 지금이라면 비정상적인 패킷이 들어왔을 때 프로그램이 어떻게 동작할지도 함께 고려해서 작성할 것 같다.