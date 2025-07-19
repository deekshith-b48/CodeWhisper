import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Send, 
  Bot, 
  User, 
  ExternalLink, 
  ThumbsUp, 
  ThumbsDown, 
  Clock, 
  Database, 
  FileText,
  Code,
  MessageSquare,
  Copy,
  Check,
  AlertCircle,
  Sparkles
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import MarkdownRenderer from './MarkdownRenderer'
import { saveChatQuery, getCurrentUser } from '@/lib/hybridSupabase'

const ChatInterface = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "👋 **Welcome to CodeWhisperer!** I'm your AI-powered developer onboarding assistant. I can help you understand codebases, documentation, and internal processes. Every response I provide will include citations from our knowledge base so you know exactly where the information comes from.\n\n**What would you like to know?**",
      timestamp: new Date(),
      sources: [],
      isWelcome: true
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSourceType, setSelectedSourceType] = useState('all')
  const [copiedMessageId, setCopiedMessageId] = useState(null)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await fetch('http://localhost:5002/api/chat/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: inputValue,
          user_id: 'demo-user',
          source_type_filter: selectedSourceType === 'all' ? null : selectedSourceType
        }),
      })

      const data = await response.json()

      if (data.success) {
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: data.response,
          timestamp: new Date(),
          sources: data.sources || [],
          processingTime: data.processing_time,
          contextUsed: data.context_used
        }
        setMessages(prev => [...prev, botMessage])
      } else {
        throw new Error(data.error || 'Failed to get response')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: "❌ **Oops!** I encountered an error while processing your request. Please try again or contact support if the issue persists.",
        timestamp: new Date(),
        sources: [],
        isError: true
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleFeedback = async (messageId, rating) => {
    try {
      await fetch('/api/chat/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query_id: messageId,
          rating: rating
        }),
      })
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, userFeedback: rating }
          : msg
      ))
    } catch (error) {
      console.error('Error submitting feedback:', error)
    }
  }

  const handleCopyMessage = async (messageId, content) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedMessageId(messageId)
      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch (error) {
      console.error('Failed to copy message:', error)
    }
  }

  const sourceTypeOptions = [
    { value: 'all', label: 'All Sources', icon: Database },
    { value: 'code', label: 'Code', icon: Code },
    { value: 'documentation', label: 'Documentation', icon: FileText },
    { value: 'slack', label: 'Slack', icon: MessageSquare }
  ]

  const getSourceIcon = (sourceType) => {
    switch (sourceType) {
      case 'code': return <Code className="w-4 h-4" />
      case 'documentation': return <FileText className="w-4 h-4" />
      case 'slack': return <MessageSquare className="w-4 h-4" />
      default: return <Database className="w-4 h-4" />
    }
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="neo-brutalism-header p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-lg border-4 border-black">
              <Bot className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">CodeWhisperer Chat</h2>
              <p className="text-white/90 font-medium">AI-powered developer assistant with citations</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/20 p-2 rounded-lg border-2 border-white/30">
              <span className="text-white font-medium text-sm">Filter:</span>
              <select 
                value={selectedSourceType}
                onChange={(e) => setSelectedSourceType(e.target.value)}
                className="bg-white text-black font-bold px-3 py-1 border-2 border-black rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                {sourceTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-6 scrollbar-neo">
        <div className="space-y-6 max-w-4xl mx-auto">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-4xl ${message.type === 'user' ? 'ml-12' : 'mr-12'}`}>
                  <div className={`${
                    message.type === 'user' 
                      ? 'neo-brutalism-chat-bubble-user' 
                      : message.isError 
                        ? 'neo-brutalism-error'
                        : message.isWelcome
                          ? 'neo-brutalism-loading'
                          : 'neo-brutalism-chat-bubble'
                  }`}>
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg border-2 border-black ${
                        message.type === 'user' 
                          ? 'bg-blue-600' 
                          : message.isError 
                            ? 'bg-red-500'
                            : message.isWelcome
                              ? 'bg-yellow-500'
                              : 'bg-neutral-100'
                      }`}>
                        {message.type === 'user' ? (
                          <User className="w-5 h-5 text-white" />
                        ) : message.isWelcome ? (
                          <Sparkles className="w-5 h-5 text-black" />
                        ) : (
                                                      <Bot className={`w-5 h-5 ${message.isError ? 'text-white' : 'text-gray-700'}`} />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-base leading-relaxed font-medium">
                          {message.type === 'bot' ? (
                            <MarkdownRenderer content={message.content} />
                          ) : (
                            <div className="whitespace-pre-wrap font-bold">{message.content}</div>
                          )}
                        </div>
                        
                        {/* Message metadata */}
                        <div className="flex items-center gap-4 mt-3 text-sm opacity-80">
                          <span className="font-bold">{message.timestamp.toLocaleTimeString()}</span>
                          {message.processingTime && (
                            <span className="flex items-center gap-1 font-medium">
                              <Clock className="w-4 h-4" />
                              {message.processingTime.toFixed(2)}s
                            </span>
                          )}
                          {message.contextUsed && (
                            <span className="flex items-center gap-1 font-medium">
                              <Database className="w-4 h-4" />
                              {message.contextUsed} sources
                            </span>
                          )}
                          {message.type === 'bot' && !message.isError && !message.isWelcome && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCopyMessage(message.id, message.content)}
                              className="h-6 px-2 font-bold"
                            >
                              {copiedMessageId === message.id ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                        </div>

                        {/* Sources - Enhanced Perplexity-style citations */}
                        {message.sources && message.sources.length > 0 && (
                          <div className="mt-4">
                            <Separator className="my-3 border-2 border-black" />
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <Database className="w-5 h-5 text-purple-600" />
                                <span className="font-bold text-lg">Sources & Citations</span>
                              </div>
                              <div className="grid gap-3">
                                {message.sources.slice(0, 5).map((source, index) => (
                                  <div key={index} className="neo-brutalism-source-card">
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <div className="p-1 bg-purple-400 rounded border border-black">
                                          {getSourceIcon(source.source_type)}
                                        </div>
                                        <Badge className="neo-brutalism-badge">
                                          {source.source_type}
                                        </Badge>
                                        <span className="font-bold text-lg">{source.title}</span>
                                      </div>
                                      <div className="text-right">
                                        <div className="font-bold text-sm">
                                          {(source.similarity * 100).toFixed(0)}% match
                                        </div>
                                        <div className="text-xs opacity-70">
                                          #{index + 1}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-sm font-medium mb-2 bg-white p-2 border-2 border-black">
                                      {source.preview}
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <div className="text-xs font-bold">
                                        {source.file_path && `📁 ${source.file_path}`}
                                        {source.repository && ` | 📦 ${source.repository}`}
                                        {source.author && ` | 👤 ${source.author}`}
                                      </div>
                                      {source.url && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="neo-brutalism-button-secondary text-xs"
                                          onClick={() => window.open(source.url, '_blank')}
                                        >
                                          <ExternalLink className="w-3 h-3 mr-1" />
                                          View Source
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Feedback buttons for bot messages */}
                        {message.type === 'bot' && !message.isError && !message.isWelcome && (
                          <div className="flex items-center gap-3 mt-4 pt-3 border-t-2 border-black">
                            <span className="text-sm font-bold">Was this helpful?</span>
                            <Button
                              size="sm"
                              variant={message.userFeedback === 5 ? "default" : "outline"}
                              onClick={() => handleFeedback(message.id, 5)}
                              className="neo-brutalism-button-secondary h-8 px-3"
                            >
                              <ThumbsUp className="w-4 h-4 mr-1" />
                              Yes
                            </Button>
                            <Button
                              size="sm"
                              variant={message.userFeedback === 1 ? "default" : "outline"}
                              onClick={() => handleFeedback(message.id, 1)}
                              className="neo-brutalism-button-secondary h-8 px-3"
                            >
                              <ThumbsDown className="w-4 h-4 mr-1" />
                              No
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {/* Loading indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="max-w-4xl mr-12">
                <div className="neo-brutalism-loading">
                  <div className="flex items-center gap-4">
                                         <div className="p-3 bg-yellow-500 rounded-lg border-2 border-black">
                       <Bot className="w-5 h-5 text-black animate-pulse" />
                     </div>
                    <div className="flex-1">
                      <div className="font-bold text-lg mb-2">🤔 Thinking...</div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-black rounded-full animate-bounce"></div>
                        <div className="w-3 h-3 bg-black rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-3 h-3 bg-black rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="neo-brutalism-header p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about your codebase, documentation, or processes..."
              className="neo-brutalism-input flex-1 text-lg font-medium"
              disabled={isLoading}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="neo-brutalism-button"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
          <div className="text-white/80 text-sm mt-2 font-medium">
            💡 Press Enter to send, Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatInterface

