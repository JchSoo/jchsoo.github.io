# trace.log — GitHub Pages 기술 블로그

> 개발과 보안을 공부하며 배운 것을 기록하기 위한 **개인 블로그 프로젝트**입니다. 프레임워크 없는 커스텀 디자인 + Jekyll + Markdown으로 구성했습니다.

## 카테고리 (6개)

| 메뉴에 보이는 이름 | 글의 `categories`에 사용할 코드 | 공개 주소 |
| --- | --- | --- |
| 개발 | `development` | `/categories/development/` |
| CTF/Wargame | `ctf-wargame` | `/categories/ctf-wargame/` |
| Bug Bounty | `bug-bounty` | `/categories/bug-bounty/` |
| 블로그/기술문서 | `docs` | `/categories/docs/` |
| 논문/컨퍼런스 | `research` | `/categories/research/` |
| 공모전/자격증 | `activities` | `/categories/activities/` |


## 새 게시글 쓰기

`_posts/` 폴더에 **`YYYY-MM-DD-english-title.md`** 형식으로 파일을 추가합니다. 예를 들어 `_posts/2026-10-30-my-first-post.md`:

````md
---
layout: post
title: "나의 첫 번째 글"
description: "이 글에서 다룰 내용입니다."
categories: [development]
tags: [programming, notes]
---

## 시작하며

여기에 Markdown으로 글을 작성하세요.

### 코드 예시

```python
print("Hello, trace.log!")
```
````

- `categories`에는 **6개 카테고리 코드 중 하나**를 입력하세요.
- `sample: true`는 **예시 글 표시**입니다. 실제 글에서는 제거하세요.
- `_posts/_POST_TEMPLATE.md.txt`를 복사해 `.md` 파일로 만들면 편합니다.
- **게시글의 작성일을 미래로 설정하면** GitHub Pages/Jekyll 설정에 따라 글이 바로 보이지 않을 수 있습니다.
- 글에 이미지가 필요하면 `assets/images/`에 넣고 `![설명]({{ '/assets/images/image.png' | relative_url }})`처럼 참조하면 됩니다. 이 Liquid 식은 Jekyll 게시글 내부에서 사용할 수 있습니다.

## 5. 내 블로그로 꾸미기

| 수정하고 싶은 항목 | 파일 |
| --- | --- |
| 블로그 이름, 자기소개, GitHub 아이디, 메일 | `_config.yml` |
| About 소개 문장, 관심 분야 | `about.html` |
| 메인 헤드라인과 터미널 내용 | `index.html` |
| 6개 메뉴, 설명 | `_data/categories.yml` |
| 색상, 폰트, 카드, 반응형 레이아웃 | `assets/css/style.css` (파일 상단 `:root`) |
| 검색, 테마 전환, 필터 동작 | `assets/js/main.js` |
| 프로필 대신 쓸 파비콘 | `assets/images/favicon.svg` |
| 블로그 글 | `_posts/*.md` |
