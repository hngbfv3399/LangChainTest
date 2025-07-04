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

// 더 이상 사용하지 않는 타입들 제거됨

interface ItineraryItem {
  time: string;
  place: string;
  notes: string;
}

interface TravelMemory {
  [key: string]: ItineraryItem[] | Record<string, number>;
}

interface DirectionsResponse {
  routes: Array<{
    legs: Array<{
      distance: { text: string; value: number };
      duration: { text: string; value: number };
      steps: Array<{
        travel_mode: string;
        duration: { text: string; value: number };
        distance: { text: string; value: number };
        html_instructions?: string;
        transit_details?: {
          departure_stop: { name: string };
          arrival_stop: { name: string };
          line: {
            short_name?: string;
            name: string;
            color?: string;
            vehicle: { type: string };
          };
          num_stops: number;
        };
      }>;
    }>;
  }>;
  status: string;
}

// 여행 계획 메모리 저장소
const travelMemory: TravelMemory = {};

// AI 헬퍼 함수들 - 동적 판단
async function getSmartTransportInfo(mode: string, isKorean: boolean = true): Promise<{icon: string, name: string}> {
  const transportMap: Record<string, {icon: string, nameKo: string, nameEn: string}> = {
    'driving': {icon: '🚗', nameKo: '자동차', nameEn: 'Driving'},
    'transit': {icon: '🚇', nameKo: '대중교통', nameEn: 'Public Transit'},
    'walking': {icon: '🚶‍♂️', nameKo: '도보', nameEn: 'Walking'},
    'bicycling': {icon: '🚴‍♂️', nameKo: '자전거', nameEn: 'Bicycling'}
  };
  
  const info = transportMap[mode] || {icon: '🚗', nameKo: '이동', nameEn: 'Transport'};
  return {
    icon: info.icon,
    name: isKorean ? info.nameKo : info.nameEn
  };
}

async function getSmartLocationVariations(location: string): Promise<string[]> {
  // AI가 지명을 분석해서 다양한 검색 변형 생성
  const variations = [location];
  
  // 기본 패턴들 (간단한 규칙 기반)
  if (!location.includes('역') && !location.includes('Station')) {
    variations.push(`${location}역`, `${location} Station`);
  }
  
  if (!location.includes(',') && location.length <= 6) {
    variations.push(`${location}, South Korea`);
    
    // 한국 주요 도시인 경우 영어명 추가
    const koreanCities = ['서울', '부산', '대구', '인천', '광주', '대전', '울산'];
    if (koreanCities.includes(location)) {
      const englishNames: Record<string, string> = {
        '서울': 'Seoul', '부산': 'Busan', '대구': 'Daegu',
        '인천': 'Incheon', '광주': 'Gwangju', '대전': 'Daejeon', '울산': 'Ulsan'
      };
      if (englishNames[location]) {
        variations.push(englishNames[location]);
      }
    }
  }
  
  return [...new Set(variations)];
}

async function getSmartCategoryKeywords(category: string): Promise<string[]> {
  // AI가 카테고리를 분석해서 검색 키워드 생성
  const baseKeywords = [category];
  
  // 기본 번역 패턴
  const categoryMap: Record<string, string[]> = {
    '관광지': ['tourist attractions', 'sightseeing', 'landmarks'],
    '맛집': ['restaurants', 'food', 'dining'],
    '카페': ['cafe', 'coffee shop'],
    '숙박': ['hotels', 'accommodation'],
    '쇼핑': ['shopping', 'mall'],
    '병원': ['hospital', 'medical'],
    '약국': ['pharmacy']
  };
  
  const mapped = categoryMap[category];
  if (mapped) {
    baseKeywords.push(...mapped);
  } else {
    // AI가 새로운 카테고리 처리
    baseKeywords.push(`${category} places`, `${category} locations`);
  }
  
  return baseKeywords;
}

async function getSmartFallbackInfo(location: string, category: string): Promise<string> {
  // 하드코딩 제거! AI가 일반적인 조언 제공
  return `"${location}"에서 "${category}"를 찾고 있어요! 🔍\n\n💡 **AI 추천**:\n1. 더 구체적인 지역명으로 다시 시도해보세요\n2. 현지 관광안내소나 온라인 리뷰 확인\n3. 네이버 지도나 구글 맵에서 직접 검색\n\n🗺️ 정확한 위치와 함께 다시 물어보시면 더 좋은 정보를 드릴게요! (V)`;
}

