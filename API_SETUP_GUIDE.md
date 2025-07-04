# 🔑 네이버 API 키 설정 가이드

이 가이드는 네이버 검색 API를 사용하여 한국 지역 여행 정보를 정확하게 검색하기 위한 설정 방법을 안내합니다.

## 📋 필요한 API 키

### 1. 네이버 API 키 (필수! 🇰🇷)
- **용도**: 한국 지역 장소 검색, 길찾기, 주소 변환
- **무료 할당량**: 일일 25,000회 (매우 넉넉함)
- **필요한 API**: 검색 API, 지도 API (Geocoding, Direction)
- **장점**: 한국 지역 데이터가 Google보다 훨씬 정확함

### 2. Google Generative AI API 키 (필수)
- **용도**: Gemini AI 모델 (AI 어시스턴트)
- **무료 할당량**: 매우 넉넉함
- **필요한 API**: Generative Language API

## 🚀 API 키 발급 방법

### 1. 네이버 API 키 발급 (한국 지역 데이터 최적화! 🇰🇷)

#### 기본 네이버 API (필수)
1. [네이버 개발자 센터](https://developers.naver.com/apps)에 접속
2. "애플리케이션 등록" 클릭
3. 애플리케이션 정보 입력:
   - **애플리케이션 이름**: 원하는 이름 입력 (예: "여행플래너")
   - **사용 API**: "검색", "Maps" 선택
   - **환경 추가**: "WEB 설정" 선택
   - **서비스 URL**: `http://localhost:3000` 입력
4. 생성된 **Client ID**와 **Client Secret** 복사

#### 네이버 클라우드 플랫폼 API (고급 길찾기용 - 선택사항)
1. [네이버 클라우드 플랫폼](https://www.ncloud.com/)에 접속
2. 콘솔 로그인
3. AI·NAVER API → Maps → Directions 5 API 신청
4. API 게이트웨이에서 **API KEY ID**와 **API KEY** 발급
5. 같은 Client ID/Secret으로 사용 가능 (기본 네이버 API와 동일)

### 2. Google Generative AI API 키 발급
1. [Google AI Studio](https://aistudio.google.com/app/apikey)에 접속
2. "Create API Key" 클릭
3. 프로젝트 선택 (또는 새로 생성)
4. 생성된 API 키를 복사
5. **주의**: 이 키는 Gemini AI 모델 사용을 위한 것입니다

## ⚙️ 환경 변수 설정

### .env.local 파일 생성/수정
프로젝트 루트의 `.env.local` 파일을 열고 다음과 같이 설정하세요:

```env
# Google Generative AI API 키 (Gemini AI용) - 필수
GOOGLE_GENERATIVE_AI_API_KEY=your_google_generative_ai_key_here

# 네이버 API 키 (한국 지역 검색용) - 필수
NAVER_CLIENT_ID=your_naver_client_id_here
NAVER_CLIENT_SECRET=your_naver_client_secret_here
```

**⚠️ 주의사항:**
- 모든 `your_...` 부분을 실제 API 키로 교체하세요
- 두 API 키 모두 필수입니다 (Gemini AI + 네이버 검색)
- 네이버 API는 한국 지역 정보가 가장 정확합니다! 🇰🇷
- API 키는 보안상 중요하므로 절대 공개하지 마세요

## 🔧 설정 완료 후 테스트

환경 변수 설정이 완료되면 다음 명령어로 애플리케이션을 실행하세요:

```bash
npm run dev
```

이제 실제 API 데이터를 사용할 수 있습니다!

## 📊 기능별 네이버 API 사용 현황

### ✅ 네이버 API 사용 도구들

#### 🇰🇷 네이버 기반 검색 도구들
- **naver_place_search**: 네이버 지역 검색 API
  - 한국 맛집, 관광지, 숙박시설 정확한 정보
  - 전화번호, 카테고리, 상세 설명 제공
  - HTML 태그 자동 정리

- **naver_geocoding**: 네이버 Geocoding API
  - 한국 주소 ↔ 좌표 변환
  - 도로명주소, 지번주소, 영문주소 모두 지원
  - 정확한 한국 주소 인식

- **naver_direction**: 네이버 Direction API (기본)
  - 한국 내 기본 길찾기
  - 통행료, 택시요금 계산
  - 거리, 소요시간 정보

- **naver_cloud_direction**: 네이버 클라우드 Directions 5 API (고급)
  - 실시간 교통 정보 반영
  - 다양한 경로 옵션 (빠른길, 편한길, 무료우선 등)
  - 상세한 요금 정보 (통행료, 택시요금, 예상 유류비)
  - 주요 도로 경로 안내

#### 🤖 AI 기반 도구들
- **itinerary_manager**: 여행 일정 저장/조회
- **budget_calculator**: 여행 예산 관리

### 🔄 주요 특징
- **한국 특화**: 네이버 API로 한국 지역 정보 최적화
- **실시간 정보**: 통행료, 택시요금까지 실시간 제공
- **정확한 데이터**: Google보다 한국 지역은 훨씬 정확
- **에러 처리**: 네이버 API 전용 오류 안내

## 🎯 결과

이제 한국 여행 관련 질문을 하면:

### 🇰🇷 네이버 API로 정확한 한국 정보를!
- **맛집/관광지 검색**: 전화번호, 카테고리, 상세 설명
- **기본 길찾기**: 통행료, 택시요금, 기본 경로
- **고급 길찾기**: 실시간 교통, 다양한 경로 옵션, 상세 요금 (통행료+택시요금+유류비)
- **주소 변환**: 도로명주소, 지번주소, 좌표
- **실시간 정보**: 한국 지역에 특화된 정확한 데이터

### 🤖 AI 기능들
- **일정 관리**: 여행 일정 저장/조회
- **예산 계산**: 여행 경비 관리
- **상담**: 친근한 AI 여행 플래너

를 제공받을 수 있습니다!

## 💡 팁

### 비용 최적화
- 네이버 API는 일일 25,000회 무료 (매우 넉넉함)
- Google Generative AI API도 무료 할당량이 넉넉함
- 개발/테스트 시 걱정 없이 사용 가능

### 보안
- `.env.local` 파일은 `.gitignore`에 포함되어 있어 Git에 업로드되지 않음
- API 키는 절대 코드에 직접 입력하지 마세요 