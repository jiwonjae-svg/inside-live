# PWA 아이콘 생성 가이드

PWA(Progressive Web App)로 설치하려면 앱 아이콘이 필요합니다.

## 필요한 아이콘 크기

- **192x192 픽셀** - 기본 앱 아이콘
- **512x512 픽셀** - 고해상도 앱 아이콘

## 방법 1: 온라인 도구로 생성 (추천)

### Favicon.io 사용
1. [https://favicon.io/](https://favicon.io/) 접속
2. "Text" 탭 선택
3. 설정:
   - Text: **SNS** 또는 **커뮤니티**
   - Background: **Linear Gradient** (예: #667eea to #764ba2)
   - Font: **Roboto** (또는 원하는 폰트)
   - Font Size: **120**
   - Shape: **Rounded**
   - Font Color: **White**

4. "Download" 클릭
5. 압축 해제 후 필요한 파일:
   - `android-chrome-192x192.png` → `public/icon-192x192.png`
   - `android-chrome-512x512.png` → `public/icon-512x512.png`
   - `apple-touch-icon.png` → `public/apple-touch-icon.png`

### PWA Icon Generator 사용
1. [https://www.pwabuilder.com/imageGenerator](https://www.pwabuilder.com/imageGenerator) 접속
2. 기본 이미지 (최소 512x512) 업로드
3. 모든 크기의 아이콘 자동 생성
4. 다운로드 후 `public/` 폴더에 복사

## 방법 2: 포토샵/GIMP로 직접 제작

### 디자인 가이드라인

**192x192 아이콘:**
\`\`\`
크기: 192x192px
포맷: PNG (투명 배경)
안전 영역: 40px 패딩 (중앙 112x112px 사용)
배경: 그라디언트 또는 단색
아이콘: 심플한 로고나 글자
\`\`\`

**512x512 아이콘:**
\`\`\`
크기: 512x512px
포맷: PNG (투명 배경)
안전 영역: 106px 패딩 (중앙 300x300px 사용)
배경: 192x192와 동일한 디자인
고해상도: 선명하게 보이도록 벡터 사용
\`\`\`

### Photoshop 단계
1. 새 파일: 512x512px, RGB 모드
2. 배경 레이어:
   - 그라디언트 적용 (#667eea → #764ba2)
   - 또는 단색 (#667eea)
3. 텍스트/로고 추가:
   - 폰트: Bold, 백색
   - 중앙 정렬
   - 여백 고려
4. 저장:
   - 512x512: `icon-512x512.png`
   - 이미지 크기 조정 → 192x192: `icon-192x192.png`

### GIMP 단계
1. 파일 > 새 이미지: 512x512px
2. 그라디언트 도구로 배경 채우기
3. 텍스트 도구: "SNS" 또는 원하는 텍스트
4. 내보내기: PNG
5. 이미지 > 크기 조정 → 192x192px로 복사본 저장

## 방법 3: Canva로 제작 (가장 쉬움)

1. [Canva.com](https://www.canva.com/) 접속
2. "Create a design" > "Custom size": 512x512px
3. 템플릿 선택 또는 직접 디자인:
   - 배경: 그라디언트나 단색
   - 텍스트: "SNS", "커뮤니티" 등
   - 아이콘: 채팅, 사람, 게시판 관련 아이콘
4. 다운로드: PNG, 512x512px
5. Canva에서 192x192px 버전도 생성

## 방법 4: AI 도구로 생성

### Microsoft Designer (무료)
1. [https://designer.microsoft.com/](https://designer.microsoft.com/) 접속
2. 프롬프트 입력:
   ```
   Simple app icon for community board, purple gradient background,
   white text "SNS", rounded corners, modern design
   ```
3. 생성된 이미지 다운로드 및 크기 조정

### Midjourney/DALL-E
\`\`\`
프롬프트: 
"app icon design, community board logo, gradient purple to blue background,
minimalist, rounded square, white icon, 512x512, modern flat design"
\`\`\`

## 파일 배치

생성된 아이콘을 다음 위치에 저장:

\`\`\`
public/
├── icon-192x192.png        # 192x192 아이콘
├── icon-512x512.png        # 512x512 아이콘
└── apple-touch-icon.png    # iOS용 (180x180 권장)
\`\`\`

## manifest.json 업데이트

아이콘을 생성한 후 [public/manifest.json](public/manifest.json)에서 경로 확인:

\`\`\`json
{
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
\`\`\`

## 디자인 아이디어

### 1. 심플 텍스트
- 배경: 보라색 그라디언트
- 텍스트: "SNS" 또는 "커뮤니티"
- 폰트: Bold, 백색

### 2. 채팅 아이콘
- 배경: 블루 그라디언트
- 아이콘: 말풍선 3개
- 색상: 화이트

### 3. 게시판 아이콘
- 배경: 보라-핑크 그라디언트
- 아이콘: 문서/리스트 아이콘
- 색상: 화이트

### 4. 사람 아이콘
- 배경: 그라디언트
- 아이콘: 사람 3명 실루엣
- 색상: 화이트

## 빠른 임시 아이콘 (텍스트 기반)

Python으로 간단히 생성:

\`\`\`python
from PIL import Image, ImageDraw, ImageFont

# 512x512 아이콘 생성
img = Image.new('RGB', (512, 512), color=(102, 126, 234))
draw = ImageDraw.Draw(img)

# 텍스트 추가 (폰트 크기 조정 필요)
font = ImageFont.truetype("arial.ttf", 200)
text = "SNS"
bbox = draw.textbbox((0, 0), text, font=font)
text_width = bbox[2] - bbox[0]
text_height = bbox[3] - bbox[1]
position = ((512 - text_width) // 2, (512 - text_height) // 2)
draw.text(position, text, fill=(255, 255, 255), font=font)

img.save('public/icon-512x512.png')

# 192x192 버전
img_small = img.resize((192, 192), Image.Resampling.LANCZOS)
img_small.save('public/icon-192x192.png')
\`\`\`

## 테스트

아이콘 적용 후:

1. 개발 서버 재시작
2. 브라우저에서 주소창 확인 (파비콘)
3. Chrome DevTools > Application > Manifest 확인
4. PWA 설치 테스트

## 권장 색상 팔레트

\`\`\`css
/* 보라색 그라디언트 */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* 블루 그라디언트 */
background: linear-gradient(135deg, #4158D0 0%, #C850C0 100%);

/* 핑크-오렌지 그라디언트 */
background: linear-gradient(135deg, #FA8BFF 0%, #2BD2FF 100%);

/* 그린-블루 그라디언트 */
background: linear-gradient(135deg, #43CBFF 0%, #9708CC 100%);
\`\`\`

## 참고 자료

- [PWA Icon Guidelines](https://web.dev/add-manifest/)
- [Android Adaptive Icons](https://developer.android.com/guide/practices/ui_guidelines/icon_design_adaptive)
- [iOS Icon Guidelines](https://developer.apple.com/design/human-interface-guidelines/app-icons)

---

**TIP:** 가장 빠른 방법은 Favicon.io나 Canva를 사용하는 것입니다!
