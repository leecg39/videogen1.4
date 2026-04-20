# Scene ↔ SC Reference Mapping (B 방식 제안)

> 2026-04-17 작성. `docs/design-system.md v2` §5-2 씬 유형 10종 + `reference/SC 1~61.png` + 유튜버 벤치마크(`/tmp/yt-ref/frames/*.png`) 에서 도출.
> 각 씬은 narration 중심 재해석 — pattern_ref 는 참고용 (realize 강제 아님).
> 사용자 승인 후 `절대좌표 + FreeText + SvgGraphic` 으로 author.

## 씬 유형 10종

| 코드 | 유형 | 전형 재료 |
|---|---|---|
| **HI** | hero intro | wordmark + 주간 bar + mint footer |
| **MP** | metric punch | 거대 숫자 (≥150px) + 1줄 marker |
| **CT** | contrast | Split 2 카드 (mint vs dark) |
| **LI** | listing | 번호원/이모지 + 큰 본문 반복 |
| **FL** | flow | 박스 → 화살표 → 박스 |
| **QT** | quote/text-only | 거대 텍스트 + pull quote |
| **CS** | case study | 인물/로고 + 제목 + 부연 |
| **HS** | hub-satellite | 중앙 filled + 6-8 satellite |
| **PA** | pause/warning | 아이콘 + 배지 + 짧은 문장 |
| **CH** | chapter header | 큰 pill + 대형 제목 + 서브 |

---

## 78 씬 매핑표

