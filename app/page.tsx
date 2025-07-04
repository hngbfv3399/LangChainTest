'use client';

import { useState, useRef, useEffect } from 'react';

export default function Chat() {
  const [messages, setMessages] = useState<Array<{
    id: string, 
    role: string, 
    content: string, 
    timestamp: Date
  }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: input,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, userMessage]
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        const aiMessage = { 
          id: (Date.now() + 1).toString(), 
          role: 'assistant', 
          content: data.message,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      const errorMessage = { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: `🚨 오류가 발생했습니다: ${error}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">✈️</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">AI 여행 검색</h1>
            <p className="text-sm text-gray-500">완벽한 여행 계획을 위한 스마트 어시스턴트</p>
          </div>
          <div className="ml-auto">
            <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              온라인
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🚀</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">여행 계획에 오신 것을 환영합니다! ✈️</h3>
              <p className="text-gray-500 mb-6">AI 여행 플래너와 함께 완벽한 여행을 준비해보세요</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl mx-auto">
                <button 
                  onClick={() => setInput('서울 관광지 추천해줘')}
                  className="p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="font-medium text-gray-700">🏛️ 장소 검색</div>
                  <div className="text-sm text-gray-500">서울 관광지 추천해줘</div>
                </button>
                <button 
                  onClick={() => setInput('명동에서 강남까지 빠른길로 가고 싶어')}
                  className="p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="font-medium text-gray-700">🚗 고급 길찾기</div>
                  <div className="text-sm text-gray-500">명동에서 강남까지 빠른길로 가고 싶어</div>
                </button>
                <button 
                  onClick={() => setInput('제주도 맛집 블로그 포스트 찾아줘')}
                  className="p-3 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all text-left"
                >
                  <div className="font-medium text-gray-700">📝 블로그 검색</div>
                  <div className="text-sm text-gray-500">제주도 맛집 블로그 포스트 찾아줘</div>
                </button>
                <button 
                  onClick={() => setInput('부산 축제 뉴스 검색해줘')}
                  className="p-3 bg-white rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-all text-left"
                >
                  <div className="font-medium text-gray-700">📰 뉴스 검색</div>
                  <div className="text-sm text-gray-500">부산 축제 뉴스 검색해줘</div>
                </button>
                <button 
                  onClick={() => setInput('여행가방 쇼핑 정보 찾아줘')}
                  className="p-3 bg-white rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all text-left"
                >
                  <div className="font-medium text-gray-700">🛒 쇼핑 검색</div>
                  <div className="text-sm text-gray-500">여행가방 쇼핑 정보 찾아줘</div>
                </button>
                <button 
                  onClick={() => setInput('제주도 여행후기 카페 글 찾아줘')}
                  className="p-3 bg-white rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all text-left"
                >
                  <div className="font-medium text-gray-700">☕ 카페 검색</div>
                  <div className="text-sm text-gray-500">제주도 여행후기 카페 글 찾아줘</div>
                </button>
                <button 
                  onClick={() => setInput('저장:2024-01-15:경복궁:09:00')}
                  className="p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="font-medium text-gray-700">📅 일정 관리</div>
                  <div className="text-sm text-gray-500">여행 일정 저장하기</div>
                </button>
                <button 
                  onClick={() => setInput('숙박비 15만원 추가해줘')}
                  className="p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="font-medium text-gray-700">💰 예산 관리</div>
                  <div className="text-sm text-gray-500">숙박비 15만원 추가해줘</div>
                </button>
                <button 
                  onClick={() => setInput('부산 3박 4일 여행 계획 도와줘')}
                  className="p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="font-medium text-gray-700">✈️ 여행 상담</div>
                  <div className="text-sm text-gray-500">부산 3박 4일 여행 계획 도와줘</div>
                </button>
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              style={{
                animationDelay: `${index * 0.1}s`
              }}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white text-sm">🤖</span>
                </div>
              )}
              
              <div className={`max-w-[70%] ${message.role === 'user' ? 'order-2' : ''}`}>
                <div
                  className={`px-4 py-3 rounded-2xl shadow-sm ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white ml-auto'
                      : 'bg-white border border-gray-200 text-gray-800'
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content}
                  </div>
                </div>
                <div className={`text-xs text-gray-500 mt-1 ${
                  message.role === 'user' ? 'text-right' : 'text-left'
                }`}>
                  {formatTime(message.timestamp)}
                </div>
              </div>

              {message.role === 'user' && (
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1 order-3">
                  <span className="text-white text-sm">👤</span>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start animate-fade-in">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white text-sm">🤖</span>
              </div>
              <div className="max-w-[70%]">
                <div className="px-4 py-3 rounded-2xl bg-white border border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <span className="text-sm text-gray-600">AI가 생각하고 있어요...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-white/90 backdrop-blur-md border-t border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="flex-1 relative">
              <input
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-gray-50 placeholder-gray-500"
                value={input}
                placeholder="메시지를 입력하세요... 💬"
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                autoComplete="off"
              />
              {input && (
                <button
                  type="button"
                  onClick={() => setInput('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ❌
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading || input.trim().length === 0}
              className={`px-6 py-3 rounded-full font-medium transition-all duration-200 flex items-center gap-2 ${
                isLoading || input.trim().length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 shadow-lg hover:shadow-xl'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  전송 중
                </>
              ) : (
                <>
                  전송
                  <span className="text-lg">🚀</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
} 