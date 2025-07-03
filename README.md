# LangChain Gemini Agent

A Next.js project that demonstrates a LangChain agent powered by Google's Gemini AI model. This agent can use various tools to perform calculations, check weather, manage memory, and provide current time information.

## Features

- **Calculator Tool**: Performs mathematical calculations
- **Weather Tool**: Provides weather information for Korean cities (Seoul, Busan, Daegu)
- **Memory Tool**: Stores and retrieves information
- **Time Tool**: Returns current Korean time
- **Interactive Chat Interface**: Clean and responsive UI built with Tailwind CSS

## Prerequisites

Before running this project, you need:

1. **Google Generative AI API Key**: Get it from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. **Node.js**: Version 18 or higher

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd langchain-gemini-agent
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory:
```bash
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser.

## Usage Examples

Try these example prompts with the agent:

- **Calculator**: "What is 2 + 2?" or "Calculate 100 * 5"
- **Weather**: "What's the weather in Seoul?" (Available: Seoul, Busan, Daegu)
- **Memory**: "저장:이름:김철수" (Save) or "조회:이름" (Retrieve)
- **Time**: "What time is it now?"

## Architecture

- **Frontend**: Next.js 15 with App Router, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes with LangChain and Google Generative AI
- **Agent Framework**: LangChain ReAct Agent with custom tools
- **AI Model**: Google Gemini Pro

## Project Structure

```
langchain-gemini-agent/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # API endpoint for chat
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main chat interface
├── lib/
│   └── tools.ts                  # LangChain tools definition
├── package.json
└── README.md
```

## Technologies Used

- [Next.js 15](https://nextjs.org/) - React framework
- [LangChain](https://js.langchain.com/) - AI application framework
- [Google Generative AI](https://ai.google.dev/) - Gemini AI model
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling

## Learn More

- [LangChain Documentation](https://js.langchain.com/docs/) - Learn about LangChain features
- [Google AI Documentation](https://ai.google.dev/docs) - Gemini AI model documentation
- [Next.js Documentation](https://nextjs.org/docs) - Next.js features and API

## License

This project is for educational purposes and demonstrates LangChain agent implementation.