| # | dur | 유형 | SC | narration 요약 | 핵심 재료 |
|--:|--:|---|---|---|---|
| 0 | 8.9s | **HI** | SC 1 + SC 2 | 바이브랩스 인사 · 화요일 · AI 쉬지 않음 | 듀오톤 wordmark "바이브랩스" + 주간 7bar (화요일 accent) + mint footer |
| 1 | 12.3s | **LI** | SC 5 + YT 25 | 오늘 4뉴스 예고 | 번호원 1·2·3·4 + 큰 본문 4줄 (마지막 mint) |
| 2 | 9.2s | **CH** | SC 32 | 후반 예고 (울트라/GPT6) | "오늘의 후반" pill + 2 DevIcon 대비 |
| 3 | 10.9s | **CH** | SC 32 | 뉴스1 헤더 · 토큰 소진 | "뉴스 01" 큰 pill + 대헤드라인 "몇 분만에 한도 도달" + Anthropic icon |
| 4 | 9.4s | **MP** | SC 11 | 커뮤니티 반발 100% | Ring 100% + 3 불만 경로 bullet |
| 5 | 10.2s | **MP** | SC 30 | 10/79/100% 3단계 소진 | 3 Ring triplet (대화 → 질문 → 하루치) |
| 6 | 9.3s | **MP** | SC 8 | 10% 대화 한 번에 증발 | 10% 거대 숫자 + "21→100 단일 점프" marker |
| 7 | 11.8s | **CT** | SC 3 | 100달러 요금 8h vs 1h | VersusCard yellow accent (기대 vs 현실) |
| 8 | 9.7s | **MP** | SC 8 | 19분 극단 사례 | 19 거대 숫자 + 분 suffix + 극단 marker |
| 9 | 10.6s | **LI** | SC 1/60 | 레딧/GitHub 불만 분포 | VerticalBars 4 (레딧 accent) |
| 10 | 8.6s | **FL** | SC 25 | 원인① 이벤트 종료 | Timeline 3 step (3월말 이벤트 → 종료 → 절반 체감) |
| 11 | 9.7s | **LI** | YT 25 / SC 9 | 원인② 피크 요금 3축 | 3 이모지 (⏰ 피크 / 🔁 가속 / 📉 체감) |
| 12 | 9.0s | **CT** | SC 3 + arrow | 한적 20% vs 피크 40% | Split arrow (20 → 40) |
| 13 | 10.3s | **PA** | SC 8 + YT 40 | 원인③ 캐시 버그 | warning triangle + "원인③" badge + 커스텀 SVG 다이어그램 (이전대화 → 캐시 박스) |
| 14 | 9.7s | **MP** | SC 8 | 20배 비용 폭등 | 20배 거대 숫자 + "10→20배 롤백 정상화" marker |
| 15 | 9.3s | **CS** | SC 18 / SC 45 | 엔트로픽 공식 인정 | Anthropic circle + pull quote "예상보다 빨리 한도..." |
| 16 | 11.9s | **FL** | SC 25 | 의심 정황 3단계 | Timeline 3 step (소스유출 → 외부수정 → 뜨끈미지근) |
| 17 | 10.4s | **LI** | SC 60 | 투명성 부재 4불만 | VerticalBars 4 (한도불명 accent / 사용량 / 계획 / 가격) |
| 18 | 8.0s | **QT** | SC 19 | 레딧 인용 "투명성 없는..." | Ring 80 + 거대 pull quote |
| 19 | 8.8s | **FL** | SC 25 + YT 40 | 코딩 몰입 4흐름 | FlowDiagram 4 (몰입 → 프롬프트 → 중단 → 복귀) |
| 20 | 9.6s | **PA** | SC 8 | 실무 주의 · 대안 | warning triangle + "실무 주의" badge + 헤드라인 |
| 21 | 7.4s | **CT** | SC 3 | 마감 리스크 | VersusCard yellow (필요할 때 작동 / 갑자기 정지) |
| 22 | 13.2s | **CH** | SC 32 | 뉴스2 헤더 · 로컬 AI | "뉴스 02" pill + "내 맥북 AI 가 클라우드 이김" + 서브 marker |
| 23 | 8.1s | **MP** | SC 8 | 4/2 Gemma 4 공개 | 4/2 거대 숫자 + Gemma 4 오픈 웨이트 marker |
| 24 | 10.7s | **LI** | SC 60 | Apache 2.0 4 권리 | 4 CheckMark row (개인 / 기업 / 수정 / 재배포) |
| 25 | 10.9s | **MP** | SC 8 | 최소 모델 2.3B | 2.3B 거대 숫자 + "노트북 즉시 실행" marker |
| 26 | 9.3s | **MP** | SC 8 + 2ring | 최대 모델 31B · 89/80점 | 31B 거대 + 2 small Ring (89 수학 / 80 코딩) |
| 27 | 10.7s | **CS** | SC 45 | 커뮤니티 실험자 | 인물 이모지 + 실험 제목 + 서브 |
| 28 | 11.7s | **MP** | SC 60 | MLX 3-4배 속도 | VerticalBars 3 (기본 / vLLM / MLX accent) + marker |
| 29 | 11.6s | **LI** | SC 9 | 3 용어 정리 | ChatBubble 대화 + 3 CheckMark (vLLM / MLX / Ollama) |
| 30 | 9.9s | **MP** | SC 8 + GitHub | GitHub 75K 스타 | GitHub circle + 75K+ 거대 숫자 + "사실상 표준" marker |
| 31 | 13.7s | **CS** | SC 18 | MLX 애플 제작 | Apple circle + "M1-M4 성능 최대" marker |
| 32 | 13.3s | **TE** (터미널) | SC 56 / YT 10 | Ollama 2줄 실행 | TerminalBlock 3줄 + "두 줄로 AI 실행" marker |
| 33 | 10.2s | **LI** | YT 25 | 3 도구 조합 권장 | 3 이모지 (🚀 초급 / ⚙️ 중급 / 🍎 맥) |
| 34 | 8.5s | **CT** | SC 3 | 구독 vs 무료 로컬 | VersusCard yellow (기존 / 대안) |
| 35 | 8.2s | **HS** | SC 27 | 내 PC 중심 4장점 | Hub-satellite — filled mint 중앙 "내 PC" + 4 stroke sat (오프라인/무료/즉시/개인정보) |
| 36 | 11.2s | **LI** | YT 25 | 수혜자 3 프로필 | 3 이모지 (🏢 기밀 / 💼 1인 / 🛡️ 보안) |
| 37 | 11.2s | **MP** | SC 8 | 80% 로컬 전략 | 80% 거대 + "10-20% 유료 전용" marker |
| 38 | 10.9s | **CH** | SC 32 | 뉴스3 헤더 · 울트라 플랜 | "뉴스 03" pill + "기획 클라우드 실행 로컬" 대헤드라인 |
| 39 | 11.1s | **LI** | YT 25 | 울트라 3 기능 | 3 이모지 (☁️ 기획 accent / 💻 로컬 / 🌐 웹) |
| 40 | 7.2s | **MP** | SC 60 | 기존 직렬 대기 | VerticalBars 3 (질문 / AI 대기 accent / 검토) |
| 41 | 8.8s | **TE** | SC 56 | /ultraplan 커맨드 | TerminalBlock 3줄 + "추론 구름 위로" marker |
| 42 | 11.0s | **FL** | SC 25 | 작업 흐름 3단계 | FlowDiagram 3 box (프롬프트 → 클라우드 → 반환) |
| 43 | 11.6s | **FL** | SC 25 | 클라우드 기획 4단계 | Timeline 4 step (파악 → 파일 → 순서 → 기획서) |
| 44 | 12.8s | **MP** | SC 8 | 30분 전담 AI | 30분 거대 + "Opus 4.6 · 두 축 병렬" marker |
| 45 | 9.9s | **CT** | SC 3 + arrow | 터미널 + 브라우저 분리 | Split arrow (💻 터미널 / 🌐 브라우저) |
| 46 | 7.0s | **MP** | SC 11 | 기획서 부분 코멘트 | Ring 100 + "인라인 지적" marker |
| 47 | 9.4s | **CT** | SC 3 | 수정 후 2 선택 | Split 2 (☁️ 클라우드 계속 / 🖥️ 로컬 복귀) |
| 48 | 10.5s | **TE** | SC 56 | 쇼핑몰 프롬프트 | TerminalBlock 3줄 + 자동 설계 marker |
| 49 | 5.7s | **LI** | SC 5 | 쇼핑몰 4요소 | 4 CheckMark (회원가입 / 결제 / 관리자 / 상품) |
| 50 | 9.3s | **LI** | YT 25 | AI 자율 + 병렬 | 3 이모지 (🤖 AI accent / 🧑 사용자 / 🕒 시간) |
| 51 | 7.9s | **MP** | SC 8 | 30분 혁신 | 30분 거대 + "몇주 → 30분" marker |
| 52 | 10.4s | **CH** | SC 32 | 뉴스4 헤더 · GPT6 | "뉴스 04" pill + "4월 14일 출시설" 대헤드라인 + 서브 |
| 53 | 11.5s | **CS** | SC 18 | OpenAI 공개 주장 | OpenAI circle + "4/14 공개" marker + 출처 미검증 서브 |
| 54 | 12.3s | **MP** | SC 8 + check | GPT5.4 대비 +40% | +40% 거대 + 3 CheckMark (코딩 / 추론 / 에이전트) |
| 55 | 8.4s | **CT** | SC 3 | GPT5 vs GPT6 하네스 | VersusCard (GPT-5 열세 / GPT-6 반격) |
| 56 | 8.1s | **MP** | SC 8 | 200만 토큰 컨텍스트 | 200만 거대 + "책 15권 분량" marker |
| 57 | 10.6s | **FL** | SC 25 | 공식 확인 타임라인 | Horizontal Timeline 3 dot (2025 / 루머 4/14 / 2026) + "공식 확인 없음" marker |
| 58 | 9.9s | **LI** | YT 25 | 소문 확산 3이유 | 3 이모지 (🔥 Gemma / 📈 Claude / 😶 OpenAI accent) |
| 59 | 8.9s | **MP** | SC 11 | 엔트로픽 시장장악 85% | Ring 85 + "매출 수배 성장" marker |
| 60 | 8.4s | **MP** | SC 30 | OpenAI 포트폴리오 3 | 3 Ring (30 Sora / 20 축소 / 100 AI accent) |
| 61 | 8.4s | **LI** | YT 25 | 에이전트 3 feature | 3 이모지 (🔍 리서치 / 🛠️ 코드 / 🧠 자율 accent) |
| 62 | 8.1s | **CT** | SC 3 + arrow | 사람 개입 → AI 자율 | Split arrow (🧑 사람 / 🤖 AI) |
| 63 | 8.6s | **HS** | SC 27 | AI 비서 실무 예 | Hub-satellite (filled mint 중앙 "내 AI 비서" + 3 task sat) |
| 64 | 9.7s | **HS** | SC 27 | 위임 모델 4단계 | Hub-satellite (중앙 AI + 4 sat: 리서치/요약/리포트/배송) |
| 65 | 9.9s | **QT** | SC 19 | 시장 조용한 주 0 | 0 거대 숫자 + "AI 시장 한 주도 쉬지 않음" + 4 뉴스 축약 |
| 66 | 7.2s | **CT** | SC 3 | 답답 vs 반격 | Split 2 이모지 (😵 유료 답답 / 💪 로컬 반격) |
| 67 | 13.3s | **MP** | SC 11 | 클라우드 고지능 90% | Ring 90 + "울트라/GPT6 루머" marker |
| 68 | 10.4s | **FL** | SC 25 + YT 40 | 수렴 그림 4 box | FlowDiagram 4 box (간단 → 로컬 / 복잡 → 클라우드 accent) |
| 69 | 11.6s | **CT** | SC 3 + SC 19 | 메모 vs 문서 비유 | Split 2 (📝 수첩 / 💾 컴퓨터) + "AI 도 골라 쓰는 시대" marker |
| 70 | 10.7s | **MP** | SC 30 | 도구 폭발 전망 | 3 Ring (40 오늘 / 70 6개월 / 100 1년 accent) |
| 71 | 8.5s | **QT** | SC 19 | 시키는 일 고민 중요 | 거대 text "AI 가 해줄 수 있는 일" + 3 CheckMark (코드/기획/번역) |
| 72 | 12.2s | **CT** | SC 3 | AI 담당 / 사람 담당 | VersusCard (번역·코드·기획 / 판단 사람 영역) |
| 73 | 9.2s | **HS** | SC 27 | 일상 관찰 루프 | Hub-satellite (중앙 "관찰 → 위임" + 4 sat: 반복/문제/위임/자동) |
| 74 | 10.2s | **MP** | SC 11 | 관찰 눈 80% | Ring 80 + "눈이 생기면 도구는 따라온다" marker |
| 75 | 7.7s | **LI** | SC 16 | 오늘 4뉴스 요약 | 4 FrameBox Grid (뉴스1 토큰 / 2 로컬 / 3 울트라 / 4 GPT6) |
| 76 | 9.9s | **LI** | YT 25 | 구독/좋아요/알림 | 3 CheckMark (구독 / 좋아요 / 알림) |
| 77 | 4.8s | **HI** | SC 2 | 엔딩 "또 만나요" | 듀오톤 wordmark "다음에 또 만나요" + "바이브뉴스" pill |

