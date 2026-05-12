"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Bot, Database, Sparkles, 
  Clock, Plus, BarChart3, User, Loader2
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { useLazyStreamAiAnswerQuery } from '@/store/services/ai.service';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'table' | 'chart';
  data?: any[];
}

const AiAssistantPage = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Xin chào quản lý! Tôi là trợ lý AI thông minh của hệ thống kho. Bạn cần tôi giúp gì về dữ liệu hôm nay?',
    }
  ]);
  
  const [triggerStream, { data: streamResult, isFetching: isLoading }] = useLazyStreamAiAnswerQuery();
  const currentAssistantMsgId = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cập nhật tin nhắn từ Redux cache vào giao diện
  useEffect(() => {
    if (streamResult && currentAssistantMsgId.current) {
      const msgId = currentAssistantMsgId.current;
      setMessages(prev => prev.map(msg => 
        msg.id === msgId ? { ...msg, content: streamResult } : msg
      ));
    }
  }, [streamResult]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');

    const assistantMsgId = (Date.now() + 1).toString();
    currentAssistantMsgId.current = assistantMsgId;
    
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
    };
    setMessages(prev => [...prev, assistantMsg]);

    try {
      await triggerStream({ question: input, sessionId: 'user-123' }).unwrap();
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="relative z-10 flex h-[calc(100vh-120px)] w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-200 shadow-sm">
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8 py-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none">
            <Sparkles size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Trợ lý hệ thống</h1>
            <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium dark:text-green-400">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Sẵn sàng hỗ trợ
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           <button onClick={() => setMessages([messages[0]])} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-all dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
              <Plus size={14} />
              Mới
           </button>
           <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-all dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
              <Clock size={14} />
              Lịch sử
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-8 custom-scrollbar bg-transparent">
        <div className="mx-auto max-w-4xl space-y-8 pb-10">
          {messages.map((msg) => (
            <div 
              key={msg.id}
              className={cn(
                "flex w-full gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
                msg.role === 'user' ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border shadow-sm",
                msg.role === 'user' ? "bg-white text-blue-600 border-blue-100 dark:bg-slate-800 dark:border-slate-700" : "bg-blue-600 text-white border-blue-600"
              )}>
                {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
              </div>

              <div className={cn(
                "flex max-w-[85%] flex-col gap-3",
                msg.role === 'user' ? "items-end" : "items-start"
              )}>
                <div className={cn(
                  "rounded-2xl px-5 py-3.5 text-[15px] leading-relaxed shadow-sm whitespace-pre-wrap break-words",
                  msg.role === 'user' 
                    ? "bg-blue-600 text-white rounded-tr-none" 
                    : "bg-white text-slate-800 border border-slate-100 rounded-tl-none dark:bg-slate-900 dark:text-slate-200 dark:border-slate-800"
                )}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4 animate-pulse">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-slate-400">
                <Bot size={18} />
              </div>
              <div className="rounded-2xl bg-slate-100 px-5 py-3.5 dark:bg-slate-900">
                <Loader2 size={18} className="animate-spin text-blue-500" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="shrink-0 border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-4xl relative">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Đặt câu hỏi về vận hành kho..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 pr-14 text-[15px] outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:focus:border-blue-500"
            disabled={isLoading}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-2 bottom-2 flex w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:scale-100"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] text-slate-400 dark:text-slate-500 italic">
          AI có thể đưa ra câu trả lời không chính xác. Vui lòng kiểm tra lại các số liệu quan trọng.
        </p>
      </div>
    </div>
  );
};

export default AiAssistantPage;
