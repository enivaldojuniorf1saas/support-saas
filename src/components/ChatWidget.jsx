import { useState, useRef, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase' // 🚀 Importação do Supabase
import { 
  ChatBubbleLeftEllipsisIcon, 
  XMarkIcon, 
  PaperAirplaneIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

export function ChatWidget() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const [messages, setMessages] = useState([
    { id: 1, text: 'Olá! Sou o assistente virtual da plataforma. Como posso ajudar você hoje?', sender: 'bot' }
  ])

  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isOpen, isLoading])

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault()
    if (!inputValue.trim()) return

    const userText = inputValue.trim()
    const newUserMsg = { id: Date.now(), text: userText, sender: 'user' }
    
    setMessages((prev) => [...prev, newUserMsg])
    setInputValue('')
    setIsLoading(true)

    try {
      // 🚀 A MÁGICA ACONTECE AQUI: Chama a Edge Function que você acabou de publicar!
      const { data, error } = await supabase.functions.invoke('chat-assistant', {
        body: { message: userText }
      })

      if (error) throw error

      const botResponse = { 
        id: Date.now() + 1, 
        text: data.response, 
        sender: 'bot' 
      }
      setMessages((prev) => [...prev, botResponse])

    } catch (err) {
      console.error("Erro ao chamar o assistente:", err)
      const errorMsg = { 
        id: Date.now() + 1, 
        text: 'Desculpe, estou com um pequeno problema técnico para acessar o manual agora. Tente novamente em alguns segundos.', 
        sender: 'bot' 
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
      
      {isOpen && (
        <div className={`mb-4 w-[90vw] sm:w-96 h-[500px] max-h-[80vh] flex flex-col rounded-2xl shadow-2xl border overflow-hidden transition-all duration-300 animate-fade-in ${
          isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          
          <div className="bg-blue-600 px-4 py-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-blue-100" />
              <div>
                <h3 className="text-white text-sm font-bold">Assistente Inteligente</h3>
                <p className="text-blue-200 text-[10px] uppercase tracking-wider">Atendimento Rápido</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-blue-100 hover:text-white hover:bg-blue-700 p-1 rounded-lg transition cursor-pointer"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${isDark ? 'bg-[#0b0f19]' : 'bg-gray-50'}`}>
            {messages.map((msg) => (
              <div key={msg.id} className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                  msg.sender === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-sm' 
                    : isDark ? 'bg-gray-800 text-gray-200 border border-gray-700 rounded-tl-sm' : 'bg-white text-gray-700 border border-gray-200 rounded-tl-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {/* Indicador de carregamento enquanto a IA pensa */}
            {isLoading && (
              <div className="flex w-full justify-start">
                <div className={`rounded-2xl px-4 py-3 shadow-sm flex gap-1 items-center ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className={`p-3 border-t ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
            <form onSubmit={handleSendMessage} className="relative flex items-center">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
                placeholder="Escreva sua dúvida aqui..."
                className={`w-full pl-4 pr-12 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  isDark 
                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 disabled:opacity-50' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 border disabled:opacity-50'
                }`}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="absolute right-2 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors cursor-pointer"
              >
                <PaperAirplaneIcon className="w-4 h-4" />
              </button>
            </form>
          </div>
          
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-4 rounded-full shadow-2xl transition-transform hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer ${
          isOpen ? 'bg-gray-700 text-white hover:bg-gray-800' : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isOpen ? <XMarkIcon className="w-6 h-6" /> : <ChatBubbleLeftEllipsisIcon className="w-6 h-6" />}
      </button>

    </div>
  )
}