---

## 집계

### 씬 유형 분포
| 유형 | 수 | % |
|---|---:|---:|
| MP (metric punch) | 20 | 26% |
| LI (listing) | 15 | 19% |
| CT (contrast) | 13 | 17% |
| FL (flow) | 9 | 12% |
| CH (chapter header) | 7 | 9% |
| HS (hub-satellite) | 4 | 5% |
| CS (case study) | 4 | 5% |
| TE (terminal) | 4 | 5% |
| QT (quote/text-only) | 3 | 4% |
| PA (pause/warning) | 2 | 3% |
| HI (hero intro) | 2 | 3% |

### 주요 SC 참조 분포
| SC | 사용 횟수 | 용도 |
|---|---:|---|
| SC 8 (hero number + marker) | 14 | metric punch 대부분 |
| SC 3 (2-card split) | 13 | contrast 전체 |
| SC 25 (timeline) | 9 | flow 전체 |
| YT 25 (번호 listing) | 8 | listing 일부 |
| SC 32 (chapter pill) | 7 | chapter header 전체 |
| SC 11 (Ring + bullet) | 6 | 단일 metric ring |
| SC 30 (3 Ring) | 4 | triplet metric |
| SC 27 (hub-satellite) | 4 | HS 전체 |
| SC 56 (terminal) | 4 | TE 전체 |
| SC 60 (vertical bars) | 4 | listing/contrast bar |
| SC 18 (brand+marker) | 3 | CS 일부 |
| SC 5 (numbered headline) | 2 | listing intro |
| SC 19 (doc + quote) | 3 | quote/text-only |
| SC 2 (wordmark) | 2 | hero intro |
| SC 45 (인물) | 1 | CS 1 |
| SC 16 (3 박스 row) | 1 | LI 1 |

### Bar-family 사용 추정
- CompareBars 0 · VerticalBars 4 (sc 9, 17, 28, 40) · ProgressBar 0 → **합산 4 ≤ 8 통과**

### Warning triangle 사용
- scene-13 (캐시 버그), scene-20 (실무 주의) → **2개 · narration 매치 · 통과**

---

## 사용자 승인 요청

이 매핑대로 진행하면:
1. pattern_ref 체계는 계속 유지 (validate-visual-plan-coverage 통과용)
2. 각 씬 재설계는 위 "핵심 재료" 기반, SC 참조는 구도 학습용 (복사 아님)
3. `Absolute + FreeText + SvgGraphic` 주력 + prefab 보조
4. 77씬 대부분에 CH/MP/LI/CT 다양성 확보 (기존 shape 반복 자연 해소)

**변경 요청 가능 항목:**
- 특정 씬의 유형 재분류
- SC 참조 추가/교체 (특정 씬에 원하는 SC 번호 있으면)
- 핵심 재료 추가/변경

---

*버전: v1.0 — 2026-04-17 작성*
