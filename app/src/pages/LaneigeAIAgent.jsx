import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { GlassCard } from '../components/GlassCard';
import { SourcesDisplay } from '../components/SourcesDisplay';
import { Sparkles, Send, Bot, User, TrendingUp, DollarSign, Users, Target, Lightbulb, BarChart3 } from 'lucide-react';
import { InsightEngine } from '../utils/insightEngine';
import { QASystem } from '../utils/qaSystem';
import { askClaude, prepareDataContext } from '../utils/claudeAPI';

// Import data
import productDetailsData from '../data/product_details.json';
import categoryProductsData from '../data/category_products.json';

export const LaneigeAIAgent = () => {
  const [qaSystem, setQASystem] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [customQuestion, setCustomQuestion] = useState('');
  const messagesEndRef = useRef(null);

  // Initialize QA System
  useEffect(() => {
    const engine = new InsightEngine(productDetailsData, categoryProductsData);
    const qa = new QASystem(engine);
    setQASystem(qa);

    // Add welcome message
    setMessages([{
      id: 'welcome',
      type: 'bot',
      content: '안녕하세요! 👋 LANEIGE AI Agent입니다.\n\n아마존 시장 데이터를 기반으로 비즈니스 인사이트를 제공해 드립니다. 궁금하신 점을 선택하시거나 직접 질문해 주세요.',
      timestamp: new Date()
    }]);
  }, []);

  // Scroll to bottom when new message (only within chat container)
  useEffect(() => {
    if (messages.length > 1) { // Don't scroll on initial welcome message
      messagesEndRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      });
    }
  }, [messages]);

  // Handle question selection
  const handleQuestionClick = async (questionId) => {
    if (!qaSystem || isThinking) return;

    const question = qaSystem.getPredefinedQuestions().find(q => q.id === questionId);
    if (!question) return;

    // Add user question
    const userMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: question.question,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setIsThinking(true);

    // Simulate thinking delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Get answer
    const result = await qaSystem.processQuestion(questionId);

    // Add bot response
    const botMessage = {
      id: `bot-${Date.now()}`,
      type: 'bot',
      content: result.success ? result.answer : { error: result.error },
      timestamp: new Date(),
      questionId
    };
    setMessages(prev => [...prev, botMessage]);
    setIsThinking(false);
  };

  // Handle custom question submission
  const handleCustomQuestion = async () => {
    if (!qaSystem || isThinking || !customQuestion.trim()) return;

    const questionText = customQuestion.trim();
    setCustomQuestion(''); // Clear input

    // Add user question
    const userMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: questionText,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setIsThinking(true);

    // Process custom question with Claude API
    const result = await qaSystem.processCustomQuestion(
      questionText,
      askClaude,
      prepareDataContext
    );

    // Add bot response
    const botMessage = {
      id: `bot-${Date.now()}`,
      type: 'bot',
      content: result.success ? result.answer : { error: result.error },
      timestamp: new Date(),
      isCustom: true
    };
    setMessages(prev => [...prev, botMessage]);
    setIsThinking(false);
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCustomQuestion();
    }
  };

  // Render answer content
  // Parse markdown-like formatting in insights
  const parseInsight = (text) => {
    const parts = [];
    let currentText = text;
    let key = 0;

    // Split by **bold** markers
    const boldRegex = /\*\*(.*?)\*\*/g;
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(currentText)) !== null) {
      // Add text before the bold part
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${key++}`}>
            {currentText.substring(lastIndex, match.index)}
          </span>
        );
      }
      // Add the bold part
      parts.push(
        <span key={`bold-${key++}`} className="font-semibold text-white/90">
          {match[1]}
        </span>
      );
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < currentText.length) {
      parts.push(
        <span key={`text-${key++}`}>
          {currentText.substring(lastIndex)}
        </span>
      );
    }

    return parts.length > 0 ? parts : text;
  };

  const renderAnswer = (answer) => {
    if (answer.error) {
      return (
        <div className="text-red-300 text-sm">
          ❌ {answer.error}
        </div>
      );
    }

    // Handle custom Claude responses
    if (answer.type === 'custom_claude') {
      return (
        <div className="space-y-4">
          <div className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">
            {answer.fullText}
          </div>
          {answer.usage && (
            <div className="text-white/30 text-xs mt-4 flex items-center gap-4">
              <span>🤖 {answer.model}</span>
              <span>📊 {answer.usage.input_tokens} in / {answer.usage.output_tokens} out</span>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Summary */}
        <div className="text-white/90 text-sm leading-relaxed">
          {answer.summary}
        </div>

        {/* Insights */}
        {answer.insights && answer.insights.length > 0 && (
          <div className="space-y-2">
            <div className="text-purple-300 text-xs font-medium uppercase tracking-wider flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Key Insights
            </div>
            <div className="space-y-1">
              {answer.insights.map((insight, idx) => (
                <div key={idx} className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">
                  {parseInsight(insight)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data visualization based on answer type */}
        {answer.type === 'competitors' && answer.data?.topCompetitors && (
          <div className="mt-4 space-y-2">
            <div className="text-blue-300 text-xs font-medium uppercase tracking-wider">
              Top Competitors
            </div>
            {answer.data.topCompetitors.map((comp, idx) => (
              <div key={idx} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                <span className="text-white/80 text-sm">{comp.brand}</span>
                <span className="text-blue-300 text-sm font-medium">{comp.productCount} products</span>
              </div>
            ))}
          </div>
        )}

        {answer.type === 'brand_visibility' && answer.data?.rating && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg p-4 border border-green-400/20">
              <div className="text-green-300 text-xs uppercase tracking-wider mb-1">Avg Rating</div>
              <div className="text-white text-2xl font-light">{answer.data.rating.avg.toFixed(1)}</div>
              <div className="text-white/50 text-xs mt-1">{answer.data.rating.count} products</div>
            </div>
            {answer.data.reviews && (
              <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg p-4 border border-blue-400/20">
                <div className="text-blue-300 text-xs uppercase tracking-wider mb-1">Total Reviews</div>
                <div className="text-white text-2xl font-light">{(answer.data.reviews.total / 1000).toFixed(1)}K</div>
                <div className="text-white/50 text-xs mt-1">Avg {(answer.data.reviews.avg).toFixed(0)} per product</div>
              </div>
            )}
          </div>
        )}

        {answer.type === 'strengths' && answer.data?.positiveReviews && answer.data.positiveReviews.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="text-green-300 text-xs font-medium uppercase tracking-wider">
              Customer Favorites
            </div>
            <div className="flex flex-wrap gap-2">
              {answer.data.positiveReviews.slice(0, 6).map((positive, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-full bg-green-500/10 text-green-200 text-xs border border-green-400/30"
                >
                  {positive}
                </span>
              ))}
            </div>
          </div>
        )}

        {answer.type === 'category_leaders' && answer.data?.topProducts && (
          <div className="mt-4 space-y-2">
            <div className="text-yellow-300 text-xs font-medium uppercase tracking-wider">
              Top Products
            </div>
            {answer.data.topProducts.slice(0, 3).map((product, idx) => (
              <div key={idx} className="bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="text-white/80 text-sm mb-2">{product.name}</div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-yellow-300">⭐ {product.rating}</span>
                  <span className="text-white/50">{parseInt(product.reviews).toLocaleString()} reviews</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Strategic Actions */}
        {answer.strategicActions && answer.strategicActions.length > 0 && (
          <div className="mt-6 space-y-3">
            <div className="text-purple-300 text-xs font-medium uppercase tracking-wider flex items-center gap-2">
              <Target className="w-4 h-4" />
              Strategic Actions
            </div>
            {answer.strategicActions.map((action, idx) => {
              const priorityColors = {
                critical: 'from-red-500/20 to-orange-500/20 border-red-400/40',
                high: 'from-orange-500/15 to-yellow-500/15 border-orange-400/30',
                medium: 'from-blue-500/15 to-cyan-500/15 border-blue-400/30'
              };
              const priorityLabels = {
                critical: '🚨 긴급',
                high: '⚡ 높음',
                medium: '📌 중간'
              };

              return (
                <div
                  key={idx}
                  className={`bg-gradient-to-br ${priorityColors[action.priority]} rounded-lg p-4 border`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-white/90 text-sm font-medium">{action.action}</div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                      {priorityLabels[action.priority]}
                    </span>
                  </div>
                  <div className="text-white/60 text-xs mb-2">
                    💡 {action.rationale}
                  </div>
                  <div className="text-white/70 text-xs bg-white/5 rounded p-2 border border-white/10">
                    ✓ {action.recommendation}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Category icon mapping
  const categoryIcons = {
    competition: Users,
    market: TrendingUp,
    pricing: DollarSign,
    analysis: BarChart3,
    strategy: Target,
    trends: Sparkles,
    rankings: TrendingUp
  };

  const predefinedQuestions = qaSystem?.getPredefinedQuestions() || [];

  return (
    <div className="min-h-screen p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-[1600px] mx-auto"
      >
        {/* Header */}
        <div className="mb-12 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10 mb-8"
          >
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span className="text-sm tracking-[0.3em] text-white/70 uppercase">
              AMORE PACIFIC AI AGENT 07
            </span>
          </motion.div>

          <h1 className="text-6xl font-extralight tracking-[0.2em] text-white/95 mb-6 text-gradient">
            LANEIGE INTELLIGENCE
          </h1>
          <p className="text-lg font-light text-white/60 tracking-wider max-w-3xl mx-auto leading-relaxed">
            미국 Amazon Market의 흐름과 소비자의 목소리를 통합적으로 분석함으로써<br/>
            LANEIGE의 미국 시장에서의 성장을 지원합니다
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Question Selection Panel */}
          <div className="lg:col-span-1 space-y-4">
            <GlassCard className="p-6">
              <h3 className="text-lg font-light text-white/90 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Sample Questions
              </h3>

              {/* Questions List */}
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {predefinedQuestions.map((q) => {
                  const Icon = categoryIcons[q.category] || Sparkles;
                  return (
                    <motion.button
                      key={q.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleQuestionClick(q.id)}
                      disabled={isThinking}
                      className="w-full text-left p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-400/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-start gap-2">
                        <Icon className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                        <span className="text-white/80 text-sm">{q.question}</span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </GlassCard>
          </div>

          {/* Chat Panel */}
          <div className="lg:col-span-2">
            <GlassCard className="p-6 flex flex-col" style={{ height: 'calc(100vh - 200px)', minHeight: '600px', maxHeight: '900px' }}>
              <h3 className="text-lg font-light text-white/90 mb-4 flex items-center gap-2">
                <Bot className="w-5 h-5 text-blue-400" />
                Conversation
              </h3>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                <AnimatePresence mode="popLayout">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`
                          max-w-[85%] rounded-2xl p-4
                          ${message.type === 'user'
                            ? 'bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-400/30'
                            : 'bg-white/5 border border-white/10'
                          }
                        `}
                      >
                        <div className="flex items-start gap-3 mb-2">
                          <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                            ${message.type === 'user'
                              ? 'bg-purple-500/30'
                              : 'bg-blue-500/30'
                            }
                          `}>
                            {message.type === 'user'
                              ? <User className="w-4 h-4 text-white" />
                              : <Bot className="w-4 h-4 text-white" />
                            }
                          </div>
                          <div className="flex-1">
                            <div className="text-white/50 text-xs mb-1">
                              {message.type === 'user' ? 'You' : 'AI Agent'}
                            </div>
                            {typeof message.content === 'string' ? (
                              <div className="text-white/90 text-sm whitespace-pre-wrap">
                                {message.content}
                              </div>
                            ) : (
                              <>
                                {renderAnswer(message.content)}
                                {message.sources && message.sources.length > 0 && (
                                  <SourcesDisplay sources={message.sources} />
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-white/30 text-xs text-right">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* Thinking indicator */}
                  {isThinking && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-500/30 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-white animate-pulse" />
                          </div>
                          <div className="flex gap-1">
                            <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-white/10 pt-4">
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-white/5 border border-white/10 hover:border-purple-400/30 transition-all">
                  <input
                    type="text"
                    value={customQuestion}
                    onChange={(e) => setCustomQuestion(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="자유롭게 질문하세요... (예: LANEIGE 제품 중 가장 인기 있는 것은?)"
                    disabled={isThinking}
                    className="flex-1 bg-transparent text-white text-sm outline-none placeholder-white/40 disabled:cursor-not-allowed"
                  />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleCustomQuestion}
                    disabled={isThinking || !customQuestion.trim()}
                    className="disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Send className={`w-5 h-5 ${isThinking || !customQuestion.trim() ? 'text-white/30' : 'text-purple-400'}`} />
                  </motion.button>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="mt-20 text-center"
        >
          <div className="inline-flex items-center gap-2 text-sm text-white/30 tracking-[0.2em]">
            <Sparkles className="w-4 h-4" />
            <span>Powered by AMORE PACIFIC AI AGENT 07</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LaneigeAIAgent;
