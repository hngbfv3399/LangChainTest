import { DynamicTool } from '@langchain/core/tools';

// 타입 정의
interface PlaceResult {
  name: string;
  formatted_address: string;
  rating?: number;
  price_level?: number;
}

interface GooglePlacesResponse {
  results: PlaceResult[];
  status: string;
}

interface DistanceElement {
  distance: { text: string; value: number };
  duration: { text: string; value: number };
  status: string;
}

interface GoogleDistanceResponse {
  rows: Array<{
    elements: DistanceElement[];
  }>;
  status: string;
}

interface ItineraryItem {
  time: string;
  place: string;
  notes: string;
}

interface TravelMemory {
  [key: string]: ItineraryItem[] | Record<string, number>;
}

// 여행 계획 메모리 저장소
const travelMemory: TravelMemory = {};

// 장소 검색 도구 (Google Places API)
export const placeSearchTool = new DynamicTool({
  name: 'place_search',
  description: '특정 지역에서 관광지, 맛집, 숙박시설 등을 검색합니다. 형식: "지역명,카테고리" (예: "서울,관광지" 또는 "부산,맛집")',
  func: async (input: string) => {
    try {
      const [location, category] = input.split(',').map(s => s.trim());
      
      if (!location || !category) {
        return '어? 형식이 좀 이상한데~ "지역명,카테고리" 이렇게 써줘! (예: "서울,관광지") (035)';
      }

      // Google Places API 호출
      if (!process.env.GOOGLE_MAPS_API_KEY) {
        return '🔑 Google Maps API 키가 필요해요! .env.local 파일에 GOOGLE_MAPS_API_KEY를 설정해주세요.\n\n📝 API 키 발급 방법:\n1. Google Cloud Console에서 프로젝트 생성\n2. Places API 활성화\n3. API 키 생성 및 설정';
      }

      // 한국어 도시명을 영어로 변환해서 더 정확한 검색
      const translatedLocation = translateKoreanCity(location);
      const query = `${translatedLocation} ${getCategoryKeyword(category)}`;
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${process.env.GOOGLE_MAPS_API_KEY}&language=ko&region=kr`
      );
      
      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
      }

      const data: GooglePlacesResponse = await response.json();
      
      if (data.status === 'REQUEST_DENIED') {
        return '🚫 Google Places API 키가 유효하지 않거나 권한이 없습니다. API 키를 확인해주세요.';
      }
      
      if (data.status === 'ZERO_RESULTS') {
        return `📍 "${location}"에서 "${category}" 관련 장소를 찾을 수 없었어요. 다른 지역이나 카테고리를 시도해보세요!`;
      }
      
      if (data.results && data.results.length > 0) {
        return `📍 ${location} ${category} 실시간 검색 결과! 🔥\n\n` + data.results.slice(0, 5).map((place: PlaceResult, index: number) => 
          `${index + 1}. ${place.name}\n   📍 주소: ${place.formatted_address}\n   ⭐ 평점: ${place.rating || 'N/A'}\n   💰 가격대: ${place.price_level ? '💰'.repeat(place.price_level) : 'N/A'}`
        ).join('\n\n');
      } else {
        return `📍 "${location}"에서 "${category}" 관련 장소를 찾을 수 없었어요. 검색어를 다시 확인해보세요!`;
      }
    } catch (error) {
      return `❌ 장소 검색 중 오류가 발생했어요: ${error instanceof Error ? error.message : '알 수 없는 오류'}\n\n🔧 문제 해결:\n1. API 키 확인\n2. 인터넷 연결 확인\n3. 검색어 다시 입력`;
    }
  },
});

// 거리/시간 계산 도구 (Google Distance Matrix API)
export const distanceCalculatorTool = new DynamicTool({
  name: 'distance_calculator',
  description: '두 장소 간의 거리와 이동 시간을 계산합니다. 형식: "출발지,목적지,교통수단" (교통수단: driving, transit, walking)',
  func: async (input: string) => {
    const [origin, destination, mode = 'driving'] = input.split(',').map(s => s.trim());
    
    if (!origin || !destination) {
      return '응? 형식이 맞지 않아~ "출발지,목적지,교통수단" 이렇게 써줄래? (예: "명동,강남,driving") 0l)';
    }

    try {
      // Google Distance Matrix API 호출
      if (!process.env.GOOGLE_MAPS_API_KEY) {
        return '🔑 Google Maps API 키가 필요해요! .env.local 파일에 GOOGLE_MAPS_API_KEY를 설정해주세요.\n\n📝 API 키 발급 방법:\n1. Google Cloud Console에서 프로젝트 생성\n2. Distance Matrix API 활성화\n3. API 키 생성 및 설정';
      }

      // 한국어 지명을 영어로 변환해서 더 정확한 검색
      const translatedOrigin = translateKoreanCity(origin);
      const translatedDestination = translateKoreanCity(destination);
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(translatedOrigin)}&destinations=${encodeURIComponent(translatedDestination)}&mode=${mode}&key=${process.env.GOOGLE_MAPS_API_KEY}&language=ko&region=kr`
      );
      
      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
      }

      const data: GoogleDistanceResponse = await response.json();
      
      if (data.status === 'REQUEST_DENIED') {
        return '🚫 Google Distance Matrix API 키가 유효하지 않거나 권한이 없습니다. API 키를 확인해주세요.';
      }
      
      if (data.rows && data.rows[0]?.elements[0]?.status === 'OK') {
        const element = data.rows[0].elements[0];
        return `🚗 ${origin} → ${destination} 실시간 경로 정보! 🔥\n📏 거리: ${element.distance.text}\n⏱️ 소요시간: ${element.duration.text}\n🚚 교통수단: ${getTransportIcon(mode)} ${mode}`;
      } else if (data.rows && data.rows[0]?.elements[0]?.status === 'NOT_FOUND') {
        return `📍 "${origin}" 또는 "${destination}"을 찾을 수 없어요. 정확한 지명을 입력해주세요!\n🔍 검색어: ${translatedOrigin} ↔ ${translatedDestination}`;
      } else if (data.rows && data.rows[0]?.elements[0]?.status === 'ZERO_RESULTS') {
        return `🚫 "${origin}"에서 "${destination}"까지 ${mode} 경로를 찾을 수 없어요. 다른 교통수단을 시도해보세요!\n🔍 검색어: ${translatedOrigin} ↔ ${translatedDestination}`;
      } else {
        return `❌ 경로 계산 중 문제가 발생했어요. 지명을 다시 확인해주세요!`;
      }
    } catch (error) {
      return `❌ 거리 계산 중 오류가 발생했어요: ${error instanceof Error ? error.message : '알 수 없는 오류'}\n\n🔧 문제 해결:\n1. API 키 확인\n2. 인터넷 연결 확인\n3. 지명 정확히 입력`;
    }
  },
});

// 여행 일정 저장 도구
export const itineraryTool = new DynamicTool({
  name: 'itinerary_manager',
  description: '여행 일정을 저장하거나 조회합니다. 형식: "저장:날짜:장소:시간" 또는 "조회:날짜" (예: "저장:2024-01-15:경복궁:09:00" 또는 "조회:2024-01-15")',
  func: async (input: string) => {
    const parts = input.split(':');
    
    if (parts[0] === '저장' && parts.length >= 4) {
      const [, date, place, time, ...notes] = parts;
      const key = `itinerary_${date}`;
      
      if (!travelMemory[key]) {
        travelMemory[key] = [];
      }
      
      const schedule = travelMemory[key] as ItineraryItem[];
      schedule.push({
        time,
        place,
        notes: notes.join(':') || ''
      });
      
      // 시간순으로 정렬
      schedule.sort((a: ItineraryItem, b: ItineraryItem) => a.time.localeCompare(b.time));
      
      return `📅 ${date} 일정에 추가했어! 조아앙~ (V)\n⏰ ${time} - ${place}${notes.length ? '\n📝 ' + notes.join(':') : ''}`;
      
    } else if (parts[0] === '조회' && parts.length === 2) {
      const [, date] = parts;
      const key = `itinerary_${date}`;
      const schedule = travelMemory[key] as ItineraryItem[];
      
      if (schedule && schedule.length > 0) {
        return `📅 ${date} 여행 일정이야! 🎉\n\n` + schedule.map((item: ItineraryItem) => 
          `⏰ ${item.time} - ${item.place}${item.notes ? '\n📝 ' + item.notes : ''}`
        ).join('\n\n');
      } else {
        return `📅 ${date}에 저장된 일정이 없어~ 일정을 추가해볼까? (035)`;
      }
      
    } else if (parts[0] === '전체') {
      const allDates = Object.keys(travelMemory).filter(key => key.startsWith('itinerary_'));
      if (allDates.length === 0) {
        return '아직 저장된 여행 일정이 없어! 일정을 만들어볼까? ✈️ (V)';
      }
      
      return '📅 전체 여행 일정이야! 우와앙~ 🎉\n\n' + allDates.map(key => {
        const date = key.replace('itinerary_', '');
        const schedule = travelMemory[key] as ItineraryItem[];
        return `${date}:\n` + schedule.map((item: ItineraryItem) => `  ⏰ ${item.time} - ${item.place}`).join('\n');
      }).join('\n\n');
      
    } else {
      return '어? 형식이 좀 이상한데~ 0l)\n저장: "저장:날짜:장소:시간"\n조회: "조회:날짜"\n전체조회: "전체"\n이렇게 써줘!';
    }
  },
});

