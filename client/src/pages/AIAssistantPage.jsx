import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Plus,
  Trash2,
  Bot,
  User,
  Loader2,
  HelpCircle,
  MessageSquare,
  ChevronRight
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import ChatCardRenderer from '../components/ChatCardRenderer';

const SUGGESTED_PROMPTS = [
  "How much did I spend this month?",
  "Where does most of my money go?",
  "Compare this month with last month",
  "How much did I spend on food?",
  "Am I exceeding my monthly budget?",
  "Show my largest transactions",
  "Can I afford a 10,000 purchase?",
  "Check my roommate shared group balances"
];

export default function AIAssistantPage() {
  const { user } = useAuth();
  const { format } = useCurrency();

  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/ai/conversations');
      setConversations(res.data.data);
      if (res.data.data.length > 0 && !activeConversationId) {
        loadConversation(res.data.data[0]._id);
      } else if (res.data.data.length === 0) {
        startNewConversation();
      }
    } catch (e) {
      console.error('Failed to load conversations:', e);
    }
  };

  const loadConversation = async (convId) => {
    setActiveConversationId(convId);
    setFetchingHistory(true);
    try {
      const res = await api.get(`/ai/conversations/${convId}`);
      setMessages(res.data.data.messages || []);
    } catch (e) {
      toast.error('Failed to load conversation history');
    } finally {
      setFetchingHistory(false);
    }
  };

  const startNewConversation = () => {
    setActiveConversationId(null);
    setMessages([
      {
        role: 'model',
        content: `Hello ${user?.name?.split(' ')[0] || ''}! I'm your SpendSense AI Assistant. I have live access to your financial transactions, budgets, categories, and group balances. What would you like to explore today?`,
        timestamp: new Date()
      }
    ]);
  };

  const handleDeleteConversation = async (convId, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/ai/conversations/${convId}`);
      toast.success('Conversation deleted');
      const updated = conversations.filter(c => c._id !== convId);
      setConversations(updated);
      if (activeConversationId === convId) {
        startNewConversation();
      }
    } catch (e) {
      toast.error('Failed to delete conversation');
    }
  };

  const handleSendMessage = async (customPrompt = null) => {
    const textToSend = (customPrompt || inputText).trim();
    if (!textToSend || loading) return;

    // Optimistically push user message
    const userMsg = {
      role: 'user',
      content: textToSend,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', {
        message: textToSend,
        conversationId: activeConversationId
      });

      const { conversationId, response } = res.data.data;
      if (!activeConversationId) {
        setActiveConversationId(conversationId);
        fetchConversations();
      }

      setMessages(prev => [...prev, response]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Chat service encountered an error.');
      setMessages(prev => [
        ...prev,
        {
          role: 'model',
          content: 'Sorry, I encountered an issue processing your query. Please try again.',
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col md:flex-row gap-4 overflow-hidden">
      {/* Left Chat Sidebar (Conversation History) */}
      <div className="hidden md:flex flex-col w-64 bg-[#101727] rounded-2xl border border-slate-800 p-3 shrink-0">
        <button
          onClick={startNewConversation}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-900/30 transition mb-3"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </button>

        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">
          Chat History
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto pr-1">
          {conversations.map((c) => (
            <div
              key={c._id}
              onClick={() => loadConversation(c._id)}
              className={`flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer group transition ${
                activeConversationId === c._id
                  ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30'
                  : 'text-slate-300 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <MessageSquare className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{c.title}</span>
              </div>
              <button
                onClick={(e) => handleDeleteConversation(c._id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 rounded transition"
                title="Delete chat"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}

          {conversations.length === 0 && (
            <div className="text-center py-6 text-xs text-slate-500">
              No saved chats yet.
            </div>
          )}
        </div>
      </div>

      {/* Main Conversation Window */}
      <div className="flex-1 flex flex-col bg-[#101727] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        {/* Chat Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-[#141E30]/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white shadow-md shadow-purple-600/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">SpendSense AI Assistant</h3>
              <p className="text-[11px] text-slate-400">Powered by Google Gemini with tool calling</p>
            </div>
          </div>

          <button
            onClick={startNewConversation}
            className="md:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={idx}
                className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`p-4 rounded-2xl text-xs leading-relaxed shadow-sm ${
                    isUser
                      ? 'bg-purple-600 text-white rounded-br-none'
                      : 'bg-[#141E30] border border-slate-800 text-slate-200 rounded-bl-none'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* Render Financial Insight Cards inside response */}
                  {msg.cards && msg.cards.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {msg.cards.map((card, cIdx) => (
                        <ChatCardRenderer key={cIdx} card={card} />
                      ))}
                    </div>
                  )}

                  <div className={`text-[10px] mt-1.5 ${isUser ? 'text-purple-200' : 'text-slate-500'}`}>
                    {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold shrink-0 mt-1">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 max-w-xl mr-auto">
              <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0 mt-1">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl bg-[#141E30] border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                <span>Analyzing your financial records...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Prompt Suggestions Bar */}
        <div className="px-4 py-2 border-t border-slate-800/80 bg-[#090D18]/50 overflow-x-auto">
          <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
              Suggestions:
            </span>
            {SUGGESTED_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                disabled={loading}
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700/80 transition"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Input Bar */}
        <div className="p-3.5 bg-[#141E30] border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask anything about your money, budget, or spending trends..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#090D18] border border-slate-700 text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500 transition"
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition shadow-md shadow-purple-900/30 disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
