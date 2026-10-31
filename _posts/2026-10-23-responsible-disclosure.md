---
layout: post
title: "Bug Bounty 기록과 책임 있는 제보 원칙"
description: "허가된 범위에서 보안 테스트를 수행하고 발견 내용을 문서화하는 기준."
categories: [bug-bounty]
tags: [bug-bounty, disclosure, security]
sample: true
---

## 먼저 범위를 확인한다

Bug Bounty에서는 기술적 능력만큼 **테스트 허용 범위(scope)**를 확인하는 일이 중요합니다.

- 대상 도메인과 시스템이 프로그램 범위에 포함되는가?
- 금지된 테스트 유형이나 요청량 제한이 있는가?
- 민감한 데이터에 접근했을 때 즉시 중단해야 하는가?
- 공개 시점과 제보 채널은 어떻게 정해져 있는가?

## 제보 문서의 기본 구성

좋은 제보는 담당자가 문제를 이해하고 재현하는 데 도움이 됩니다.

| 항목 | 설명 |
| --- | --- |
| Summary | 취약점의 핵심을 한두 문장으로 설명 |
| Affected asset | 범위 내 영향 대상 |
| Preconditions | 재현을 위한 전제 조건 |
| Steps to reproduce | 허용된 환경에서의 최소 재현 절차 |
| Impact | 확인된 영향과 한계 |
| Mitigation | 가능한 대응 방향 |

## 기록과 공개

실제 서비스의 취약점 정보는 프로그램 규정에 따라 보관하고, 공개 허가 전에는 민감한 재현 정보나 타인의 데이터를 게시하지 않습니다.
