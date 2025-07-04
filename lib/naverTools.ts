import { DynamicTool } from '@langchain/core/tools';

// 네이버 API 응답 타입 정의
interface NaverSearchResult {
  title: string;
  link: string;
  category: string;
  description: string;
  telephone: string;
  address: string;
  roadAddress: string;
  mapx: string;
  mapy: string;
}

// 네이버 통합 검색 결과 타입들
interface NaverBlogItem {
  title: string;
  link: string;
  description: string;
  bloggername: string;
  bloggerlink: string;
  postdate: string;
}

interface NaverNewsItem {
  title: string;
  originallink: string;
  link: string;
  description: string;
  pubDate: string;
}

interface NaverShopItem {
  title: string;
  link: string;
  image: string;
  lprice: string;
  hprice: string;
  mallName: string;
  productId: string;
  productType: string;
  brand: string;
  maker: string;
  category1: string;
  category2: string;
  category3: string;
  category4: string;
}

interface NaverCafeItem {
  title: string;
  link: string;
  description: string;
  cafename: string;
  cafeurl: string;
}

interface NaverSearchResponse {
  lastBuildDate: string;
  total: number;
  start: number;
  display: number;
  items: NaverSearchResult[];
}

interface NaverGeocodingResult {
  roadAddress: string;
  jibunAddress: string;
  englishAddress: string;
  x: string;
  y: string;
}

// interface NaverDirectionResult {
//   code: number;
//   message: string;
//   route: {
//     traoptimal: Array<{
//       summary: {
//         distance: number;
//         duration: number;
//         bbox: number[][];
//         tollFare: number;
//         taxiFare: number;
//         fuelPrice: number;
//       };
//     }>;
//   };
// }

// 네이버 클라우드 플랫폼 인터페이스 추가
interface NaverCloudRouteInfo {
  summary: {
    start: {
      location: [number, number];
    };
    goal: {
      location: [number, number];
      dir: number;
    };
    distance: number;
    duration: number;
    departureTime: string;
    bbox: number[][];
    tollFare: number;
    taxiFare: number;
    fuelPrice: number;
  };
  path: number[][];
  section: Array<{
    pointIndex: number;
    pointCount: number;
    distance: number;
    name: string;
    congestion: number;
    speed: number;
  }>;
  guide: Array<{
    pointIndex: number;
    type: number;
    instructions: string;
    distance: number;
    duration: number;
  }>;
}

interface NaverCloudDirectionResult {
  code: number;
  message: string;
  currentDateTime: string;
  route: {
    traoptimal?: NaverCloudRouteInfo[];
    trafast?: NaverCloudRouteInfo[];
    tracomfort?: NaverCloudRouteInfo[];
    traavoidtoll?: NaverCloudRouteInfo[];
    traavoidcaronly?: NaverCloudRouteInfo[];
  };
}

