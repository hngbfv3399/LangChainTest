# 🔑 실제 API 키 설정 가이드

이 가이드는 더미 데이터 대신 실제 API 데이터를 사용하기 위한 설정 방법을 안내합니다.

## 📋 필요한 API 키

### 1. Google Maps API 키
- **용도**: 장소 검색, 거리/시간 계산
- **무료 할당량**: 월 $200 크레딧 (상당히 많은 요청 가능)
- **필요한 API**: Places API, Distance Matrix API

### 2. OpenWeatherMap API 키
- **용도**: 실시간 날씨 정보
- **무료 할당량**: 1분에 60회, 1달에 1,000,000회 요청

## 🚀 API 키 발급 방법

### Google Maps API 키 발급
1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. "API 및 서비스" → "라이브러리" 메뉴 선택
4. 다음 API들을 활성화:
   - **Places API** (장소 검색용)
   - **Distance Matrix API** (거리/시간 계산용)
5. "API 및 서비스" → "사용자 인증 정보" 메뉴 선택
6. "사용자 인증 정보 만들기" → "API 키" 클릭
7. 생성된 API 키를 복사

### OpenWeatherMap API 키 발급
1. [OpenWeatherMap](https://openweathermap.org/api)에 접속
2. "Sign up" 클릭하여 무료 계정 생성
3. 이메일 인증 완료
4. 대시보드에서 "API keys" 탭 클릭
5. 기본 API 키를 복사 (또는 새로 생성)

## ⚙️ 환경 변수 설정

### .env.local 파일 생성/수정
프로젝트 루트의 `.env.local` 파일을 열고 다음과 같이 설정하세요:

```env
# Google Maps API 키
GOOGLE_MAPS_API_KEY=your_actual_google_maps_api_key_here

# OpenWeatherMap API 키
OPENWEATHER_API_KEY=your_actual_openweather_api_key_here
```

**⚠️ 주의사항:**
- `your_actual_google_maps_api_key_here`를 실제 API 키로 교체하세요
- `your_actual_openweather_api_key_here`를 실제 API 키로 교체하세요
- API 키는 보안상 중요하므로 절대 공개하지 마세요

## 🔧 설정 완료 후 테스트

환경 변수 설정이 완료되면 다음 명령어로 애플리케이션을 실행하세요:

```bash
npm run dev
```

이제 실제 API 데이터를 사용할 수 있습니다!

## 📊 기능별 실제 데이터 사용 현황

### ✅ 실제 API 사용 도구들
- **장소 검색**: Google Places API 사용
- **거리/시간 계산**: Google Distance Matrix API 사용
- **날씨 정보**: OpenWeatherMap API 사용

### 🔄 변경 사항
- 더미 데이터 함수들 완전 제거
- API 키 없을 시 친절한 안내 메시지 제공
- 에러 처리 강화 (404, 401 등)
- 실시간 데이터 우선 사용

## 🎯 결과

이제 여행 관련 질문을 하면:
- **실제 장소 정보**: 평점, 주소, 가격대 등
- **정확한 거리/시간**: 실시간 교통 상황 반영
- **현재 날씨**: 실시간 기온, 습도, 바람 정보

를 제공받을 수 있습니다!

## 💡 팁

### 비용 최적화
- Google Maps API는 무료 할당량이 넉넉하므로 개발/테스트 시 걱정 없이 사용 가능
- OpenWeatherMap은 완전 무료이므로 제한 없이 사용 가능

### 보안
- `.env.local` 파일은 `.gitignore`에 포함되어 있어 Git에 업로드되지 않음
- API 키는 절대 코드에 직접 입력하지 마세요 