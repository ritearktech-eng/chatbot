import { useState, useRef, useEffect } from "react";
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, Loader2, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { API_URL } from "../config";

const SUPPORT_BOT_ID = "d48f88e7-4fdb-4462-94d4-356a31a0a260";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export function SupportChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "Hello! I'm Prime Support. How can I help you manage your platform today?" }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage: Message = { role: "user", content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const payload = {
                query: input,
                history: messages.map(m => ({ role: m.role, content: m.content })),
                inputType: "text"
            };

            const response = await fetch(`${API_URL}/chat/${SUPPORT_BOT_ID}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error("API Request failed");

            const data = await response.json();
            const botContent = data.answer || data.response || (typeof data === 'string' ? data : JSON.stringify(data));

            setMessages((prev) => [...prev, { role: "assistant", content: botContent }]);
        } catch (error) {
            console.error("Chat error:", error);
            setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I'm having trouble connecting to support right now." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    useEffect(() => {
        console.log("SupportChatWidget Mounted");
    }, []);

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4 pointer-events-auto">
            {/* Chat Window */}
            {isOpen && (
                <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-[350px] h-[500px] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-200">
                    {/* Header */}
                    <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
                        <div className="flex items-center gap-2 font-semibold">
                            <Bot className="w-5 h-5" /> Riteark Support
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-indigo-700" onClick={() => setIsOpen(false)}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={cn("flex w-full items-start gap-2", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                                <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-700", msg.role === "user" ? "bg-indigo-600" : "bg-slate-800")}>
                                    {msg.role === "user" ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-indigo-400" />}
                                </div>
                                <div className={cn("rounded-lg px-3 py-2 text-sm max-w-[85%]", msg.role === "user" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-200")}>
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex w-full items-start gap-2">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-800">
                                    <Bot className="h-4 w-4 text-indigo-400" />
                                </div>
                                <div className="rounded-lg px-3 py-2 text-sm bg-slate-800 text-slate-200">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 bg-slate-900 border-t border-slate-700 flex gap-2">
                        <Input
                            placeholder="Ask for help..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                        />
                        <Button size="icon" onClick={handleSend} disabled={isLoading || !input.trim()} className="bg-indigo-600 hover:bg-indigo-700">
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <Button
                onClick={() => setIsOpen(!isOpen)}
                className="rounded-full w-14 h-14 bg-indigo-600 hover:bg-indigo-700 shadow-lg text-white"
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
            </Button>
        </div>
    );
}