// 여행 예산 계산 도구
export const budgetCalculatorTool = new DynamicTool({
  name: 'budget_calculator',
  description: '여행 예산을 계산합니다. 형식: "항목,금액" 또는 "합계" (예: "숙박,120000" 또는 "교통,50000")',
  func: async (input: string) => {
    if (input.trim() === '합계' || input.trim() === '총합') {
      const budget = (travelMemory['budget'] || {}) as Record<string, number>;
      const total = Object.values(budget).reduce((sum: number, value: number) => sum + (typeof value === 'number' ? value : 0), 0);
      
      if (Object.keys(budget).length === 0) {
        return '💰 아직 저장된 예산 항목이 없어! 예산을 추가해볼까? (V)';
      }
      
      const details = Object.entries(budget).map(([category, amount]) => 
        `${getCategoryIcon(category)} ${category}: ${Number(amount).toLocaleString()}원`
      ).join('\n');
      
      return `💰 여행 예산 현황이야! 조아앙~ 📊\n\n${details}\n\n💳 총 예산: ${total.toLocaleString()}원`;
      
    } else {
      const [category, amountStr] = input.split(',').map(s => s.trim());
      const amount = parseInt(amountStr);
      
      if (!category || isNaN(amount)) {
        return '어? 형식이 맞지 않아~ "항목,금액" 이렇게 써줘! (예: "숙박,120000") (035)';
      }
      
      if (!travelMemory['budget']) {
        travelMemory['budget'] = {};
      }
      
      const budget = travelMemory['budget'] as Record<string, number>;
      budget[category] = amount;
      
      return `💰 예산에 추가했어! 조아앙~ (V)\n${getCategoryIcon(category)} ${category}: ${amount.toLocaleString()}원`;
    }
  },
});

