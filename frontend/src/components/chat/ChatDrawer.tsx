"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

let socket: Socket;

export function ChatDrawer() {
  const user = useAuthStore((state) => state.user);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    // Initialize socket connection
    socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000");

    // Join a generic company room, or specific department room
    const room = user.department || "General";
    socket.emit("join_room", room);

    socket.on("receive_message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  useEffect(() => {
    // Scroll to bottom on new message
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !user) return;

    const room = user.department || "General";
    const msgData = {
      room,
      message: messageInput,
      senderName: user.name,
      senderRole: user.role,
      timestamp: new Date().toISOString(),
    };

    socket.emit("send_message", msgData);
    setMessageInput("");
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Action Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl z-40 bg-primary hover:bg-primary/90 transition-transform hover:scale-105"
        size="icon"
      >
        <MessageCircle className="h-6 w-6 text-primary-foreground" />
      </Button>

      {/* Drawer Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 z-50 sm:hidden"
            />
            
            {/* Drawer Content */}
            <motion.div
              initial={{ x: "100%", opacity: 0.5 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0.5 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-screen w-full sm:w-[400px] bg-card border-l border-border shadow-2xl z-50 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/30">
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    Team Chat
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Room: {user.department || "General"}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full">
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3 opacity-60">
                    <MessageCircle className="h-12 w-12" />
                    <p className="text-sm">No messages yet. Say hello!</p>
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const isMe = msg.senderName === user.name;
                    return (
                      <div
                        key={i}
                        className={cn("flex flex-col max-w-[85%]", isMe ? "ml-auto items-end" : "mr-auto items-start")}
                      >
                        <div className="flex items-center gap-1.5 mb-1 mx-1">
                          <span className="text-[10px] font-medium text-foreground/80">{msg.senderName}</span>
                          <span className="text-[9px] text-muted-foreground border px-1 rounded bg-muted/50">
                            {msg.senderRole}
                          </span>
                        </div>
                        <div
                          className={cn(
                            "px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words",
                            isMe 
                              ? "bg-primary text-primary-foreground rounded-tr-sm" 
                              : "bg-muted text-foreground rounded-tl-sm border"
                          )}
                        >
                          {msg.message}
                        </div>
                        <span className="text-[9px] text-muted-foreground mt-1 mx-1">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-border/50 bg-muted/10">
                <form onSubmit={sendMessage} className="flex items-center gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="flex-1 rounded-full bg-background"
                  />
                  <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={!messageInput.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
