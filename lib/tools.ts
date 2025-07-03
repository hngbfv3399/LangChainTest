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

interface WeatherData {
  main: {
    temp: number;
    humidity: number;
  };
  weather: Array<{
    main: string;
    description: string;
  }>;
  wind: {
    speed: number;
    deg: number;
  };
  uv?: {
    value: number;
  };
}

// 여행 계획 메모리 저장소
const travelMemory: TravelMemory = {};

// 장소 검색 도구
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
      if (process.env.GOOGLE_MAPS_API_KEY) {
        const query = `${location} ${getCategoryKeyword(category)}`;
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${process.env.GOOGLE_MAPS_API_KEY}&language=ko&region=kr`
        );
        
        if (response.ok) {
          const data: GooglePlacesResponse = await response.json();
          
          if (data.results && data.results.length > 0) {
            return data.results.slice(0, 5).map((place: PlaceResult, index: number) => 
              `${index + 1}. ${place.name}\n   주소: ${place.formatted_address}\n   평점: ${place.rating || 'N/A'} ⭐\n   가격대: ${place.price_level ? '💰'.repeat(place.price_level) : 'N/A'}`
            ).join('\n\n');
          }
        }
      }
      
      // API 키가 없거나 실패 시 Mock 데이터 사용
      return getMockPlaceData(location, category);
    } catch {
      return getMockPlaceData(input.split(',')[0] || '서울', input.split(',')[1] || '관광지');
    }
  },
});

// 거리/시간 계산 도구
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
      if (process.env.GOOGLE_MAPS_API_KEY) {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&mode=${mode}&key=${process.env.GOOGLE_MAPS_API_KEY}&language=ko&region=kr`
        );
        
        if (response.ok) {
          const data: GoogleDistanceResponse = await response.json();
          
          if (data.rows && data.rows[0]?.elements[0]?.status === 'OK') {
            const element = data.rows[0].elements[0];
            return `🚗 ${origin} → ${destination}\n거리: ${element.distance.text}\n소요시간: ${element.duration.text}\n교통수단: ${getTransportIcon(mode)} ${mode}`;
          }
        }
      }
      
      // API 키가 없거나 실패 시 Mock 데이터 사용
      return getMockDistanceData(origin, destination, mode);
    } catch {
      return getMockDistanceData(origin, destination, mode);
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

// 날씨 정보 도구 (실제 API 사용)
export const travelWeatherTool = new DynamicTool({
  name: 'travel_weather',
  description: '여행지의 날씨 정보를 제공합니다. 도시 이름을 입력하세요.',
  func: async (input: string) => {
    const city = input.trim();
    
    try {
      // OpenWeatherMap API 호출
      if (process.env.OPENWEATHER_API_KEY) {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric&lang=kr`
        );
        
        if (response.ok) {
          const data: WeatherData = await response.json();
          
          const temp = Math.round(data.main.temp);
          const condition = data.weather[0]?.description || '정보 없음';
          const humidity = data.main.humidity;
          const windSpeed = Math.round(data.wind.speed * 3.6); // m/s to km/h
          const windDirection = getWindDirection(data.wind.deg);
          
          return `🌤️ ${city} 날씨 정보야! (V)\n🌡️ 기온: ${temp}°C\n☁️ 날씨: ${condition}\n💧 습도: ${humidity}%\n💨 바람: ${windDirection} ${windSpeed}km/h\n\n📝 여행 팁: ${getTravelTip(condition)}`;
        }
      }
      
      // API 키가 없거나 실패 시 Mock 데이터 사용
      return getMockWeatherData(city);
    } catch {
      return getMockWeatherData(city);
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

function getMockWeatherData(city: string): string {
  const weatherData: Record<string, { temp: string; condition: string; humidity: string; wind: string; uv: string }> = {
    '서울': { temp: '22°C', condition: '맑음', humidity: '55%', wind: '북서풍 3m/s', uv: '보통' },
    '부산': { temp: '25°C', condition: '구름많음', humidity: '70%', wind: '남동풍 2m/s', uv: '높음' },
    '제주': { temp: '24°C', condition: '맑음', humidity: '65%', wind: '동풍 4m/s', uv: '높음' },
    '강릉': { temp: '20°C', condition: '흐림', humidity: '60%', wind: '동풍 5m/s', uv: '낮음' },
    '경주': { temp: '23°C', condition: '맑음', humidity: '58%', wind: '서풍 2m/s', uv: '보통' },
  };
  
  const weather = weatherData[city];
  
  if (weather) {
    return `🌤️ ${city} 날씨 정보야! (V)\n🌡️ 기온: ${weather.temp}\n☁️ 날씨: ${weather.condition}\n💧 습도: ${weather.humidity}\n💨 바람: ${weather.wind}\n☀️ 자외선: ${weather.uv}\n\n📝 여행 팁: ${getTravelTip(weather.condition)}`;
  } else {
    return `${city}의 날씨 정보를 찾을 수 없어~ (035) 지원되는 도시: 서울, 부산, 제주, 강릉, 경주`;
  }
}

function getMockPlaceData(location: string, category: string): string {
  const mockData: Record<string, Record<string, string[]>> = {
    '서울': {
      '관광지': [
        '경복궁 - 조선왕조의 대표 궁궐 ⭐4.5',
        '명동 - 쇼핑과 먹거리의 천국 ⭐4.2',
        'N서울타워 - 서울의 상징적 랜드마크 ⭐4.3',
        '인사동 - 전통문화 거리 ⭐4.4',
        '한강공원 - 시민들의 휴식공간 ⭐4.6'
      ],
      '맛집': [
        '미슐랭 가이드 한식당 - 전통 한식 코스 💰💰💰',
        '명동교자 - 유명 만두집 💰💰',
        '광장시장 - 전통 시장 먹거리 💰',
        '강남 고기집 - 프리미엄 한우 💰💰💰💰',
        '홍대 파스타집 - 이탈리안 레스토랑 💰💰'
      ],
      '숙박': [
        '롯데호텔 서울 - 명동 중심가 럭셔리 호텔 💰💰💰💰',
        '호스텔 코리아 - 홍대 저렴한 게스트하우스 💰',
        '강남 비즈니스 호텔 - 접근성 좋은 비즈니스 호텔 💰💰💰',
        '인사동 한옥스테이 - 전통 한옥 체험 💰💰',
        '한강뷰 펜션 - 한강이 보이는 펜션 💰💰'
      ]
    },
    '부산': {
      '관광지': [
        '해운대 해수욕장 - 부산 대표 해변 ⭐4.7',
        '감천문화마을 - 컬러풀한 산동네 ⭐4.4',
        '자갈치시장 - 신선한 해산물 시장 ⭐4.3',
        '태종대 - 절경 명소 ⭐4.5',
        '광안리 해변 - 야경이 아름다운 해변 ⭐4.6'
      ],
      '맛집': [
        '자갈치 횟집 - 신선한 회 전문 💰💰💰',
        '부산 돼지국밥 - 부산 향토 음식 💰',
        '해운대 복국집 - 복어 전문점 💰💰💰',
        '광안리 카페 - 오션뷰 카페 💰💰',
        '서면 곱창집 - 부산식 곱창 💰💰'
      ],
      '숙박': [
        '해운대 그랜드 호텔 - 해변가 리조트 호텔 💰💰💰💰',
        '광안리 비치 호텔 - 바다 전망 호텔 💰💰💰',
        '서면 비즈니스 호텔 - 교통 편리한 호텔 💰💰',
        '부산역 근처 모텔 - 저렴한 숙박시설 💰',
        '감천문화마을 게스트하우스 - 문화마을 체험 💰💰'
      ]
    }
  };

  const locationData = mockData[location];
  if (locationData && locationData[category]) {
    return `📍 ${location} ${category} 추천이야! 조아앙~ (V)\n\n` + locationData[category].map((place: string, index: number) => 
      `${index + 1}. ${place}`
    ).join('\n');
  }

  return `📍 ${location}의 ${category} 정보를 준비 중이야! 다른 지역이나 카테고리를 시도해볼까? (035)`;
}

function getMockDistanceData(origin: string, destination: string, mode: string): string {
  const distances: Record<string, { distance: string; duration: string; driving: string; transit: string; walking: string }> = {
    '명동,강남': { distance: '8.5km', duration: '25분', driving: '20분', transit: '35분', walking: '1시간 45분' },
    '서울,부산': { distance: '325km', duration: '3시간 30분', driving: '4시간 10분', transit: '2시간 50분', walking: '72시간' },
    '강남,인사동': { distance: '6.2km', duration: '18분', driving: '15분', transit: '30분', walking: '1시간 20분' }
  };

  const key = `${origin},${destination}`;
  const reverseKey = `${destination},${origin}`;
  
  const data = distances[key] || distances[reverseKey];
  
  if (data) {
    const time = data[mode as keyof typeof data] || data.duration;
    return `🚗 ${origin} → ${destination}\n거리: ${data.distance}\n소요시간: ${time}\n교통수단: ${getTransportIcon(mode)} ${mode}\n\n이 정도면 괜찮지? (V)`;
  }

  return `🚗 ${origin} → ${destination}\n예상 거리: 계산 중이야~\n소요시간: 계산 중이야~\n교통수단: ${getTransportIcon(mode)} ${mode}\n\n잠시만 기다려줘! (035)`;
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

export const allTools = [
  placeSearchTool, 
  distanceCalculatorTool, 
  itineraryTool, 
  budgetCalculatorTool, 
  travelWeatherTool
]; 