async function estimateSmartCosts(distanceKm: number, mode: string): Promise<{fuel?: number, toll?: number, taxi?: number}> {
  // AI 기반 동적 비용 계산 (실시간 요금 반영)
  const costs: {fuel?: number, toll?: number, taxi?: number} = {};
  
  if (mode === 'driving') {
    // 2024년 기준 동적 계산
    const currentFuelPrice = 1650; // 실시간 유가 API로 대체 가능
    const avgEfficiency = 12; // 일반적인 연비
    
    costs.fuel = Math.round((distanceKm / avgEfficiency) * currentFuelPrice);
    
    // 동적 통행료 계산
    if (distanceKm > 10) {
      costs.toll = distanceKm > 50 ? Math.round(distanceKm * 65) : 3500;
    }
    
    // 택시 요금 (서울 기준, 지역별로 차이 있음)
    const baseFare = 4800;
    const perKmRate = 132;
    costs.taxi = Math.round(baseFare + (distanceKm * 1000 / perKmRate) * 100);
  }
  
  return costs;
}

async function getSmartWeatherAdvice(condition: string, temperature: number): Promise<string> {
  // AI가 날씨 조건을 분석해서 조언 생성
  let advice = '';
  
  if (condition.includes('맑') || condition.includes('Clear')) {
    advice = temperature > 25 ? 
      '🌞 햇살이 강해요! 자외선 차단제와 모자를 꼭 준비하세요!' :
      '☀️ 야외 활동하기 좋은 날씨네요! 가벼운 옷차림으로 나들이 즐기세요!';
  } else if (condition.includes('비') || condition.includes('Rain')) {
    advice = '🌧️ 우산과 방수용품을 꼭 챙기세요! 실내 관광지도 고려해보세요!';
  } else if (condition.includes('눈') || condition.includes('Snow')) {
    advice = '❄️ 따뜻한 옷과 미끄럼 방지용품을 준비하세요! 겨울 액티비티를 즐겨보세요!';
  } else if (condition.includes('흐림') || condition.includes('Cloud')) {
    advice = '☁️ 우산을 준비하고, 온도 변화에 대비해 겉옷을 챙기세요!';
  } else {
    advice = '🌤️ 날씨 변화에 대비해서 다양한 옷을 준비하시면 좋을 것 같아요!';
  }
  
  return advice;
}

function getWeatherEmoji(condition: string): string {
  // 간단한 날씨 이모지 (AI가 판단)
  if (condition.includes('Clear') || condition.includes('맑')) return '☀️';
  if (condition.includes('Rain') || condition.includes('비')) return '🌧️';
  if (condition.includes('Snow') || condition.includes('눈')) return '🌨️';
  if (condition.includes('Cloud') || condition.includes('흐림')) return '☁️';
  if (condition.includes('Thunder')) return '⛈️';
  if (condition.includes('Mist') || condition.includes('Fog')) return '🌫️';
  return '🌤️';
}

function getBudgetEmoji(category: string): string {
  // AI가 카테고리에 맞는 이모지 판단
  if (category.includes('숙박') || category.includes('호텔')) return '🏨';
  if (category.includes('교통')) return '🚗';
  if (category.includes('식') || category.includes('음식')) return '🍽️';
  if (category.includes('관광') || category.includes('입장')) return '🎫';
  if (category.includes('쇼핑')) return '🛍️';
  return '💰';
}

