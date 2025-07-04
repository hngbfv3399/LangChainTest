# 🔑 여행 AI API 키 설정 가이드

이 가이드는 Google Maps API와 OpenWeatherMap API를 사용하여 전 세계 여행 정보와 실시간 날씨를 정확하게 제공하기 위한 설정 방법을 안내합니다.

## 📋 필요한 API 키

### 1. Google Maps API 키 (필수! 🗺️)
- **용도**: 장소 검색, 거리 계산, 길찾기
- **무료 할당량**: 월 $200 크레딧 (매우 넉넉함)
- **필요한 API**: Places API, Distance Matrix API, Geocoding API
- **장점**: 전 세계 장소 데이터가 매우 정확함

### 2. OpenWeatherMap API 키 (필수! 🌤️)
- **용도**: 실시간 날씨 정보 제공
- **무료 할당량**: 일일 1,000회 호출 (개인 사용 충분)
- **필요한 API**: Current Weather Data API
- **장점**: 한국 포함 전 세계 날씨 정보 지원

### 3. Google Generative AI API 키 (필수)
- **용도**: Gemini AI 모델 (AI 어시스턴트)
- **무료 할당량**: 매우 넉넉함
- **필요한 API**: Generative Language API

## 🚀 API 키 발급 방법

### 1. Google Maps API 키 발급 (전 세계 장소 데이터! 🗺️)

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. "API 및 서비스" → "라이브러리" 이동
4. 다음 API들을 검색하여 활성화:
   - **Places API** (장소 검색용)
   - **Distance Matrix API** (거리 계산용)
   - **Geocoding API** (주소↔좌표 변환용)
5. "API 및 서비스" → "사용자 인증 정보" 이동
6. "사용자 인증 정보 만들기" → "API 키" 선택
7. 생성된 **API 키** 복사
8. API 키 제한 설정 (선택사항):
   - HTTP 리퍼러 제한: `localhost:3000/*`, `your-domain.com/*`
   - API 제한: Places API, Distance Matrix API, Geocoding API만 선택

### 2. OpenWeatherMap API 키 발급 (실시간 날씨! 🌤️)

1. [OpenWeatherMap](https://openweathermap.org/)에 접속
2. "Sign Up" 클릭하여 무료 계정 생성
3. 이메일 인증 완료
4. 로그인 후 "API keys" 탭 이동
5. Default API 키를 확인하거나 "Generate" 버튼으로 새 API 키 생성
6. 생성된 **API 키** 복사
7. **참고**: API 키 활성화까지 최대 2시간 소요될 수 있음

### 3. Google Generative AI API 키 발급

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

# Google Maps API 키 (장소 검색, 거리 계산용) - 필수
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# OpenWeatherMap API 키 (날씨 정보용) - 필수
OPENWEATHER_API_KEY=your_openweather_api_key_here
```

**⚠️ 주의사항:**
- 모든 `your_...` 부분을 실제 API 키로 교체하세요
- 세 개의 API 키 모두 필수입니다 (Gemini AI + Google Maps + OpenWeatherMap)
- Google Maps API는 전 세계 장소 정보가 가장 정확합니다! 🗺️
- OpenWeatherMap API는 한국 포함 전 세계 날씨를 지원합니다! 🌤️
- API 키는 보안상 중요하므로 절대 공개하지 마세요

## 🔧 설정 완료 후 테스트

환경 변수 설정이 완료되면 다음 명령어로 애플리케이션을 실행하세요:

```bash
npm run dev
```

이제 실제 API 데이터를 사용할 수 있습니다!

## 📊 기능별 API 사용 현황

### ✅ Google Maps & OpenWeatherMap API 사용 도구들

#### 🗺️ Google Maps 기반 도구들
- **place_search**: Google Places API
  - 전 세계 맛집, 관광지, 숙박시설 정확한 정보
  - 평점, 가격대, 상세 주소 제공
  - 한국어 도시명 자동 번역 지원

- **distance_calculator**: Google Distance Matrix API
  - 전 세계 거리 및 이동시간 계산
  - 다양한 교통수단 지원 (자동차, 대중교통, 도보)
  - 실시간 교통 정보 반영

#### 🌤️ OpenWeatherMap 기반 도구들
- **travel_weather**: OpenWeatherMap Current Weather API
  - 전 세계 실시간 날씨 정보
  - 한국 지역 완벽 지원
  - 기온, 체감온도, 습도, 바람, 기압, 시야 등 상세 정보
  - 날씨별 여행 팁 제공

#### 🤖 AI 기반 도구들
- **itinerary_manager**: 여행 일정 저장/조회
- **budget_calculator**: 여행 예산 관리

### 🔄 주요 특징
- **전 세계 지원**: Google Maps와 OpenWeatherMap으로 전 세계 여행 정보
- **실시간 정보**: 정확한 거리, 시간, 날씨 데이터
- **한국어 지원**: 한국어 도시명 자동 번역
- **상세한 정보**: 평점, 가격대, 날씨 상세 정보까지

## 🎯 결과

이제 전 세계 여행 관련 질문을 하면:

### 🗺️ Google Maps API로 정확한 전 세계 정보를!
- **맛집/관광지 검색**: 평점, 가격대, 상세 주소 정보
- **거리/시간 계산**: 다양한 교통수단별 정확한 경로 정보
- **한국어 지원**: 한국어 도시명도 자동 번역하여 검색

### 🌤️ OpenWeatherMap API로 실시간 날씨를!
- **전 세계 날씨**: 한국 포함 전 세계 실시간 날씨 정보
- **상세 정보**: 기온, 체감온도, 습도, 바람, 기압, 시야
- **여행 팁**: 날씨에 따른 맞춤형 여행 조언

### 🤖 AI 기능들
- **일정 관리**: 여행 일정 저장/조회
- **예산 계산**: 여행 경비 관리
- **상담**: 친근한 AI 여행 플래너

를 제공받을 수 있습니다!

## 💡 팁

### 비용 최적화
- Google Maps API는 월 $200 무료 크레딧 (매우 넉넉함)
- OpenWeatherMap API는 일일 1,000회 무료 (개인 사용 충분)
- Google Generative AI API도 무료 할당량이 넉넉함
- 개발/테스트 시 걱정 없이 사용 가능

### 보안
- `.env.local` 파일은 `.gitignore`에 포함되어 있어 Git에 업로드되지 않음
- API 키는 절대 코드에 직접 입력하지 마세요

### OpenWeatherMap API 참고사항
- API 키 활성화까지 최대 2시간 소요 가능
- 한국 지역 완벽 지원으로 "서울", "Seoul" 모두 검색 가능
- 무료 플랜: 일일 1,000회 호출, 분당 60회 제한 