// 날씨 정보 도구 (Google Weather API)
export const travelWeatherTool = new DynamicTool({
  name: 'travel_weather',
  description: '여행지의 날씨 정보를 제공합니다. 도시 이름을 입력하세요. (한국 도시는 영어로 입력: Seoul, Busan, Jeju 등)',
  func: async (input: string) => {
    const city = input.trim();
    
    if (!city) {
      return '도시 이름을 입력해주세요! (예: "Seoul", "Busan", "Jeju")';
    }
    
    try {
      // Google Maps API 키 확인
      if (!process.env.GOOGLE_MAPS_API_KEY) {
        return '🔑 Google Maps API 키가 필요해요! .env.local 파일에 GOOGLE_MAPS_API_KEY를 설정해주세요.\n\n📝 API 키 발급 방법:\n1. Google Cloud Console에서 프로젝트 생성\n2. Geocoding API와 Weather API 활성화\n3. API 키 생성 및 설정';
      }

      // 한국 도시명을 영어로 변환
      const translatedCity = translateKoreanCity(city);
      
      // 1단계: 도시명을 좌표로 변환 (Google Geocoding API)
      const geocodingResponse = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(translatedCity)}&key=${process.env.GOOGLE_MAPS_API_KEY}&language=en&region=kr`
      );
      
      if (!geocodingResponse.ok) {
        throw new Error(`Geocoding API 호출 실패: ${geocodingResponse.status} ${geocodingResponse.statusText}`);
      }

      const geocodingData = await geocodingResponse.json();
      
      if (geocodingData.status === 'REQUEST_DENIED') {
        return '🚫 Google Geocoding API 키가 유효하지 않거나 권한이 없습니다. API 키를 확인해주세요.';
      }
      
      if (geocodingData.status === 'ZERO_RESULTS') {
        return `📍 "${city}" (${translatedCity}) 도시를 찾을 수 없어요. 정확한 도시명을 입력해주세요!\n\n💡 한국 도시는 영어로 시도해보세요:\n- Seoul (서울)\n- Busan (부산)\n- Jeju (제주)`;
      }
      
      if (!geocodingData.results || geocodingData.results.length === 0) {
        return `📍 "${city}" 위치 정보를 찾을 수 없어요. 다른 도시명을 시도해보세요!`;
      }

      const location = geocodingData.results[0].geometry.location;
      const latitude = location.lat;
      const longitude = location.lng;
      const formattedAddress = geocodingData.results[0].formatted_address;

      // 2단계: 좌표로 날씨 정보 조회 (Google Weather API)
      const weatherResponse = await fetch(
        `https://weather.googleapis.com/v1/current:lookup?key=${process.env.GOOGLE_MAPS_API_KEY}&location.latitude=${latitude}&location.longitude=${longitude}`
      );
      
      if (!weatherResponse.ok) {
        if (weatherResponse.status === 401) {
          return '🚫 Google Weather API 키가 유효하지 않습니다. API 키를 확인해주세요.';
        } else if (weatherResponse.status === 404) {
          return `📍 "${city}" (${translatedCity}) 지역의 날씨 정보를 찾을 수 없어요.\n\n⚠️ Google Weather API는 한국 지역을 지원하지 않습니다.\n다른 나라 도시를 시도해보세요! (예: Tokyo, Paris, New York)`;
        } else if (weatherResponse.status === 403) {
          return `🚫 "${city}" (${translatedCity}) 지역은 Google Weather API에서 지원하지 않습니다.\n\n⚠️ 한국, 일본 등 일부 지역은 제한됩니다.\n다른 나라 도시를 시도해보세요!`;
        }
        throw new Error(`Weather API 호출 실패: ${weatherResponse.status} ${weatherResponse.statusText}`);
      }

      const weatherData = await weatherResponse.json();
      
      // Google Weather API 응답 처리
      const current = weatherData.current;
      if (!current) {
        return `❌ "${city}" 지역의 현재 날씨 정보를 가져올 수 없어요.`;
      }

      const temp = Math.round(current.temperature?.celsius || 0);
      const condition = current.condition?.description || '정보 없음';
      const humidity = current.humidity?.percentage || 0;
      const windSpeed = Math.round((current.wind?.speed?.metersPerSecond || 0) * 3.6); // m/s to km/h
      const windDirection = getWindDirection(current.wind?.direction?.degrees || 0);
      const uvIndex = current.uv?.index || 0;
      
      return `🌤️ ${formattedAddress} 실시간 날씨 정보! 🔥\n🌡️ 기온: ${temp}°C\n☁️ 날씨: ${condition}\n💧 습도: ${humidity}%\n💨 바람: ${windDirection} ${windSpeed}km/h\n☀️ 자외선 지수: ${uvIndex}\n\n📝 여행 팁: ${getTravelTip(condition)}`;
    } catch (error) {
      return `❌ 날씨 정보 조회 중 오류가 발생했어요: ${error instanceof Error ? error.message : '알 수 없는 오류'}\n\n🔧 문제 해결:\n1. API 키 확인\n2. 인터넷 연결 확인\n3. 도시명 정확히 입력\n4. Google Cloud Console에서 Geocoding API와 Weather API 활성화 확인`;
    }
  },
});

