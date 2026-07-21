'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { MessageCircle, X, Send, RotateCcw, ChevronDown } from 'lucide-react'

export function ChatbotWidget() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  // Scroll to bottom on new messages
  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, open])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || isLoading) return
    sendMessage({ text: trimmed })
    setInput('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  function handleReset() {
    setMessages([])
    setInput('')
  }

  const hasMessages = messages.length > 0

  return (
    <>
      {/* Chat panel */}
      <div
        role="dialog"
        aria-label="ALI FLEET chat assistant"
        aria-hidden={!open}
        className={`fixed bottom-24 right-4 z-50 flex w-[calc(100vw-2rem)] max-w-[22rem] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl shadow-foreground/10 transition-all duration-300 sm:right-6 ${
          open
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-4 opacity-0'
        }`}
        style={{ maxHeight: 'min(540px, calc(100dvh - 7rem))' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-primary px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Status dot */}
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-accent" />
            </span>
            <div>
              <p className="text-sm font-semibold text-primary-foreground leading-none">ALI FLEET Assistant</p>
              <p className="mt-0.5 text-xs text-primary-foreground/60 leading-none">Always here to help</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {hasMessages && (
              <button
                type="button"
                onClick={handleReset}
                aria-label="Clear conversation"
                className="flex size-8 items-center justify-center rounded-full text-primary-foreground/60 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <RotateCcw className="size-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="flex size-8 items-center justify-center rounded-full text-primary-foreground/60 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <ChevronDown className="size-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-3">
          {!hasMessages && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/8">
                <MessageCircle className="size-7 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">How can we help?</p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Ask about our fleet, importing services, or spare parts.
                </p>
              </div>
              {/* Suggestion chips */}
              <div className="flex flex-wrap justify-center gap-2 mt-1">
                {[
                  'Available trucks',
                  'Import a vehicle',
                  'Spare parts',
                  'Fleet pricing',
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      sendMessage({ text: chip })
                    }}
                    className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground transition-colors hover:bg-accent hover:text-accent-foreground hover:border-accent"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => {
            const text = message.parts
              ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
              .map((p) => p.text)
              .join('') ?? ''

            const isUser = message.role === 'user'

            return (
              <div
                key={message.id}
                className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {!isUser && (
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    AF
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    isUser
                      ? 'rounded-tr-sm bg-primary text-primary-foreground'
                      : 'rounded-tl-sm bg-secondary text-foreground'
                  }`}
                >
                  {text}
                </div>
              </div>
            )
          })}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex gap-2">
              <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                AF
              </div>
              <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-secondary px-3.5 py-3">
                <span className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.3s]" />
                <span className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.15s]" />
                <span className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border bg-card p-3">
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              disabled={isLoading}
              aria-label="Chat input"
              className="flex-1 resize-none rounded-xl bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 max-h-24 leading-relaxed"
              style={{ minHeight: '2.5rem' }}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="size-4" />
            </button>
          </form>
          <p className="mt-2 text-center text-[10px] text-muted-foreground">
            Powered by ALI FLEET AI
          </p>
        </div>
      </div>

      {/* FAB toggle button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close chat assistant' : 'Open chat assistant'}
        aria-expanded={open}
        className="fixed bottom-5 right-4 z-50 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 transition-all duration-200 hover:scale-105 hover:bg-primary/90 active:scale-95 sm:right-6"
      >
        <span
          className={`absolute transition-all duration-200 ${open ? 'rotate-0 opacity-100 scale-100' : 'rotate-90 opacity-0 scale-75'}`}
          aria-hidden="true"
        >
          <X className="size-6" />
        </span>
        <span
          className={`absolute transition-all duration-200 ${open ? '-rotate-90 opacity-0 scale-75' : 'rotate-0 opacity-100 scale-100'}`}
          aria-hidden="true"
        >
          <MessageCircle className="size-6" />
        </span>
      </button>
    </>
  )
}
