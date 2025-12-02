import { useState, useRef, useEffect, memo } from 'react';

const ChatBot = memo(({ tasks, onAddTask, onCompleteTask, webhookUrl }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: `안녕하세요! 업무 도우미입니다.

📋 업무 등록 양식
─────────────
• 제목* : 업무 내용
• 마감일 : 내일/모레/3일후
• 중요도 : 높음/보통/낮음

📝 예시:
"보고서 작성 내일 높음"
"회의 준비 3일후"

📌 조회 명령어
─────────────
• "할 일 보여줘"
• "업무 요약"

💬 그 외는 AI가 답변!`,
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (type, text) => {
    setMessages(prev => [...prev, {
      id: Date.now(),
      type,
      text,
    }]);
  };

  const handleLocalCommand = (message) => {
    const lowerMsg = message.toLowerCase();

    // 업무 목록 보기
    if (lowerMsg.includes('할 일') || lowerMsg.includes('업무 목록') || lowerMsg.includes('보여줘')) {
      const activeTasks = tasks.filter(t => t.status !== 'completed');
      if (activeTasks.length === 0) {
        return '현재 등록된 업무가 없습니다.';
      }
      let response = `현재 ${activeTasks.length}개의 업무가 있습니다:\n\n`;
      activeTasks.forEach((task, i) => {
        const status = task.status === 'pending' ? '대기중' : '진행중';
        response += `${i + 1}. ${task.title} [${status}]\n`;
        if (task.dueDate) {
          response += `   마감: ${new Date(task.dueDate).toLocaleDateString('ko-KR')}\n`;
        }
      });
      return response;
    }

    // 완료된 업무 보기
    if (lowerMsg.includes('완료') && lowerMsg.includes('보여')) {
      const completedTasks = tasks.filter(t => t.status === 'completed');
      if (completedTasks.length === 0) {
        return '완료된 업무가 없습니다.';
      }
      let response = `완료된 업무 ${completedTasks.length}개:\n\n`;
      completedTasks.forEach((task, i) => {
        response += `${i + 1}. ${task.title}\n`;
      });
      return response;
    }

    // 업무 요약
    if (lowerMsg.includes('요약') || lowerMsg.includes('현황')) {
      const active = tasks.filter(t => t.status !== 'completed');
      const pending = tasks.filter(t => t.status === 'pending');
      const inProgress = tasks.filter(t => t.status === 'in_progress');
      const completed = tasks.filter(t => t.status === 'completed');

      const overdue = active.filter(t =>
        t.dueDate && new Date(t.dueDate) < new Date()
      );

      return `업무 현황 요약:\n\n` +
        `- 전체: ${tasks.length}개\n` +
        `- 대기중: ${pending.length}개\n` +
        `- 진행중: ${inProgress.length}개\n` +
        `- 완료: ${completed.length}개\n` +
        `- 마감 초과: ${overdue.length}개`;
    }

    return null; // 로컬에서 처리 못함
  };

  const parseTaskFromMessage = (message) => {
    let title = message;
    let dueDate = null;
    let priority = 'medium'; // 기본값

    const now = new Date();

    // 우선순위 파싱
    if (/높음|긴급|중요/.test(message)) {
      priority = 'high';
      title = title.replace(/높음|긴급|중요/g, '');
    } else if (/낮음|여유/.test(message)) {
      priority = 'low';
      title = title.replace(/낮음|여유/g, '');
    } else if (/보통|일반/.test(message)) {
      priority = 'medium';
      title = title.replace(/보통|일반/g, '');
    }

    // 날짜 패턴 파싱 (우선순위 순서대로)
    const datePatterns = [
      // "3일 후", "5일 뒤"
      { regex: /(\d+)일\s*(후|뒤)/g, days: (match) => parseInt(match[1]) },
      // "다음주", "다음 주"
      { regex: /다음\s*주/g, days: () => 7 },
      // "모레"
      { regex: /모레/g, days: () => 2 },
      // "내일"
      { regex: /내일/g, days: () => 1 },
      // "오늘"
      { regex: /오늘/g, days: () => 0 },
    ];

    // 날짜 패턴 찾기
    for (const pattern of datePatterns) {
      const match = message.match(pattern.regex);
      if (match) {
        const targetDate = new Date(now);
        const daysToAdd = typeof pattern.days === 'function'
          ? pattern.days(match)
          : pattern.days;
        targetDate.setDate(targetDate.getDate() + daysToAdd);
        targetDate.setHours(18, 0, 0, 0); // 마감 시간을 오후 6시로 설정

        // 로컬 시간 기준으로 형식 생성 (UTC 변환 문제 방지)
        const year = targetDate.getFullYear();
        const month = String(targetDate.getMonth() + 1).padStart(2, '0');
        const day = String(targetDate.getDate()).padStart(2, '0');
        const hours = String(targetDate.getHours()).padStart(2, '0');
        const minutes = String(targetDate.getMinutes()).padStart(2, '0');
        dueDate = `${year}-${month}-${day}T${hours}:${minutes}`;

        // 날짜 표현 제거
        title = title.replace(pattern.regex, '');
        break;
      }
    }

    // 추가 키워드 제거
    title = title
      .replace(/까지/g, '')
      .replace(/해야\s*해/g, '')
      .replace(/해야\s*함/g, '')
      .replace(/해야지/g, '')
      .replace(/할\s*일/g, '')
      .replace(/등록/g, '')
      .replace(/추가/g, '')
      .replace(/해줘/g, '')
      .replace(/\s+/g, ' ') // 여러 공백을 하나로
      .trim();

    return { title, dueDate, priority };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    addMessage('user', userMessage);

    // 1. 로컬 명령어 체크 (할 일 목록, 요약 등)
    const localResponse = handleLocalCommand(userMessage);
    if (localResponse) {
      addMessage('bot', localResponse);
      return;
    }

    // 2. 업무 등록 패턴 체크 (날짜 표현 + 업무 관련 키워드)
    const datePatterns = ['내일', '모레', '오늘', '다음주', '다음 주', '일 후', '일 뒤', '까지'];
    const taskKeywords = ['등록', '추가', '해야', '할 일', '해줘'];

    const hasDatePattern = datePatterns.some(p => userMessage.includes(p));
    const hasTaskKeyword = taskKeywords.some(p => userMessage.includes(p));

    // 날짜 패턴이 있거나, 업무 키워드가 있으면 업무 등록으로 판단
    const isTaskCreation = hasDatePattern || hasTaskKeyword;

    if (isTaskCreation) {
      const { title, dueDate, priority } = parseTaskFromMessage(userMessage);
      if (title.length >= 2) {
        onAddTask({
          title,
          dueDate,
          priority,
          description: '',
          category: '',
          tags: [],
          taskType: 'general',
        });

        const priorityLabel = { high: '🔴 높음', medium: '🟡 보통', low: '🟢 낮음' }[priority];
        addMessage('bot', `✅ 업무를 등록했습니다!\n\n📌 제목: ${title}${dueDate ? '\n📅 마감: ' + new Date(dueDate).toLocaleDateString('ko-KR') : ''}\n⚡ 중요도: ${priorityLabel}`);
        return;
      }
    }

    // 3. 그 외 모든 입력은 AI로 전달
    if (!webhookUrl) {
      addMessage('bot', '💡 AI 응답 기능을 사용하려면 설정에서 n8n 웹훅 URL을 입력해주세요.\n\n업무 등록은 "내일까지 보고서 작성" 형식으로 입력하세요.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          type: 'question',
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const text = await response.text();

        if (!text || text.trim() === '') {
          addMessage('bot', 'AI에서 빈 응답을 받았습니다.');
          return;
        }

        // JSON 파싱 시도
        let data;
        let isJson = false;
        try {
          data = JSON.parse(text);
          isJson = true;
        } catch (e) {
          // JSON이 아니면 텍스트 그대로 사용
          addMessage('bot', text);
          return;
        }

        // JSON인 경우 처리
        if (isJson) {
          // n8n이 배열로 감싸서 보내는 경우 처리
          if (Array.isArray(data) && data.length > 0) {
            data = data[0];
          }

          // 여러 응답 형태 지원
          const message = data.response || data.answer || data.output || data.text;

          if (message) {
            addMessage('bot', message);
          } else {
            addMessage('bot', `응답을 처리할 수 없습니다.`);
          }
        }
      } else {
        addMessage('bot', `서버 연결 실패 (${response.status})`);
      }
    } catch (error) {
      console.error('웹훅 에러:', error);
      addMessage('bot', `네트워크 오류가 발생했습니다.\n웹훅 URL을 확인해주세요.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`chatbot-container ${isOpen ? 'open' : ''}`}>
      <button
        className="chatbot-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? '×' : '💬'}
      </button>

      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <h3>업무 도우미</h3>
          </div>

          <div className="chatbot-messages">
            {messages.map(msg => (
              <div key={msg.id} className={`message ${msg.type}`}>
                <div className="message-content">
                  {msg.text.split('\n').map((line, i) => (
                    <span key={i}>
                      {line}
                      {i < msg.text.split('\n').length - 1 && <br />}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message bot">
                <div className="message-content loading">
                  <span>.</span><span>.</span><span>.</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chatbot-input" onSubmit={handleSubmit}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="메시지를 입력하세요..."
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !input.trim()}>
              전송
            </button>
          </form>
        </div>
      )}
    </div>
  );
});

ChatBot.displayName = 'ChatBot';

export default ChatBot;
