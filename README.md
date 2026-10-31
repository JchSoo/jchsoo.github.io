# trace.log — GitHub Pages 기술 블로그

> 개발과 보안을 공부하며 배운 것을 기록하기 위한 **개인 블로그 프로젝트**입니다. 프레임워크 없는 커스텀 디자인 + Jekyll + Markdown으로 구성했습니다.

## 1. GitHub Pages란?

GitHub Pages는 GitHub 저장소에 저장된 정적 사이트(HTML, CSS, JavaScript)를 웹사이트로 게시하는 서비스입니다. 이 프로젝트는 **Jekyll**을 사용해 Markdown 파일을 게시글 HTML로 자동 변환합니다. 서버/DB를 직접 운영할 필요가 없으며, 새 글을 작성한 후 저장소에 올리면 사이트에 반영됩니다.

- 공식 설명: https://docs.github.com/en/pages/quickstart
- 게시 설정: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## 2. 바로 배포하기 (GitHub 웹사이트만으로 가능)

1. GitHub 로그인 → **New repository**.
2. 저장소 이름을 **`YOUR_USERNAME.github.io`** 로 지정합니다. 여기서 `YOUR_USERNAME`은 **실제 GitHub 아이디**로 바꿉니다. 예: 아이디가 `octocat`이면 `octocat.github.io` (대소문자 주의).
3. GitHub Free 계정이라면 **Public**을 선택하고 저장소를 생성합니다.
4. 이 ZIP의 압축을 해제한 뒤, `trace-log-blog` **폴더 내부의 파일과 폴더**를 저장소 **최상위(root)**에 업로드합니다. `trace-log-blog` 폴더 자체를 통째로 한 단계 더 중첩하지 마세요. 숨김 파일 `.gitignore`는 생략해도 배포에 영향이 없습니다.
5. GitHub에서 `_config.yml` 파일을 수정해 다음 정보를 본인의 것으로 변경하고 커밋합니다.
   - `author`: 공개할 이름 또는 닉네임
   - `github_username`: 본인의 GitHub 아이디
   - `url`: `https://본인아이디.github.io` (맨 뒤 슬래시 없이)
   - `title`, `description`, `role`, `about_short`: 원하는 자기소개/브랜딩
6. 저장소의 **Settings → Pages → Build and deployment → Source: Deploy from a branch**를 선택하고, **Branch: main / (root)**를 선택 → **Save**.
7. GitHub의 **Actions** 탭에서 Pages 빌드/배포 결과를 확인한 후 `https://본인아이디.github.io`에 접속합니다. 첫 배포에는 수 분이 걸릴 수 있습니다.

**주의:** GitHub에 비밀번호, API 키, 비공개 취약점 정보 등 민감한 데이터를 올리지 마세요. GitHub Pages로 게시한 사이트는 공개 접근이 가능합니다.

### 터미널에서 업로드하고 싶은 경우

```bash
cd trace-log-blog
git init
git add .
git commit -m "Launch trace.log blog"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_USERNAME.github.io.git
git push -u origin main
```

기존 저장소에 이미 README나 커밋이 있다면 병합이 필요할 수 있습니다. 위 명령어의 아이디도 본인 것으로 수정하세요.

## 3. 카테고리 (6개)

| 메뉴에 보이는 이름 | 글의 `categories`에 사용할 코드 | 공개 주소 |
| --- | --- | --- |
| 개발 | `development` | `/categories/development/` |
| CTF/Wargame | `ctf-wargame` | `/categories/ctf-wargame/` |
| Bug Bounty | `bug-bounty` | `/categories/bug-bounty/` |
| 블로그/기술문서 | `docs` | `/categories/docs/` |
| 논문/컨퍼런스 | `research` | `/categories/research/` |
| 공모전/자격증 | `activities` | `/categories/activities/` |

카테고리 이름과 설명은 `_data/categories.yml`에서 수정할 수 있습니다. 단, `slug`를 바꾸면 해당 카테고리 페이지 파일과 기존 게시글도 함께 수정해야 합니다.

## 4. 새 게시글 쓰기

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

제공한 8개 게시글은 모두 `sample: true`가 붙은 **예시 글**입니다. 실제 개인 성과를 뜻하지 않으므로 자유롭게 수정하거나 삭제하세요.

## 6. 로컬에서 실행하기 (선택 사항)

Ruby와 Bundler가 준비되어 있다면:

```bash
bundle install
bundle exec jekyll serve
```

웹브라우저에서 `http://127.0.0.1:4000`으로 접속합니다. 환경에 따라 Ruby 및 빌드 의존성 설치가 필요할 수 있습니다.

## 7. 프로젝트 구조

```text
trace-log-blog/
├── _config.yml                 # 사이트 설정
├── _data/categories.yml        # 6개 카테고리 정의
├── _includes/                  # 헤더 / 푸터 / 글 카드
├── _layouts/                   # 공통 / 글 / 카테고리 레이아웃
├── _posts/                     # Markdown 게시글
├── categories/                 # 카테고리별 주소
├── assets/css/style.css        # 전체 커스텀 디자인
├── assets/js/main.js           # 검색, 메뉴, 테마, 필터
├── assets/images/favicon.svg   # 블로그 아이콘
├── index.html                  # 홈
├── archive.html                # 전체 글 및 필터
├── about.html                  # 자기소개
├── search.json                 # Jekyll 생성 검색 인덱스
├── feed.xml                    # RSS
└── README.md
```

## 8. 주요 기능

- 6개 고정 카테고리 및 각 페이지
- Markdown 기반 포스팅과 코드 블록
- 게시글 전체 검색 (제목/본문/태그)
- 카테고리별 목록 필터
- 모바일/데스크톱 반응형 디자인
- 다크/라이트 테마 전환
- RSS, SEO 기본 메타 태그, 404 페이지
- 별도 유료 호스팅이나 브라우저 JS 라이브러리 없이 사용 가능

---

이 프로젝트는 개인 실습·포트폴리오에 자유롭게 사용하고 수정할 수 있습니다. GitHub Pages 세부 제한과 배포 방식은 공식 문서를 참고하세요.