// 헬퍼 함수들
function getCategoryKeyword(category: string): string {
  const keywords: Record<string, string> = {
    '관광지': 'tourist attractions',
    '맛집': 'restaurants',
    '숙박': 'hotels accommodation',
    '카페': 'cafe coffee',
    '쇼핑': 'shopping mall',
    '병원': 'hospital',
    '약국': 'pharmacy'
  };
  return keywords[category] || category;
}

function getWindDirection(degree: number): string {
  const directions = ['북', '북동', '동', '남동', '남', '남서', '서', '북서'];
  const index = Math.round(degree / 45) % 8;
  return directions[index];
}

function getTransportIcon(mode: string): string {
  const icons: Record<string, string> = {
    'driving': '🚗',
    'transit': '🚇',
    'walking': '🚶‍♂️',
    'bicycling': '🚴‍♂️'
  };
  return icons[mode] || '🚗';
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    '숙박': '🏨',
    '교통': '🚗',
    '식비': '🍽️',
    '관광': '🎫',
    '쇼핑': '🛍️',
    '기타': '💳'
  };
  return icons[category] || '💰';
}

function getTravelTip(condition: string): string {
  const tips: Record<string, string> = {
    '맑음': '자외선 차단제를 꼭 준비해줘! 야외 활동하기 조아앙~ (V)',
    '흐림': '우산을 준비하고, 실내 관광지도 고려해봐! 0l)',
    '구름많음': '가벼운 외투를 준비하면 조아앙~ (035)',
    '비': '우산과 방수용품을 꼭 챙겨! 실내 활동을 추천해~ (05o0)'
  };
  return tips[condition] || '날씨 변화에 대비해서 옷을 여러 벌 준비해줘! (V)';
}

