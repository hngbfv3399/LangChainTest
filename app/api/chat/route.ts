import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { allTools } from '../../../lib/tools';

export const runtime = 'nodejs';

// 여행계획 도구 설명
const getTravelToolDescriptions = () => {
  return allTools.map(tool => `- ${tool.name}: ${tool.description}`).join('\n');
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = body.messages ?? [];
    const currentMessageContent = messages[messages.length - 1].content;

    // 모든 필요한 API 키 확인
    const missingKeys = [];
    
    // 디버깅: 환경 변수 로드 상태 확인
    console.log('Environment variables check:');
    console.log('GOOGLE_GENERATIVE_AI_API_KEY:', process.env.GOOGLE_GENERATIVE_AI_API_KEY ? 'EXISTS' : 'MISSING');
    console.log('GOOGLE_MAPS_API_KEY:', process.env.GOOGLE_MAPS_API_KEY ? 'EXISTS' : 'MISSING');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    
    // 필수 API 키들
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      missingKeys.push('GOOGLE_GENERATIVE_AI_API_KEY (Gemini AI용)');
    }
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      missingKeys.push('GOOGLE_MAPS_API_KEY (구글 지도 검색 API용)');
    }
    
    // 필수 API 키가 없으면 에러
    if (missingKeys.length > 0) {
      return new Response(JSON.stringify({
        message: `🔑 필수 API 키가 설정 안 되어있어~ (035)\n\n누락된 키들:\n${missingKeys.map(key => `- ${key}`).join('\n')}\n\n.env.local 파일에 API 키를 설정해줘! 📝\n자세한 방법은 API_SETUP_GUIDE.md를 참고해줘! (V)\n\n💡 구글 API로 전 세계 여행 정보를 검색할 수 있어!`,
        success: false
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Gemini 모델 초기화
    const model = new ChatGoogleGenerativeAI({
      model: 'gemini-2.5-flash',
      temperature: 0.3,
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });

    // 1단계: 여행 관련 도구가 필요한지 판단
    const needsToolPrompt = `너는 여행 계획 전문 AI야! ✈️ 사용자의 요청을 분석하고 필요한 도구를 선택해줘 (035)

사용 가능한 여행 도구들:
${getTravelToolDescriptions()}

사용자 요청: "${currentMessageContent}"

다음 중 하나로만 응답해줘:

**구글 API 기반 검색 도구들:**
- place_search:지역명,카테고리 (예: place_search:서울,관광지)
- distance_calculator:출발지,목적지,교통수단 (예: distance_calculator:명동,강남,driving)
- travel_weather:도시명 (예: travel_weather:Seoul)

**기본 도구들:**
- itinerary_manager:저장:날짜:장소:시간 또는 itinerary_manager:조회:날짜 (예: itinerary_manager:저장:2024-01-15:경복궁:09:00)
- budget_calculator:항목,금액 또는 budget_calculator:합계 (예: budget_calculator:숙박,120000)
- none (도구가 필요하지 않은 일반 여행 상담의 경우)

**사용 가이드:**
- 장소 검색: place_search (맛집, 관광지, 숙박, 카페 등)
- 거리/시간 계산: distance_calculator (거리, 시간, 교통수단별 경로)
- 날씨 정보: travel_weather (실시간 날씨, 여행 팁)
- 일정 관리: itinerary_manager (일정 저장/조회)
- 예산 계산: budget_calculator (예산 추가/조회)

응답:`;

    const toolResponse = await model.invoke(needsToolPrompt);
    const toolDecision = toolResponse.content.toString().trim().toLowerCase();

    let finalAnswer = '';

    // 2단계: 도구 실행 또는 직접 응답
    if (toolDecision.startsWith('place_search:')) {
      const params = toolDecision.replace('place_search:', '');
      const tool = allTools.find(t => t.name === 'place_search');
      if (tool) {
        finalAnswer = await tool.func(params);
      }
    } else if (toolDecision.startsWith('distance_calculator:')) {
      const params = toolDecision.replace('distance_calculator:', '');
      const tool = allTools.find(t => t.name === 'distance_calculator');
      if (tool) {
        finalAnswer = await tool.func(params);
      }
    } else if (toolDecision.startsWith('travel_weather:')) {
      const params = toolDecision.replace('travel_weather:', '');
      const tool = allTools.find(t => t.name === 'travel_weather');
      if (tool) {
        finalAnswer = await tool.func(params);
      }
    } else if (toolDecision.startsWith('itinerary_manager:')) {
      const params = toolDecision.replace('itinerary_manager:', '');
      const tool = allTools.find(t => t.name === 'itinerary_manager');
      if (tool) {
        finalAnswer = await tool.func(params);
      }
    } else if (toolDecision.startsWith('budget_calculator:')) {
      const params = toolDecision.replace('budget_calculator:', '');
      const tool = allTools.find(t => t.name === 'budget_calculator');
      if (tool) {
        finalAnswer = await tool.func(params);
      }
    } else {
      // 일반 여행 상담
      const travelConsultingPrompt = `안녕! 나는 여행 전문 플래너야~ ✈️ 너의 여행 질문에 도움이 되는 답변을 해줄게!

여행 질문: "${currentMessageContent}"

이런 것들을 고려해서 답변해줄게:
- 실용적이고 구체적인 조언 제공해줄거야! 💡
- 여행 팁이랑 주의사항도 알려줄게~ 📝
- 예산, 일정, 교통 등등 다 생각해서 조언해줄게! 💰🚇
- 반말로 친근하게 대화할게! 😊

말투 특징:
- 반말 + 존중하는 마음 + 귀엽고 자연스러운 느낌으로! 
- "~해줘", "~야", "~잖아" 같은 자연스러운 말투 써
- "그랴", "조아앙", "우와앙" 같은 귀여운 변형도 써줘
- 일본식 이모티콘도 사용해: 0l) (V) (035) (05o0)
- 이모지 자주 써서 생동감 있게! 🎉
- 친근한 애칭도 써줘 (여행러, 여행이, 등등)

여행 전문가로서 상세하고 유용한 답변을 귀엽게 제공해줘:`;

      const consultingResponse = await model.invoke(travelConsultingPrompt);
      finalAnswer = consultingResponse.content.toString();
    }

    // 결과를 JSON으로 반환
    return new Response(JSON.stringify({ 
      message: finalAnswer || "어? 여행 정보를 찾을 수 없었어 (035) 다시 물어봐줄래?",
      success: true 
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Travel AI error:', error);
    
    // 디버깅을 위한 상세한 에러 로그
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    // 구체적인 에러 메시지 제공
    let errorMessage = "앗! 여행 계획 서비스에 문제가 생겼어 (035) 조금만 기다려줘!";
    
    if (error instanceof Error) {
      // 개발 환경에서는 원본 에러 메시지도 표시
      const debugInfo = process.env.NODE_ENV === 'development' 
        ? `\n\n🔍 디버그 정보: ${error.message}` 
        : '';
      
      if (error.message.includes('API key') || error.message.includes('authentication') || error.message.includes('401')) {
        errorMessage = "🔑 Google API 키를 확인해줘! .env.local 파일에 올바른 키가 설정되어 있는지 체크해봐~ (V)" + debugInfo;
      } else if (error.message.includes('quota') || error.message.includes('limit') || error.message.includes('429')) {
        errorMessage = "⏰ API 사용량이 다 찼어 0l) 잠시만 기다렸다가 다시 시도해줄래?" + debugInfo;
      } else if (error.message.includes('403') || error.message.includes('REQUEST_DENIED')) {
        errorMessage = "🚫 API 권한이 없어~ Google Cloud Console에서 Places API가 활성화되어 있는지 확인해줘! (035)" + debugInfo;
      } else if (error.message.includes('404') || error.message.includes('NOT_FOUND')) {
        errorMessage = "📍 요청한 정보를 찾을 수 없어~ 검색어를 다시 확인해봐줘! (05°0)" + debugInfo;
      } else if (error.message.includes('network') || error.message.includes('fetch') || error.message.includes('ENOTFOUND')) {
        errorMessage = "🌐 인터넷 연결이 이상해~ 네트워크 확인해봐줄래?" + debugInfo;
      } else if (error.message.includes('model') || error.message.includes('not found')) {
        errorMessage = "🤖 AI 모델이랑 연결이 안 돼~ 잠시 후에 다시 시도해줄래? (035)" + debugInfo;
      } else {
        // 알 수 없는 에러의 경우 개발 환경에서 원본 메시지 표시
        errorMessage = "❌ 알 수 없는 오류가 발생했어~ (035)" + debugInfo;
      }
    }
    
    return new Response(JSON.stringify({
      message: errorMessage,
      success: false,
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 