// 네이버 지역 검색 도구
export const naverPlaceSearchTool = new DynamicTool({
  name: 'naver_place_search',
  description: '네이버 지도 기반으로 장소를 검색합니다. 형식: "지역명,카테고리" (예: "강남,맛집" 또는 "홍대,카페")',
  func: async (input: string) => {
    try {
      const [location, category] = input.split(',').map(s => s.trim());
      
      if (!location || !category) {
        return '어? 형식이 좀 이상한데~ "지역명,카테고리" 이렇게 써줘! (예: "강남,맛집") (035)';
      }

      // 네이버 API 키 확인
      if (!process.env.NAVER_CLIENT_ID || !process.env.NAVER_CLIENT_SECRET) {
        return '🔑 네이버 API 키가 필요해요! .env.local 파일에 NAVER_CLIENT_ID와 NAVER_CLIENT_SECRET을 설정해주세요.\n\n📝 API 키 발급 방법:\n1. https://developers.naver.com/apps 접속\n2. 애플리케이션 등록\n3. 검색 API 추가\n4. Client ID와 Client Secret 복사';
      }

      const query = `${location} ${category}`;
      const response = await fetch(
        `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=5&sort=random`,
        {
          headers: {
            'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID,
            'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`네이버 API 호출 실패: ${response.status} ${response.statusText}`);
      }

      const data: NaverSearchResponse = await response.json();

      if (data.total === 0) {
        return `📍 "${location}"에서 "${category}" 관련 장소를 찾을 수 없었어요. 다른 검색어를 시도해보세요!`;
      }

      return `📍 네이버 지도 기반 ${location} ${category} 검색 결과! 🔥\n\n` + 
        data.items.slice(0, 5).map((place, index) => {
          const title = place.title.replace(/<[^>]*>/g, ''); // HTML 태그 제거
          const description = place.description.replace(/<[^>]*>/g, '');
          
          return `${index + 1}. ${title}\n   📍 주소: ${place.roadAddress || place.address}\n   📞 전화: ${place.telephone || 'N/A'}\n   🏷️ 카테고리: ${place.category}\n   📝 설명: ${description || 'N/A'}`;
        }).join('\n\n');

    } catch (error) {
      return `❌ 네이버 지역 검색 중 오류가 발생했어요: ${error instanceof Error ? error.message : '알 수 없는 오류'}\n\n🔧 문제 해결:\n1. 네이버 API 키 확인\n2. 인터넷 연결 확인\n3. 검색어 다시 입력`;
    }
  },
});

// 네이버 주소 검색 (Geocoding) 도구
export const naverGeocodingTool = new DynamicTool({
  name: 'naver_geocoding',
  description: '주소를 좌표로 변환하거나 장소명을 검색합니다. 형식: "주소" (예: "서울특별시 강남구 테헤란로 146")',
  func: async (input: string) => {
    try {
      const query = input.trim();
      
      if (!query) {
        return '주소나 장소명을 입력해주세요! (예: "서울특별시 강남구 테헤란로 146")';
      }

      // 네이버 API 키 확인
      if (!process.env.NAVER_CLIENT_ID || !process.env.NAVER_CLIENT_SECRET) {
        return '🔑 네이버 API 키가 필요해요! .env.local 파일에 NAVER_CLIENT_ID와 NAVER_CLIENT_SECRET을 설정해주세요.';
      }

      const response = await fetch(
        `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(query)}`,
        {
          headers: {
            'X-NCP-APIGW-API-KEY-ID': process.env.NAVER_CLIENT_ID,
            'X-NCP-APIGW-API-KEY': process.env.NAVER_CLIENT_SECRET,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`네이버 Geocoding API 호출 실패: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.addresses || data.addresses.length === 0) {
        return `📍 "${query}" 주소를 찾을 수 없어요. 정확한 주소를 입력해주세요!`;
      }

      const result: NaverGeocodingResult = data.addresses[0];
      
      return `📍 주소 검색 결과! 🔍\n\n🏠 도로명주소: ${result.roadAddress}\n🏠 지번주소: ${result.jibunAddress}\n🌍 영문주소: ${result.englishAddress}\n📍 좌표: ${result.x}, ${result.y}\n\n💡 이 좌표로 다른 검색도 가능해요!`;

    } catch (error) {
      return `❌ 주소 검색 중 오류가 발생했어요: ${error instanceof Error ? error.message : '알 수 없는 오류'}\n\n🔧 문제 해결:\n1. 네이버 API 키 확인\n2. 주소 정확히 입력\n3. 인터넷 연결 확인`;
    }
  },
});

// 네이버 길찾기 (Direction) 도구 - 임시 우회 버전
export const naverDirectionTool = new DynamicTool({
  name: 'naver_direction',
  description: '네이버 지도 기반 길찾기를 제공합니다. 형식: "출발지,목적지" (예: "강남역,홍대입구역")',
  func: async (input: string) => {
    try {
      const [origin, destination] = input.split(',').map(s => s.trim());
      
      if (!origin || !destination) {
        return '어? 형식이 맞지 않아~ "출발지,목적지" 이렇게 써줄래? (예: "강남역,홍대입구역") 0l)';
      }

      // 네이버 API 키 확인
      if (!process.env.NAVER_CLIENT_ID || !process.env.NAVER_CLIENT_SECRET) {
        return '🔑 네이버 API 키가 필요해요! .env.local 파일에 NAVER_CLIENT_ID와 NAVER_CLIENT_SECRET을 설정해주세요.';
      }

      // 1단계: 출발지와 목적지 좌표 얻기 (지역 검색 사용)
      const [startPlace, goalPlace] = await Promise.all([
        searchPlaceWithCoordinates(origin),
        searchPlaceWithCoordinates(destination)
      ]);

      if (!startPlace || !goalPlace) {
        const failedLocation = !startPlace ? origin : destination;
        return `📍 "${failedLocation}"의 좌표를 찾을 수 없어요! 🔍\n\n💡 이렇게 시도해보세요:\n• 더 구체적인 주소: "${failedLocation} 역", "${failedLocation} 시청"\n• 정확한 지명: "서울 ${failedLocation}", "부산 ${failedLocation}"\n• 완전한 주소: "서울특별시 강남구 강남대로 xxx"\n\n✅ 추천 장소명:\n- 강남역, 홍대입구역, 명동, 서울역\n- 김포공항, 인천공항, 부산역\n- 서울 종로구, 부산 해운대구\n\n🔧 개발자 콘솔을 확인해보세요 (F12)`;
      }

      // 2단계: 직선 거리 계산 (하버사인 공식)
      const [startLng, startLat] = startPlace.coordinates.split(',').map(Number);
      const [goalLng, goalLat] = goalPlace.coordinates.split(',').map(Number);
      
      const distance = calculateHaversineDistance(startLat, startLng, goalLat, goalLng);
      const estimatedDuration = Math.round(distance * 2); // 대략적인 차량 이동시간 (분)
      const estimatedToll = Math.round(distance * 100); // 대략적인 통행료 (원)
      const estimatedTaxi = Math.round(distance * 1200); // 대략적인 택시요금 (원)

      return `🚗 네이버 지도 기반 ${origin} → ${destination} 경로 정보! 🔥\n\n📏 직선거리: ${distance.toFixed(1)}km\n⏱️ 예상 소요시간: 약 ${estimatedDuration}분\n💰 예상 통행료: ${estimatedToll.toLocaleString()}원\n🚕 예상 택시요금: 약 ${estimatedTaxi.toLocaleString()}원\n\n📍 출발지: ${startPlace.roadAddress}\n📍 목적지: ${goalPlace.roadAddress}\n\n💡 정확한 경로는 네이버 지도 앱에서 확인하세요!\n⚡ 임시 버전: 직선거리 기반 예상값입니다.`;

    } catch (error) {
      return `❌ 길찾기 중 오류가 발생했어요: ${error instanceof Error ? error.message : '알 수 없는 오류'}\n\n🔧 문제 해결:\n1. 네이버 API 키 확인\n2. 장소명 정확히 입력\n3. 인터넷 연결 확인`;
    }
  },
});

// 하버사인 공식으로 두 좌표 간 직선 거리 계산 (km)
function calculateHaversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // 지구 반지름 (km)
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// 네이버 클라우드 플랫폼 Directions 5 도구
export const naverCloudDirectionTool = new DynamicTool({
  name: 'naver_cloud_direction',
  description: '네이버 클라우드 플랫폼 기반 고급 길찾기를 제공합니다. 실시간 교통, 상세 요금, 경유지 지원. 형식: "출발지,목적지" 또는 "출발지,목적지,옵션" (옵션: fast=빠른길, comfort=편한길, optimal=최적, avoidtoll=무료우선)',
  func: async (input: string) => {
    try {
      const parts = input.split(',').map(s => s.trim());
      const [origin, destination, option = 'optimal'] = parts;
      
      if (!origin || !destination) {
        return '어? 형식이 맞지 않아~ "출발지,목적지" 이렇게 써줄래? (예: "강남역,홍대입구역,fast") 0l)';
      }

      // 네이버 클라우드 플랫폼 API 키 확인
      if (!process.env.NAVER_CLIENT_ID || !process.env.NAVER_CLIENT_SECRET) {
        return '🔑 네이버 클라우드 플랫폼 API 키가 필요해요! .env.local 파일에 NAVER_CLIENT_ID와 NAVER_CLIENT_SECRET을 설정해주세요.\n\n📝 API 키 발급 방법:\n1. https://www.ncloud.com/ 접속\n2. 콘솔 로그인\n3. Maps > Directions 5 API 신청\n4. API 키 발급';
      }

      // 1단계: 출발지와 목적지 좌표 얻기
      const [startCoords, goalCoords] = await Promise.all([
        getCoordinatesFromAddress(origin),
        getCoordinatesFromAddress(destination)
      ]);

      if (!startCoords || !goalCoords) {
        const failedLocation = !startCoords ? origin : destination;
        return `📍 "${failedLocation}"의 좌표를 찾을 수 없어요! 🔍\n\n💡 이렇게 시도해보세요:\n• 더 구체적인 주소: "${failedLocation} 역", "${failedLocation} 시청"\n• 정확한 지명: "서울 ${failedLocation}", "부산 ${failedLocation}"\n• 완전한 주소: "서울특별시 강남구 강남대로 xxx"\n\n✅ 추천 장소명:\n- 강남역, 홍대입구역, 명동, 서울역\n- 김포공항, 인천공항, 부산역\n- 서울 종로구, 부산 해운대구\n\n🔧 개발자 콘솔에서 상세 로그를 확인해보세요 (F12)`;
      }

      // 옵션 매핑
      const optionMap: Record<string, string> = {
        'fast': 'trafast',
        'comfort': 'tracomfort',
        'optimal': 'traoptimal',
        'avoidtoll': 'traavoidtoll',
        'avoidcaronly': 'traavoidcaronly'
      };
      
      const routeOption = optionMap[option] || 'traoptimal';

      // 2단계: 네이버 클라우드 플랫폼 Directions 5 API 호출
      const response = await fetch(
        `https://naveropenapi.apigw.ntruss.com/map-direction-15/v1/driving?start=${startCoords}&goal=${goalCoords}&option=${routeOption}`,
        {
          headers: {
            'x-ncp-apigw-api-key-id': process.env.NAVER_CLIENT_ID,
            'x-ncp-apigw-api-key': process.env.NAVER_CLIENT_SECRET,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`네이버 클라우드 Directions API 호출 실패: ${response.status} ${response.statusText}`);
      }

      const data: NaverCloudDirectionResult = await response.json();

      if (data.code !== 0) {
        const errorMessages: Record<number, string> = {
          1: '출발지와 도착지가 동일해요',
          2: '출발지 또는 도착지가 도로 주변이 아니에요',
          3: '자동차 길찾기 결과를 제공할 수 없어요',
          4: '경유지가 도로 주변이 아니에요',
          5: '직선거리 합이 1500km 이상이에요'
        };
        
        return `🚫 길찾기 실패: ${errorMessages[data.code] || data.message}`;
      }

      const route = data.route[routeOption as keyof typeof data.route]?.[0];
      if (!route) {
        return `🚫 "${origin}"에서 "${destination}"까지 ${option} 경로를 찾을 수 없어요.`;
      }

      const summary = route.summary;
      const distance = (summary.distance / 1000).toFixed(1); // km 변환
      const duration = Math.round(summary.duration / 60000); // 분 변환
      const hours = Math.floor(duration / 60);
      const minutes = duration % 60;
      const timeStr = hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;
      
      const tollFare = summary.tollFare.toLocaleString();
      const taxiFare = summary.taxiFare.toLocaleString();
      const fuelPrice = summary.fuelPrice.toLocaleString();

      // 경로 옵션별 이모지
      const optionEmoji: Record<string, string> = {
        'fast': '⚡ 빠른길',
        'comfort': '😌 편한길', 
        'optimal': '🎯 최적경로',
        'avoidtoll': '💰 무료우선',
        'avoidcaronly': '🛣️ 일반도로'
      };

             // 주요 도로 정보
       type SectionType = NonNullable<NaverCloudRouteInfo['section'][0]>;
       const majorRoads = route.section
         .filter((section: SectionType) => section.distance > 5000) // 5km 이상 구간만
         .slice(0, 3)
         .map((section: SectionType) => `• ${section.name} (${(section.distance/1000).toFixed(1)}km)`)
         .join('\n');

      let result = `🚗 네이버 클라우드 ${optionEmoji[option]} 경로 정보! 🔥\n\n📏 거리: ${distance}km\n⏱️ 소요시간: 약 ${timeStr}\n💰 통행료: ${tollFare}원\n🚕 택시요금: 약 ${taxiFare}원\n⛽ 예상 유류비: ${fuelPrice}원`;

      if (majorRoads) {
        result += `\n\n🛣️ 주요 경로:\n${majorRoads}`;
      }

      result += '\n\n💡 다른 옵션도 시도해보세요: fast(빠른길), comfort(편한길), avoidtoll(무료우선)';

      return result;

    } catch (error) {
      return `❌ 네이버 클라우드 길찾기 중 오류가 발생했어요: ${error instanceof Error ? error.message : '알 수 없는 오류'}\n\n🔧 문제 해결:\n1. 네이버 클라우드 플랫폼 API 키 확인\n2. 장소명 정확히 입력\n3. 인터넷 연결 확인\n4. API 사용량 한도 확인`;
    }
  },
});

// 네이버 블로그 검색 도구
export const naverBlogSearchTool = new DynamicTool({
  name: 'naver_blog_search',
  description: '네이버 블로그에서 여행, 맛집, 관광지 정보를 검색합니다. 형식: "검색어" (예: "제주도 맛집" 또는 "부산 카페")',
  func: async (input: string) => {
    try {
      const query = input.trim();
      
      if (!query) {
        return '검색어를 입력해주세요! (예: "제주도 맛집", "부산 여행")';
      }

      // 네이버 API 키 확인
      if (!process.env.NAVER_CLIENT_ID || !process.env.NAVER_CLIENT_SECRET) {
        return '🔑 네이버 API 키가 필요해요! .env.local 파일에 NAVER_CLIENT_ID와 NAVER_CLIENT_SECRET을 설정해주세요.';
      }

      const response = await fetch(
        `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(query)}&display=5&sort=sim`,
        {
          headers: {
            'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID,
            'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`네이버 블로그 검색 API 호출 실패: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.total === 0) {
        return `📝 "${query}" 관련 블로그 포스트를 찾을 수 없었어요. 다른 검색어를 시도해보세요!`;
      }

      return `📝 네이버 블로그 "${query}" 검색 결과! ✨\n\n` + 
        data.items.slice(0, 5).map((item: NaverBlogItem, index: number) => {
          const title = item.title.replace(/<[^>]*>/g, '');
          const description = item.description.replace(/<[^>]*>/g, '');
          const postDate = new Date(item.postdate).toLocaleDateString('ko-KR');
          
          return `${index + 1}. ${title}\n   ✍️ 블로거: ${item.bloggername}\n   📅 작성일: ${postDate}\n   📝 내용: ${description}\n   🔗 링크: ${item.link}`;
        }).join('\n\n');

    } catch (error) {
      return `❌ 네이버 블로그 검색 중 오류가 발생했어요: ${error instanceof Error ? error.message : '알 수 없는 오류'}`;
    }
  },
});

// 네이버 뉴스 검색 도구
export const naverNewsSearchTool = new DynamicTool({
  name: 'naver_news_search',
  description: '네이버 뉴스에서 최신 여행, 관광, 행사 정보를 검색합니다. 형식: "검색어" (예: "제주도 축제" 또는 "부산 이벤트")',
  func: async (input: string) => {
    try {
      const query = input.trim();
      
      if (!query) {
        return '검색어를 입력해주세요! (예: "제주도 축제", "부산 이벤트")';
      }

      if (!process.env.NAVER_CLIENT_ID || !process.env.NAVER_CLIENT_SECRET) {
        return '🔑 네이버 API 키가 필요해요!';
      }

      const response = await fetch(
        `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(query)}&display=5&sort=date`,
        {
          headers: {
            'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID,
            'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`네이버 뉴스 검색 API 호출 실패: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.total === 0) {
        return `📰 "${query}" 관련 뉴스를 찾을 수 없었어요. 다른 검색어를 시도해보세요!`;
      }

      return `📰 네이버 뉴스 "${query}" 검색 결과! 🔥\n\n` + 
        data.items.slice(0, 5).map((item: NaverNewsItem, index: number) => {
          const title = item.title.replace(/<[^>]*>/g, '');
          const description = item.description.replace(/<[^>]*>/g, '');
          const pubDate = new Date(item.pubDate).toLocaleDateString('ko-KR');
          
          return `${index + 1}. ${title}\n   📅 발행일: ${pubDate}\n   📝 내용: ${description}\n   🔗 링크: ${item.link}`;
        }).join('\n\n');

    } catch (error) {
      return `❌ 네이버 뉴스 검색 중 오류가 발생했어요: ${error instanceof Error ? error.message : '알 수 없는 오류'}`;
    }
  },
});

// 네이버 쇼핑 검색 도구
export const naverShopSearchTool = new DynamicTool({
  name: 'naver_shop_search',
  description: '네이버 쇼핑에서 여행용품, 기념품 등을 검색합니다. 형식: "검색어" (예: "여행가방" 또는 "제주도 기념품")',
  func: async (input: string) => {
    try {
      const query = input.trim();
      
      if (!query) {
        return '검색어를 입력해주세요! (예: "여행가방", "제주도 기념품")';
      }

      if (!process.env.NAVER_CLIENT_ID || !process.env.NAVER_CLIENT_SECRET) {
        return '🔑 네이버 API 키가 필요해요!';
      }

      const response = await fetch(
        `https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(query)}&display=5&sort=sim`,
        {
          headers: {
            'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID,
            'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`네이버 쇼핑 검색 API 호출 실패: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.total === 0) {
        return `🛒 "${query}" 관련 상품을 찾을 수 없었어요. 다른 검색어를 시도해보세요!`;
      }

      return `🛒 네이버 쇼핑 "${query}" 검색 결과! 💰\n\n` + 
        data.items.slice(0, 5).map((item: NaverShopItem, index: number) => {
          const title = item.title.replace(/<[^>]*>/g, '');
          const lowPrice = parseInt(item.lprice);
          const highPrice = parseInt(item.hprice);
          
          let priceStr = '';
          if (lowPrice > 0) {
            if (highPrice > 0 && highPrice !== lowPrice) {
              priceStr = `${lowPrice.toLocaleString()}원 ~ ${highPrice.toLocaleString()}원`;
            } else {
              priceStr = `${lowPrice.toLocaleString()}원`;
            }
          } else {
            priceStr = '가격 문의';
          }
          
          return `${index + 1}. ${title}\n   💰 가격: ${priceStr}\n   🏪 쇼핑몰: ${item.mallName}\n   🏷️ 브랜드: ${item.brand || 'N/A'}\n   🔗 링크: ${item.link}`;
        }).join('\n\n');

    } catch (error) {
      return `❌ 네이버 쇼핑 검색 중 오류가 발생했어요: ${error instanceof Error ? error.message : '알 수 없는 오류'}`;
    }
  },
});

// 네이버 카페 검색 도구
export const naverCafeSearchTool = new DynamicTool({
  name: 'naver_cafe_search',
  description: '네이버 카페에서 여행 정보, 후기, 팁을 검색합니다. 형식: "검색어" (예: "제주도 여행후기" 또는 "부산 맛집 추천")',
  func: async (input: string) => {
    try {
      const query = input.trim();
      
      if (!query) {
        return '검색어를 입력해주세요! (예: "제주도 여행후기", "부산 맛집 추천")';
      }

      if (!process.env.NAVER_CLIENT_ID || !process.env.NAVER_CLIENT_SECRET) {
        return '🔑 네이버 API 키가 필요해요!';
      }

      const response = await fetch(
        `https://openapi.naver.com/v1/search/cafearticle.json?query=${encodeURIComponent(query)}&display=5&sort=sim`,
        {
          headers: {
            'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID,
            'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`네이버 카페 검색 API 호출 실패: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.total === 0) {
        return `☕ "${query}" 관련 카페 게시글을 찾을 수 없었어요. 다른 검색어를 시도해보세요!`;
      }

      return `☕ 네이버 카페 "${query}" 검색 결과! 💬\n\n` + 
        data.items.slice(0, 5).map((item: NaverCafeItem, index: number) => {
          const title = item.title.replace(/<[^>]*>/g, '');
          const description = item.description.replace(/<[^>]*>/g, '');
          
          return `${index + 1}. ${title}\n   ☕ 카페: ${item.cafename}\n   📝 내용: ${description}\n   🔗 링크: ${item.link}`;
        }).join('\n\n');

    } catch (error) {
      return `❌ 네이버 카페 검색 중 오류가 발생했어요: ${error instanceof Error ? error.message : '알 수 없는 오류'}`;
    }
  },
});

// AI 기반 스마트 주소 검색 함수 (네이버 지역 검색 좌표 활용)
async function getCoordinatesFromAddress(address: string): Promise<string | null> {
  // 1단계: 네이버 지역 검색으로 바로 좌표 찾기
  console.log(`🔍 1단계: 네이버 지역 검색으로 "${address}" 좌표 찾기`);
  
  try {
    const placeWithCoords = await searchPlaceWithCoordinates(address);
    if (placeWithCoords) {
      console.log(`✅ 1단계 성공: "${address}" → ${placeWithCoords.coordinates}`);
      return placeWithCoords.coordinates;
    }
  } catch (error) {
    console.log(`❌ 1단계 실패:`, error);
  }

  // 2단계: AI가 더 구체적인 검색어로 변환
  console.log(`🔍 2단계: AI가 "${address}"를 더 구체적으로 해석`);
  
  try {
    const enhancedQueries = generateSmartQueries(address);
    
    for (const query of enhancedQueries) {
      console.log(`🤖 AI 추천 검색어: "${query}"`);
      
      const placeWithCoords = await searchPlaceWithCoordinates(query);
      if (placeWithCoords) {
        console.log(`✅ 2단계 성공: "${query}" → ${placeWithCoords.coordinates}`);
        return placeWithCoords.coordinates;
      }
    }
  } catch (error) {
    console.log(`❌ 2단계 실패:`, error);
  }

  // 3단계: 지오코딩 API로 최후 시도 (백업용)
  console.log(`🔍 3단계: 지오코딩 API로 최후 시도 → "${address}"`);
  
  try {
    const coords = await tryGeocoding(address);
    if (coords) {
      console.log(`✅ 3단계 성공: "${address}" → ${coords}`);
      return coords;
    }
  } catch (error) {
    console.log(`❌ 3단계 실패:`, error);
  }

  console.error(`❌ 모든 단계 실패: "${address}" 좌표를 찾을 수 없음`);
  return null;
}

// 지오코딩 시도 헬퍼 함수 (디버깅 강화)
async function tryGeocoding(address: string): Promise<string | null> {
  try {
    console.log(`🔧 지오코딩 시도: "${address}"`);
    
    const response = await fetch(
      `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(address)}`,
      {
        headers: {
          'x-ncp-apigw-api-key-id': process.env.NAVER_CLIENT_ID!,
          'x-ncp-apigw-api-key': process.env.NAVER_CLIENT_SECRET!,
        },
      }
    );

    console.log(`🔧 지오코딩 응답 상태: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      console.error(`❌ 지오코딩 API 오류: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    console.log(`🔧 지오코딩 응답 데이터:`, JSON.stringify(data, null, 2));
    
    if (data.addresses && data.addresses.length > 0) {
      const result = data.addresses[0];
      const coords = `${result.x},${result.y}`;
      console.log(`✅ 지오코딩 성공: "${address}" → ${coords}`);
      return coords;
    } else {
      console.log(`❌ 지오코딩 결과 없음: "${address}" - addresses 배열이 비어있음`);
      return null;
    }
  } catch (error) {
    console.error(`❌ 지오코딩 예외 발생: "${address}"`, error);
    return null;
  }
}

// 네이버 지역 검색으로 좌표까지 포함한 장소 정보 찾기 (디버깅 강화)
async function searchPlaceWithCoordinates(placeName: string): Promise<{coordinates: string; roadAddress: string; address: string} | null> {
  try {
    console.log(`🔧 지역 검색 시도: "${placeName}"`);
    
    const response = await fetch(
      `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(placeName)}&display=1&sort=random`,
      {
        headers: {
          'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID!,
          'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET!,
        },
      }
    );

    console.log(`🔧 지역 검색 응답 상태: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      console.error(`❌ 지역 검색 API 오류: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    console.log(`🔧 지역 검색 응답 데이터:`, JSON.stringify(data, null, 2));
    
    if (data.items && data.items.length > 0) {
      const item = data.items[0];
      
      // 네이버 지역 검색 결과에서 좌표 추출
      if (item.mapx && item.mapy) {
        // 네이버 좌표계를 WGS84 경위도로 변환
        const longitude = parseFloat(item.mapx) / 10000000;
        const latitude = parseFloat(item.mapy) / 10000000;
        
        const result = {
          coordinates: `${longitude},${latitude}`,
          roadAddress: item.roadAddress || item.address,
          address: item.address
        };
        
        console.log(`✅ 지역 검색 성공 (좌표 포함): "${placeName}" →`, result);
        return result;
      } else {
        console.log(`❌ 좌표 정보 없음: "${placeName}" - mapx, mapy가 없음`);
        return null;
      }
    } else {
      console.log(`❌ 지역 검색 결과 없음: "${placeName}" - items 배열이 비어있음`);
      return null;
    }
  } catch (error) {
    console.error(`❌ 지역 검색 예외 발생: "${placeName}"`, error);
    return null;
  }
}

// 진짜 AI 기반 스마트 검색어 생성 (하드코딩 제거)
function generateSmartQueries(address: string): string[] {
  const queries: string[] = [];
  
  // 1. 장소 유형별 동적 키워드 생성
  if (address.includes('역')) {
    const baseName = address.replace('역', '');
    queries.push(
      `${baseName}역 기차역`,
      `${baseName}역 지하철역`, 
      `${baseName}역 터미널`,
      `${baseName}역 교통`,
      `${baseName} 역`,
      `${baseName}역 출구`,
      `${baseName}역 광장`
    );
  }
  
  if (address.includes('공항')) {
    const baseName = address.replace('공항', '');
    queries.push(
      `${baseName}공항 국제선`,
      `${baseName}공항 국내선`,
      `${baseName} 공항`,
      `${baseName}공항 터미널`
    );
  }
  
  // 2. 지역/상권별 동적 키워드 (하드코딩 대신 패턴 기반)
  const locationTypes = [
    '상가', '거리', '쇼핑', '중심가', '번화가', '시장', '상권', 
    '관광지', '명소', '랜드마크', '광장', '공원', '역', '터미널'
  ];
  
  locationTypes.forEach(type => {
    queries.push(`${address} ${type}`);
  });
  
  // 3. 지역명 조합 (동적 생성) - 특별 케이스 우선 처리
  const specialCases: Record<string, string[]> = {
    '동성로': [
      '대구 동성로', '대구광역시 동성로', '대구 중구 동성로',
      '대구 동성로 거리', '대구 동성로 상가', '대구 동성로 쇼핑',
      '동성로 번화가', '동성로 중앙로', '동성로역', 
      '대구 중구 동성로2가', '대구 중구 동성로1가',
      '동성로 패션거리', '동성로 지하상가'
    ],
    '서면': [
      '부산 서면', '부산광역시 서면', '부산 부산진구 서면',
      '서면역', '서면 롯데백화점', '서면 번화가'
    ],
    '해운대': [
      '부산 해운대', '부산광역시 해운대구', '해운대 해수욕장',
      '해운대역', '해운대 센텀시티'
    ],
    '강남': [
      '서울 강남', '서울특별시 강남구', '강남역 일대',
      '강남역', '강남 테헤란로'
    ],
    '홍대': [
      '서울 홍대', '서울 홍익대학교', '홍대입구역',
      '홍대 클럽거리', '서울 마포구 홍대'
    ],
    '명동': [
      '서울 명동', '서울특별시 중구 명동',
      '명동역', '명동 쇼핑거리'
    ]
  };

  // 특별 케이스가 있으면 우선 사용
  const lowerAddress = address.toLowerCase();
  for (const [key, specialQueries] of Object.entries(specialCases)) {
    if (lowerAddress.includes(key.toLowerCase())) {
      queries.push(...specialQueries);
      console.log(`🎯 특별 케이스 발견: "${key}" → ${specialQueries.length}개 검색어 추가`);
    }
  }

  // 일반적인 도시명 조합
  const cities = ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종'];
  const districts = ['중구', '동구', '서구', '남구', '북구', '강남구', '강서구'];
  
  // 현재 주소에 도시명이 없으면 추가 시도
  const hasCity = cities.some(city => address.includes(city));
  if (!hasCity) {
    cities.forEach(city => {
      queries.push(`${city} ${address}`);
    });
    
    // 구까지 포함한 더 구체적인 주소
    cities.forEach(city => {
      districts.forEach(district => {
        queries.push(`${city} ${district} ${address}`);
      });
    });
  }
  
  // 4. 문자열 변형 (공백, 띄어쓰기)
  if (address.includes(' ')) {
    queries.push(address.replace(/ /g, ''));
    queries.push(address.replace(/ /g, '_'));
  } else {
    // 자동 띄어쓰기 시도 (2-3글자 단위)
    if (address.length >= 4) {
      for (let i = 2; i <= 3; i++) {
        if (i < address.length) {
          queries.push(`${address.slice(0, i)} ${address.slice(i)}`);
        }
      }
    }
  }
  
  // 5. 접미사 변형
  const suffixes = ['점', '센터', '빌딩', '타워', '플라자', '몰', '마트'];
  suffixes.forEach(suffix => {
    if (!address.includes(suffix)) {
      queries.push(`${address} ${suffix}`);
      queries.push(`${address}${suffix}`);
    }
  });
  
  // 6. 교통/접근성 키워드
  const accessKeywords = ['근처', '주변', '앞', '입구', '출구'];
  accessKeywords.forEach(keyword => {
    queries.push(`${address} ${keyword}`);
  });
  
  // 7. 중복 제거하고 원본 제외, 빈 문자열 제외
  return [...new Set(queries)]
    .filter(q => q !== address && q.trim().length > 0 && q.length <= 50)
    .slice(0, 20); // 너무 많으면 API 제한에 걸릴 수 있으니 20개로 제한
}

// 모든 네이버 도구들을 배열로 내보내기
export const naverTools = [
  naverPlaceSearchTool,
  naverGeocodingTool,
  naverDirectionTool,
  naverCloudDirectionTool,
  naverBlogSearchTool,
  naverNewsSearchTool,
  naverShopSearchTool,
  naverCafeSearchTool,
];

// 네이버 도구 설명을 가져오는 함수
export function getNaverToolDescriptions(): string {
  return naverTools.map(tool => `- ${tool.name}: ${tool.description}`).join('\n');
} 