function translateKoreanCity(city: string): string {
  const cityTranslations: Record<string, string> = {
    // 광역시/특별시
    '서울': 'Seoul',
    '부산': 'Busan',
    '대구': 'Daegu',
    '인천': 'Incheon',
    '광주': 'Gwangju',
    '대전': 'Daejeon',
    '울산': 'Ulsan',
    '세종': 'Sejong',
    
    // 도/지역
    '경기': 'Gyeonggi',
    '강원': 'Gangwon',
    '충북': 'Chungbuk',
    '충남': 'Chungnam',
    '전북': 'Jeonbuk',
    '전남': 'Jeonnam',
    '경북': 'Gyeongbuk',
    '경남': 'Gyeongnam',
    '제주': 'Jeju',
    
    // 주요 도시
    '수원': 'Suwon',
    '성남': 'Seongnam',
    '고양': 'Goyang',
    '용인': 'Yongin',
    '청주': 'Cheongju',
    '천안': 'Cheonan',
    '전주': 'Jeonju',
    '안산': 'Ansan',
    '안양': 'Anyang',
    '포항': 'Pohang',
    '창원': 'Changwon',
    '마산': 'Masan',
    '진주': 'Jinju',
    '여수': 'Yeosu',
    '순천': 'Suncheon',
    '김해': 'Gimhae',
    '춘천': 'Chuncheon',
    '원주': 'Wonju',
    '강릉': 'Gangneung',
    '속초': 'Sokcho',
    
    // 추가 도시들
    '평택': 'Pyeongtaek',
    '시흥': 'Siheung',
    '부천': 'Bucheon',
    '광명': 'Gwangmyeong',
    '군포': 'Gunpo',
    '의왕': 'Uiwang',
    '하남': 'Hanam',
    '오산': 'Osan',
    '이천': 'Icheon',
    '안성': 'Anseong',
    '의정부': 'Uijeongbu',
    '동두천': 'Dongducheon',
    '구리': 'Guri',
    '남양주': 'Namyangju',
    '파주': 'Paju',
    '김포': 'Gimpo',
    '화성': 'Hwaseong',
    
    // 서울 지역명
    '강남': 'Gangnam Seoul',
    '홍대': 'Hongdae Seoul',
    '명동': 'Myeongdong Seoul',
    '인사동': 'Insadong Seoul',
    '이태원': 'Itaewon Seoul',
    '동대문': 'Dongdaemun Seoul',
    '서대문': 'Seodaemun Seoul',
    '종로': 'Jongno Seoul',
    '마포': 'Mapo Seoul',
    '영등포': 'Yeongdeungpo Seoul',
    '용산': 'Yongsan Seoul',
    '성동': 'Seongdong Seoul',
    '광진': 'Gwangjin Seoul',
    '동작': 'Dongjak Seoul',
    '관악': 'Gwanak Seoul',
    '서초': 'Seocho Seoul',
    '강동': 'Gangdong Seoul',
    '송파': 'Songpa Seoul',
    '강서': 'Gangseo Seoul',
    '양천': 'Yangcheon Seoul',
    '구로': 'Guro Seoul',
    '금천': 'Geumcheon Seoul',
    '중구': 'Jung-gu Seoul',
    '성북': 'Seongbuk Seoul',
    '강북': 'Gangbuk Seoul',
    '도봉': 'Dobong Seoul',
    '노원': 'Nowon Seoul',
    
    // 부산 지역명
    '해운대': 'Haeundae Busan',
    '광안리': 'Gwangalli Busan',
    '서면': 'Seomyeon Busan',
    '남포동': 'Nampo-dong Busan',
    '기장': 'Gijang Busan',
    
    // 제주 지역명
    '제주시': 'Jeju City',
    '서귀포': 'Seogwipo',
    '애월': 'Aewol Jeju',
    '성산': 'Seongsan Jeju',
    '중문': 'Jungmun Jeju',
    
    // 관광지명
    '경복궁': 'Gyeongbokgung Palace Seoul',
    '창덕궁': 'Changdeokgung Palace Seoul',
    '덕수궁': 'Deoksugung Palace Seoul',
    '남산': 'Namsan Seoul',
    '한강': 'Han River Seoul',
    '청계천': 'Cheonggyecheon Seoul',
    '북촌': 'Bukchon Seoul',
    '부산역': 'Busan Station',
    '자갈치시장': 'Jagalchi Market Busan',
    '감천문화마을': 'Gamcheon Culture Village Busan',
    '태종대': 'Taejongdae Busan',
    '한라산': 'Hallasan Jeju',
    '성산일출봉': 'Seongsan Ilchulbong Jeju',
    '우도': 'Udo Jeju',
    '협재해수욕장': 'Hyeopjae Beach Jeju',
    '동성로': 'Dongseongno Daegu',
    '팔공산': 'Palgongsan Daegu'
  };
  
  return cityTranslations[city] || city;
}

// 모든 구글 API 기반 도구들
export const allTools = [
  placeSearchTool,
  distanceCalculatorTool,
  itineraryTool, 
  budgetCalculatorTool,
  travelWeatherTool
];

// 모든 도구 설명을 가져오는 함수
export function getTravelToolDescriptions(): string {
  return allTools.map(tool => `- ${tool.name}: ${tool.description}`).join('\n');
} 