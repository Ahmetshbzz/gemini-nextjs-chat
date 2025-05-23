// app/page.tsx
"use client";
import { useState, useCallback, useEffect } from 'react';
import CameraPreview from './components/CameraPreview';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Trash2, SmilePlus } from "lucide-react";
import { useMessageStore, Message } from './services/messageStore';

// Tutarlı zaman formatı için yardımcı fonksiyon
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

const HumanMessage = ({ message, onReaction }: { message: Message; onReaction: (emoji: string) => void }) => (
  <div className="flex gap-2 md:gap-3 items-start group">
    <Avatar className="h-6 w-6 md:h-8 md:w-8">
      <AvatarImage src="/avatars/human.png" alt="İnsan" />
      <AvatarFallback>H</AvatarFallback>
    </Avatar>
    <div className="flex-1 space-y-1 md:space-y-2">
      <div className="flex items-center gap-1 md:gap-2">
        <p className="text-xs md:text-sm font-medium text-zinc-900">Öğrenci</p>
        <span className="text-[10px] md:text-xs text-zinc-500">
          {formatTime(message.timestamp)}
        </span>
      </div>
      <div className="rounded-lg bg-zinc-100 px-2 py-1.5 md:px-3 md:py-2 text-xs md:text-sm text-zinc-800">
        {message.text}
      </div>
      {message.reactions && message.reactions.length > 0 && (
        <div className="flex gap-1 mt-1">
          {message.reactions.map((reaction, index) => (
            <span key={index} className="text-xs md:text-sm bg-white rounded-full px-1.5 py-0.5 md:px-2 border">
              {reaction}
            </span>
          ))}
        </div>
      )}
    </div>
    <Button
      variant="ghost"
      size="icon"
      className="md:opacity-0 md:group-hover:opacity-100 transition-opacity h-6 w-6 md:h-8 md:w-8"
      onClick={() => onReaction('👍')}
    >
      <SmilePlus className="h-3 w-3 md:h-4 md:w-4" />
    </Button>
  </div>
);

const GeminiMessage = ({ message, onReaction }: { message: Message; onReaction: (emoji: string) => void }) => (
  <div className="flex gap-2 md:gap-3 items-start group">
    <Avatar className="h-6 w-6 md:h-8 md:w-8 bg-blue-600">
      <AvatarImage src="/avatars/gemini.png" alt="Gemini" />
      <AvatarFallback>AI</AvatarFallback>
    </Avatar>
    <div className="flex-1 space-y-1 md:space-y-2">
      <div className="flex items-center gap-1 md:gap-2">
        <p className="text-xs md:text-sm font-medium text-zinc-900">Teacher Emma</p>
        <span className="text-[10px] md:text-xs text-zinc-500">
          {formatTime(message.timestamp)}
        </span>
      </div>
      <div className="rounded-lg bg-white border border-zinc-200 px-2 py-1.5 md:px-3 md:py-2 text-xs md:text-sm text-zinc-800">
        {message.text}
      </div>
      {message.reactions && message.reactions.length > 0 && (
        <div className="flex gap-1 mt-1">
          {message.reactions.map((reaction, index) => (
            <span key={index} className="text-xs md:text-sm bg-white rounded-full px-1.5 py-0.5 md:px-2 border">
              {reaction}
            </span>
          ))}
        </div>
      )}
    </div>
    <Button
      variant="ghost"
      size="icon"
      className="md:opacity-0 md:group-hover:opacity-100 transition-opacity h-6 w-6 md:h-8 md:w-8"
      onClick={() => onReaction('👍')}
    >
      <SmilePlus className="h-3 w-3 md:h-4 md:w-4" />
    </Button>
  </div>
);

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const { messages, addMessage, addReaction, clearMessages, searchMessages } = useMessageStore();
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (searchQuery) {
      setFilteredMessages(searchMessages(searchQuery));
    } else {
      setFilteredMessages(messages);
    }
  }, [searchQuery, messages, searchMessages]);

  const handleTranscription = useCallback((transcription: string) => {
    addMessage({ type: 'gemini', text: transcription });
  }, [addMessage]);

  const handleReaction = useCallback((messageId: string, emoji: string) => {
    addReaction(messageId, emoji);
  }, [addReaction]);

  return (
    <div className="flex flex-col min-h-screen">
      <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-zinc-800 p-3 pb-1 md:p-6 md:pb-3 text-center">
        Teacher Emma ile İngilizce
      </h1>
      <div className="flex flex-col md:flex-row w-full flex-1 md:gap-4 lg:gap-6">
        <div className="w-full px-1 md:px-2 md:w-7/12 lg:w-3/5 md:pl-6 flex-grow">
          <CameraPreview onTranscription={handleTranscription} />
        </div>

        <div className="w-full px-1 md:px-2 md:w-5/12 lg:w-2/5 md:pr-6 bg-white rounded-lg border border-zinc-200 flex flex-col mt-3 md:mt-0 mb-3 md:mb-6 h-[calc(100vh-120px)]">
          <div className="p-2 md:p-4 border-b border-zinc-200">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
                <Input
                  placeholder="Mesajlarda ara..."
                  className="pl-8 text-sm"
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={clearMessages}
                title="Mesajları temizle"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <ScrollArea className="flex-1 p-2 md:p-4">
            <div className="space-y-4">
              <GeminiMessage
                message={{
                  id: 'welcome',
                  type: 'gemini',
                  text: "Merhaba! Ben Emma, senin İngilizce öğretmeninim. Birlikte İngilizce öğrenmek için buradayım. Bana istediğin soruyu sorabilir veya İngilizce pratik yapmak istediğin konuları söyleyebilirsin.",
                  timestamp: Date.now(),
                  reactions: []
                }}
                onReaction={(emoji) => handleReaction('welcome', emoji)}
              />
              {filteredMessages.map((message) => (
                message.type === 'human' ? (
                  <HumanMessage
                    key={message.id}
                    message={message}
                    onReaction={(emoji) => handleReaction(message.id, emoji)}
                  />
                ) : (
                  <GeminiMessage
                    key={message.id}
                    message={message}
                    onReaction={(emoji) => handleReaction(message.id, emoji)}
                  />
                )
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