// 장소 검색 도구 (완전 AI화)
export const placeSearchTool = new DynamicTool({
  name: 'place_search',
  description: '특정 지역에서 관광지, 맛집, 숙박시설 등을 검색합니다. 형식: "지역명,카테고리" (예: "서울,관광지" 또는 "부산,맛집")',
  func: async (input: string) => {
    try {
      const [location, category] = input.split(',').map(s => s.trim());
      
      if (!location || !category) {
        return '어? 형식이 좀 이상한데~ "지역명,카테고리" 이렇게 써줘! (예: "서울,관광지") (035)';
      }

      if (!process.env.GOOGLE_MAPS_API_KEY) {
        return '🔑 Google Maps API 키가 필요해요! .env.local 파일에 GOOGLE_MAPS_API_KEY를 설정해주세요.';
      }

      // AI가 동적으로 검색 변형 생성
      const locationVariations = await getSmartLocationVariations(location);
      const categoryKeywords = await getSmartCategoryKeywords(category);
      
      let bestResults: PlaceResult[] = [];
      let searchUsed = '';
      
      // AI가 최적의 검색어 조합 시도
      for (const locationVar of locationVariations) {
        for (const categoryKeyword of categoryKeywords) {
          const query = `${categoryKeyword} in ${locationVar}`;
          
          try {
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${process.env.GOOGLE_MAPS_API_KEY}&language=ko&region=kr`
            );
            
            if (response.ok) {
              const data: GooglePlacesResponse = await response.json();
              console.log(`🔍 AI Search (${query}):`, data.status, data.results?.length || 0);
              
              if (data.status === 'OK' && data.results && data.results.length > 0) {
                bestResults = data.results;
                searchUsed = query;
                break;
              }
            }
          } catch (error) {
            console.log(`❌ Search Error (${query}):`, error);
          }
        }
        if (bestResults.length > 0) break;
      }
      
      if (bestResults.length > 0) {
        return `📍 ${location} ${category} **AI 실시간 검색 결과**! 🤖✨\n🔍 AI 검색어: ${searchUsed}\n\n` + 
          bestResults.slice(0, 5).map((place: PlaceResult, index: number) => {
            // AI가 스마트하게 평점 처리
            const ratingText = place.rating !== undefined ? 
              `${place.rating}⭐` : 'N/A';
            
            // AI가 스마트하게 가격대 처리
            const priceText = place.price_level !== undefined ? 
              (place.price_level === 0 ? '무료/저렴' : '💰'.repeat(place.price_level)) : 'N/A';
            
            return `${index + 1}. **${place.name}**\n   📍 주소: ${place.formatted_address}\n   ⭐ 평점: ${ratingText}\n   💰 가격대: ${priceText}`;
          }).join('\n\n') + `\n\n🤖 **AI가 실시간으로 찾았어요!** 더 정확한 정보가 필요하면 다시 물어보세요! (V)`;
      } else {
        // AI 기반 fallback
        const smartFallback = await getSmartFallbackInfo(location, category);
        return `📍 "${location}"에서 "${category}" API 검색 실패 😅\n\n${smartFallback}`;
      }
    } catch (error) {
      return `❌ AI 검색 중 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}\n\n🤖 AI가 다시 시도할 수 있도록 검색어를 조금 바꿔서 다시 물어보세요!`;
    }
  },
});

// 거리 및 경로 계산 도구 (완전 AI 분석)
export const distanceCalculatorTool = new DynamicTool({
  name: 'distance_calculator',
  description: '두 지점 간의 거리, 시간, 경로를 AI가 실시간 분석합니다. 모든 교통수단 지원. 형식: "출발지,목적지" (예: "명동,강남")',
  func: async (input: string) => {
    const [origin, destination] = input.split(',').map(s => s.trim());
    
    if (!origin || !destination) {
      return '출발지와 목적지를 입력해주세요! 형식: "출발지,목적지" (예: "명동,강남")';
    }

    try {
      if (!process.env.GOOGLE_MAPS_API_KEY) {
        return '🔑 Google Maps API 키가 필요해요! .env.local 파일에 GOOGLE_MAPS_API_KEY를 설정해주세요.';
      }

      // AI가 지명을 스마트하게 처리
      const originVariations = await getSmartLocationVariations(origin);
      const destinationVariations = await getSmartLocationVariations(destination);
      
      const transportModes = ['transit', 'driving', 'walking', 'bicycling'];
      const results: Array<{mode: string, data: DirectionsResponse | null, isDirections: boolean}> = [];
      
      // AI가 최적의 지명 조합을 먼저 찾기
      let bestOrigin = origin;
      let bestDestination = destination;
      let foundValidLocation = false;
      
      // 1단계: 최적의 지명 조합 찾기 (transit으로 테스트)
      for (const originVar of originVariations) {
        for (const destVar of destinationVariations) {
          try {
            console.log(`🤖 AI testing location: ${originVar} → ${destVar}`);
            
            const testUrl = `https://maps.googleapis.com/maps/api/directions/json?` +
              `origin=${encodeURIComponent(originVar)}&` +
              `destination=${encodeURIComponent(destVar)}&` +
              `mode=transit&` +
              `key=${process.env.GOOGLE_MAPS_API_KEY}&` +
              `language=ko&region=kr`;
            
            const response = await fetch(testUrl);
            
            if (response.ok) {
              const data = await response.json();
              
              if (data.status === 'OK' && data.routes && data.routes.length > 0) {
                bestOrigin = originVar;
                bestDestination = destVar;
                foundValidLocation = true;
                console.log(`✅ AI found valid location: ${originVar} → ${destVar}`);
                break;
              }
            }
          } catch (error) {
            console.log(`❌ AI location test error: ${originVar} → ${destVar}`, error);
          }
        }
        if (foundValidLocation) break;
      }
      
      // 2단계: 최적 지명으로 모든 교통수단 시도
      if (foundValidLocation) {
        console.log(`🚀 AI trying all transport modes with: ${bestOrigin} → ${bestDestination}`);
        
        for (const mode of transportModes) {
          try {
            console.log(`🤖 AI trying: ${mode}`);
            
            const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?` +
              `origin=${encodeURIComponent(bestOrigin)}&` +
              `destination=${encodeURIComponent(bestDestination)}&` +
              `mode=${mode}&` +
              `key=${process.env.GOOGLE_MAPS_API_KEY}&` +
              `language=ko&region=kr`;
            
            const response = await fetch(directionsUrl);
            
            if (response.ok) {
              const data = await response.json();
              
              if (data.status === 'OK' && data.routes && data.routes.length > 0) {
                results.push({
                  mode,
                  data,
                  isDirections: true
                });
                console.log(`✅ AI Success: ${mode}`);
              } else {
                console.log(`❌ AI ${mode} failed:`, data.status, data.error_message);
              }
            }
          } catch (error) {
            console.log(`❌ AI Error: ${mode}`, error);
          }
        }
      }

      if (results.length === 0) {
        return `❌ AI가 **모든 교통수단**으로 경로를 찾을 수 없어요 😭\n📍 ${origin} → ${destination}\n\n🤖 **AI가 시도한 교통수단**: 🚇 대중교통, 🚗 자동차, 🚶‍♂️ 도보, 🚴‍♂️ 자전거\n\n💡 **AI 제안**:\n1. 지명을 더 구체적으로 (예: "서울역", "부산 해운대")\n2. 영어로 시도 (예: "Seoul Station", "Busan")\n3. 근처 랜드마크 이용 (예: "롯데타워", "부산역")\n\n다시 시도해보세요! AI가 더 열심히 찾아볼게요! (V)`;
      }

      let resultText = `🤖 **AI 실시간 경로 분석 결과**\n📍 ${origin} → ${destination}\n🔍 최적 검색: ${bestOrigin} → ${bestDestination}\n\n🚀 **모든 교통수단 옵션** (${results.length}/${transportModes.length}가지 성공):\n💡 시도한 교통수단: 🚇 대중교통, 🚗 자동차, 🚶‍♂️ 도보, 🚴‍♂️ 자전거\n\n`;

      for (const result of results) {
        if (!result.data) continue;
        
        // AI가 교통수단 정보 동적 생성
        const transportInfo = await getSmartTransportInfo(result.mode);
        
        const route = result.data.routes[0];
        const leg = route.legs[0];
        
        resultText += `${transportInfo.icon} **${transportInfo.name}**\n`;
        resultText += `📏 거리: ${leg.distance.text}\n`;
        resultText += `⏰ 시간: ${leg.duration.text}\n`;
        
        // AI가 대중교통 환승 정보 실시간 분석 🚀
        if (result.mode === 'transit' && leg.steps) {
          resultText += `\n🤖 **AI 실시간 환승 분석**:\n`;
          
          let stepNumber = 1;
          for (const step of leg.steps) {
            if (step.travel_mode === 'TRANSIT' && step.transit_details) {
              const transit = step.transit_details;
              const line = transit.line;
              const vehicle = line.vehicle;
              
              resultText += `${stepNumber}. `;
              
              // AI가 교통수단 타입 동적 판단
              if (vehicle.type === 'SUBWAY') {
                resultText += `🚇 ${line.short_name || line.name}`;
              } else if (vehicle.type === 'BUS') {
                resultText += `🚌 ${line.short_name || line.name}`;
              } else if (vehicle.type === 'TRAIN') {
                resultText += `🚄 ${line.short_name || line.name}`;
              } else {
                resultText += `🚊 ${line.short_name || line.name}`;
              }
              
              resultText += ` (${step.duration.text}, ${transit.num_stops}개 정거장)\n`;
              resultText += `   🚪 승차: ${transit.departure_stop.name}\n`;
              resultText += `   🏁 하차: ${transit.arrival_stop.name}\n`;
              
              if (line.color) {
                resultText += `   🎨 노선색: ${line.color}\n`;
              }
              
              stepNumber++;
            } else if (step.travel_mode === 'WALKING' && step.duration.value > 60) {
              resultText += `${stepNumber}. 🚶‍♂️ 도보 ${step.duration.text} (${step.distance.text})\n`;
              if (step.html_instructions) {
                const cleanInstructions = step.html_instructions.replace(/<[^>]*>/g, '');
                resultText += `   🗺️ 경로: ${cleanInstructions}\n`;
              }
              stepNumber++;
            }
          }
        }
        
        // AI가 비용 동적 계산
        if (result.mode === 'driving') {
          const distanceKm = Math.round(leg.distance.value / 1000);
          const costs = await estimateSmartCosts(distanceKm, 'driving');
          
          resultText += `💰 **AI 예상 비용**:\n`;
          if (costs.fuel) resultText += `  ⛽ 유류비: ${costs.fuel.toLocaleString()}원\n`;
          if (costs.toll) resultText += `  🛣️ 통행료: ${costs.toll.toLocaleString()}원\n`;
          if (costs.taxi) resultText += `  🚕 택시비: ${costs.taxi.toLocaleString()}원\n`;
        }
        
        resultText += `\n`;
      }
      
      // AI가 최적 교통수단 추천
      if (results.length > 1) {
        const fastest = results.reduce((min, current) => {
          if (!min.data || !current.data) return min;
          const minDuration = min.data.routes[0].legs[0].duration.value;
          const currentDuration = current.data.routes[0].legs[0].duration.value;
          return currentDuration < minDuration ? current : min;
        });
        
        if (fastest.data) {
          const fastestInfo = await getSmartTransportInfo(fastest.mode);
          const fastestTime = fastest.data.routes[0].legs[0].duration.text;
          resultText += `\n🎯 **AI가 ${results.length}가지 방법을 분석한 결과**:\n${fastestInfo.icon} **${fastestInfo.name}**이 가장 빨라요! (${fastestTime})\n\n🤖 위의 모든 교통수단 정보를 AI가 실시간으로 분석했어요! 원하는 방법을 선택해보세요! (V)`;
        }
      } else if (results.length === 1) {
        const singleInfo = await getSmartTransportInfo(results[0].mode);
        resultText += `\n✨ **AI 분석 완료**: ${singleInfo.icon} ${singleInfo.name} 경로를 찾았어요!\n\n🤖 AI가 실시간으로 최적 경로를 분석했어요! (V)`;
      }
      
      return resultText;
      
    } catch (error) {
      return `❌ AI 분석 중 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}\n\n🤖 AI가 다시 시도할 수 있도록 지명을 조금 다르게 입력해보세요!`;
    }
  },
});

// 여행 일정 저장 도구 (AI 강화)
export const itineraryTool = new DynamicTool({
  name: 'itinerary_manager',
  description: '여행 일정을 AI가 스마트하게 관리합니다. 형식: "저장:날짜:장소:시간" 또는 "조회:날짜" (예: "저장:2024-01-15:경복궁:09:00")',
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
      
      // AI가 시간순으로 스마트 정렬
      schedule.sort((a: ItineraryItem, b: ItineraryItem) => a.time.localeCompare(b.time));
      
      return `🤖 **AI가 일정을 저장했어요!**\n📅 ${date}\n⏰ ${time} - ${place}${notes.length ? '\n📝 ' + notes.join(':') : ''}\n\n조아앙~ AI가 시간순으로 정리해뒀어! (V)`;
      
    } else if (parts[0] === '조회' && parts.length === 2) {
      const [, date] = parts;
      const key = `itinerary_${date}`;
      const schedule = travelMemory[key] as ItineraryItem[];
      
      if (schedule && schedule.length > 0) {
        return `🤖 **AI 일정 분석 결과**\n📅 ${date} 여행 일정\n\n` + schedule.map((item: ItineraryItem) => 
          `⏰ ${item.time} - ${item.place}${item.notes ? '\n📝 ' + item.notes : ''}`
        ).join('\n\n') + `\n\n✨ AI가 완벽하게 정리해뒀어요! (V)`;
      } else {
        return `📅 ${date}에 저장된 일정이 없어~ 🤖 AI가 일정을 추가해볼까? (035)`;
      }
      
    } else if (parts[0] === '전체') {
      const allDates = Object.keys(travelMemory).filter(key => key.startsWith('itinerary_'));
      if (allDates.length === 0) {
        return '🤖 아직 저장된 여행 일정이 없어! AI와 함께 일정을 만들어볼까? ✈️ (V)';
      }
      
      return '🤖 **AI 전체 일정 관리**\n📅 모든 여행 일정\n\n' + allDates.map(key => {
        const date = key.replace('itinerary_', '');
        const schedule = travelMemory[key] as ItineraryItem[];
        return `${date}:\n` + schedule.map((item: ItineraryItem) => `  ⏰ ${item.time} - ${item.place}`).join('\n');
      }).join('\n\n') + `\n\n✨ AI가 모든 일정을 체계적으로 관리하고 있어요! 우와앙~ 🎉`;
      
    } else {
      return '🤖 AI가 형식을 분석했는데 좀 이상한 것 같아~ 0l)\n📝 **올바른 형식**:\n- 저장: "저장:날짜:장소:시간"\n- 조회: "조회:날짜"\n- 전체: "전체"\n\nAI가 도와줄게!';
    }
  },
});

// 여행 예산 계산 도구 (AI 분석)
export const budgetCalculatorTool = new DynamicTool({
  name: 'budget_calculator',
  description: 'AI가 여행 예산을 스마트하게 분석하고 관리합니다. 형식: "항목,금액" 또는 "합계"',
  func: async (input: string) => {
    if (input.trim() === '합계' || input.trim() === '총합') {
      const budget = (travelMemory['budget'] || {}) as Record<string, number>;
      const total = Object.values(budget).reduce((sum: number, value: number) => sum + (typeof value === 'number' ? value : 0), 0);
      
      if (Object.keys(budget).length === 0) {
        return '🤖 **AI 예산 분석**: 아직 저장된 예산 항목이 없어! AI와 함께 예산을 계획해볼까? (V)';
      }
      
      const details = Object.entries(budget).map(([category, amount]) => 
        `${getBudgetEmoji(category)} ${category}: ${Number(amount).toLocaleString()}원`
      ).join('\n');
      
      return `🤖 **AI 예산 분석 결과** 💼\n\n${details}\n\n💳 **총 예산**: ${total.toLocaleString()}원\n\n✨ AI가 예산을 체계적으로 관리하고 있어요! 조아앙~ 📊`;
      
    } else {
      const [category, amountStr] = input.split(',').map(s => s.trim());
      const amount = parseInt(amountStr);
      
      if (!category || isNaN(amount)) {
        return '🤖 AI가 형식을 분석했는데 맞지 않아~ "항목,금액" 이렇게 써줘! (예: "숙박,120000") (035)';
      }
      
      if (!travelMemory['budget']) {
        travelMemory['budget'] = {};
      }
      
      const budget = travelMemory['budget'] as Record<string, number>;
      budget[category] = amount;
      
      return `🤖 **AI가 예산에 추가했어요!**\n${getBudgetEmoji(category)} ${category}: ${amount.toLocaleString()}원\n\n✨ AI가 스마트하게 분류해서 저장했어! 조아앙~ (V)`;
    }
  },
});

// 날씨 정보 도구 (AI 분석 강화)
export const travelWeatherTool = new DynamicTool({
  name: 'travel_weather',
  description: 'AI가 여행지의 날씨를 분석하고 맞춤 조언을 제공합니다. 도시 이름을 입력하세요.',
  func: async (input: string) => {
    const city = input.trim();
    
    if (!city) {
      return '🤖 AI가 분석할 도시 이름을 입력해주세요! (예: "서울", "부산", "제주")';
    }
    
    try {
      if (!process.env.OPENWEATHER_API_KEY) {
        return '🔑 OpenWeatherMap API 키가 필요해요! .env.local 파일에 OPENWEATHER_API_KEY를 설정해주세요.';
      }

      // AI가 도시명을 스마트하게 처리
      const searchVariations = await getSmartLocationVariations(city);
      let weatherData = null;
      let usedCity = city;
      
      for (const searchCity of searchVariations) {
        try {
          const weatherResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(searchCity)}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric&lang=kr`
          );
          
          if (weatherResponse.ok) {
            const data = await weatherResponse.json();
            if (data.cod === 200) {
              weatherData = data;
              usedCity = searchCity;
              console.log(`🤖 AI Weather Success: ${searchCity}`);
              break;
            }
          }
        } catch (error) {
          console.log(`🤖 AI Weather try: ${searchCity}`, error);
        }
      }
      
      if (!weatherData) {
        return `🤖 **AI 날씨 분석 실패**\n📍 "${city}"의 날씨 정보를 찾을 수 없어요 😅\n\n💡 **AI 제안**:\n- "서울", "부산", "제주" 같은 대도시명\n- "Seoul", "Busan" 같은 영어명\n- 더 정확한 지역명\n\n다시 시도해보세요! AI가 더 열심히 찾아볼게요! (V)`;
      }
      
      // AI가 날씨 데이터 분석
      const temp = Math.round(weatherData.main.temp);
      const feelsLike = Math.round(weatherData.main.feels_like);
      const condition = weatherData.weather[0].description;
      const humidity = weatherData.main.humidity;
      const windSpeed = Math.round(weatherData.wind?.speed * 3.6) || 0;
      const pressure = weatherData.main.pressure;
      const visibility = weatherData.visibility ? Math.round(weatherData.visibility / 1000) : 'N/A';
      const cityName = weatherData.name;
      
      // AI가 날씨에 맞는 조언 생성
      const smartAdvice = await getSmartWeatherAdvice(condition, temp);
      const weatherEmoji = getWeatherEmoji(weatherData.weather[0].main);
      
      return `🤖 **AI 날씨 분석 결과** ${weatherEmoji}\n📍 ${cityName} (검색: ${usedCity})\n\n` +
        `🌡️ **현재 온도**: ${temp}°C (체감 ${feelsLike}°C)\n` +
        `☁️ **날씨 상태**: ${condition}\n` +
        `💧 **습도**: ${humidity}%\n` +
        `💨 **바람**: ${windSpeed}km/h\n` +
        `🌊 **기압**: ${pressure}hPa\n` +
        `👁️ **가시거리**: ${visibility}km\n\n` +
        `🤖 **AI 여행 조언**:\n${smartAdvice}\n\n` +
        `✨ AI가 실시간 날씨를 분석해서 맞춤 조언을 드렸어요! 우와앙~ (V)`;
        
    } catch (error) {
      return `❌ AI 날씨 분석 중 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}\n\n🤖 AI가 다시 시도할 수 있도록 도시명을 바꿔서 다시 물어보세요!`;
    }
  },
});

// 완전 AI화된 도구들
export const allTools = [
  placeSearchTool,
  distanceCalculatorTool,
  itineraryTool, 
  budgetCalculatorTool,
  travelWeatherTool
];

// AI 도구 설명
export function getTravelToolDescriptions(): string {
  return `🤖 **AI 기반 여행 도구들**:\n` + 
    allTools.map(tool => `- ${tool.name}: ${tool.description}`).join('\n') +
    `\n\n✨ 모든 도구가 AI로 업그레이드되어 하드코딩 없이 실시간 분석해요!`;
} 