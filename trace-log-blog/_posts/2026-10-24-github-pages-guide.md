---
layout: post
title: "GitHub Pages로 기술 블로그 운영하기"
description: "GitHub 저장소와 Jekyll을 이용해 Markdown 기반 블로그를 공개하는 흐름."
categories: [docs]
tags: [github-pages, jekyll, markdown]
sample: true
---

## GitHub Pages란?

GitHub Pages는 GitHub 저장소의 파일을 웹사이트로 게시할 수 있는 정적 사이트 호스팅 기능입니다. 별도 서버를 직접 관리하지 않고도 개인 소개 페이지나 블로그를 운영할 수 있습니다.

**GitHub Pages**는 호스팅 기능이고, **Jekyll**은 Markdown 글과 레이아웃을 HTML로 변환하는 정적 사이트 생성기입니다.

## 이 블로그에서 사용하는 구조

- `_posts/`: 날짜와 제목을 포함한 Markdown 글
- `_layouts/`: 공통 페이지 템플릿
- `_data/categories.yml`: 카테고리별 이름과 설명
- `assets/`: CSS, JavaScript, 아이콘
- `_config.yml`: 블로그 이름, 주소, 자기소개 설정

## 새로운 글을 쓰는 방법

`_posts/2026-10-30-new-note.md` 파일을 만들고 다음 형식을 사용합니다.

```yaml
---
layout: post
title: "새 글 제목"
description: "글에 대한 간략한 소개"
categories: [development]
tags: [note, learning]
---
```

아래에 일반 Markdown 본문을 작성하고 저장소에 push하면 GitHub Pages가 변경 내용을 반영합니다.

자세한 배포 단계는 프로젝트의 `README.md`를 참고하세요.
