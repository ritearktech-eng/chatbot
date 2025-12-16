import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, Loader2, Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { API_URL } from "../config";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export function EmbedChat() {
    const { companyId } = useParams<{ companyId: string }>();
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "Loading..." }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Lead Collection State
    const [leadStep, setLeadStep] = useState<"INIT" | "ASK_NAME" | "ASK_EMAIL" | "ASK_PHONE" | "COMPLETED">("INIT");
    const [leadData, setLeadData] = useState({ name: "", email: "", phone: "" });

    // Voice Recording
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Initial greeting
    useEffect(() => {
        if (!companyId) {
            setMessages([{ role: "assistant", content: "Invalid configuration: No Company ID." }]);
            return;
        }

        // Check if lead exists in session
        const hasLead = sessionStorage.getItem(`lead_captured_${companyId}`);

        if (hasLead) {
            setLeadStep("COMPLETED");
            setMessages([{ role: "assistant", content: "Hello! How can I help you today?" }]);
        } else {
            setLeadStep("ASK_NAME");
            setMessages([
                { role: "assistant", content: "Hello! Before we start, could I please get your name?" }
            ]);
        }
    }, [companyId]);

    const handleSend = async (inputType: "text" | "voice" = "text", audioData?: string) => {
        if (inputType === "text" && !input.trim()) return;
        if (!companyId) return;

        let userContent = input;
        if (inputType === "voice") {
            userContent = "🎤 Audio Message";
        }

        const userMessage: Message = { role: "user", content: userContent };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        // --- Lead Collection Flow ---
        if (leadStep !== "COMPLETED") {
            setTimeout(async () => {
                let nextMessage = "";
                // Explicitly define the type to include "COMPLETED"
                let nextStep: "INIT" | "ASK_NAME" | "ASK_EMAIL" | "ASK_PHONE" | "COMPLETED" = leadStep;

                if (leadStep === "ASK_NAME") {
                    setLeadData(prev => ({ ...prev, name: userContent }));
                    nextMessage = "Nice to meet you! What is your email address?";
                    nextStep = "ASK_EMAIL";
                } else if (leadStep === "ASK_EMAIL") {
                    setLeadData(prev => ({ ...prev, email: userContent }));
                    nextMessage = "Thanks! Lastly, what is your phone number?";
                    nextStep = "ASK_PHONE";
                } else if (leadStep === "ASK_PHONE") {
                    const finalData = { ...leadData, phone: userContent };
                    setLeadData(finalData);

                    // Submit to Backend (Public Endpoint)
                    try {
                        await fetch(`${API_URL}/company/lead`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ companyId, ...finalData })
                        });
                        nextMessage = "Thank you! I've saved your details. How can I help you today?";
                        nextStep = "COMPLETED";
                        sessionStorage.setItem(`lead_captured_${companyId}`, "true");
                    } catch (e) {
                        console.error("Failed to save lead", e);
                        nextMessage = "Thanks. How can I help you today?";
                        nextStep = "COMPLETED";
                    }
                }

                setMessages(prev => [...prev, { role: "assistant", content: nextMessage }]);
                setLeadStep(nextStep);
                setIsLoading(false);
            }, 600);
            return;
        }

        try {
            const payload: any = {
                query: inputType === "text" ? input : "",
                history: messages
                    .filter(m => m.content !== "Loading...")
                    .map(m => ({ role: m.role, content: m.content })),
                inputType: inputType
            };

            if (inputType === "voice" && audioData) {
                payload.inputAudio = audioData;
            }

            // Note: Use public endpoint. Auth header is NOT sent because embedded users aren't logged in.
            // Ensure backend /chat/:companyId handles no-auth.
            const response = await fetch(`${API_URL}/chat/${companyId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error("API Request failed");

            const data = await response.json();
            const botContent = data.answer || data.response || (typeof data === 'string' ? data : JSON.stringify(data));

            const botMessage: Message = {
                role: "assistant",
                content: botContent
            };
            setMessages((prev) => [...prev, botMessage]);

            if (data.audio) {
                try {
                    const audioSrc = `data:audio/mp3;base64,${data.audio}`;
                    const audio = new Audio(audioSrc);
                    audio.play();
                } catch (audioErr) {
                    console.error("Error playing audio:", audioErr);
                }
            }

        } catch (error) {
            console.error("Chat error:", error);
            setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I'm having trouble connecting right now." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = () => {
                    const base64String = (reader.result as string).split(",")[1];
                    handleSend("voice", base64String);
                };
            };
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend("text");
        }
    };

    return (
        <div className="flex flex-col h-screen bg-background">
            <div className="flex-1 overflow-y-auto space-y-4 p-4">
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={cn(
                            "flex w-full items-start gap-2",
                            msg.role === "user" ? "flex-row-reverse" : "flex-row"
                        )}
                    >
                        <div
                            className={cn(
                                "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border shadow",
                                msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                            )}
                        >
                            {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </div>
                        <div
                            className={cn(
                                "rounded-lg px-3 py-2 text-sm shadow-sm max-w-[85%]",
                                msg.role === "user"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground"
                            )}
                        >
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex w-full items-start gap-2">
                        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border shadow bg-muted">
                            <Bot className="h-4 w-4" />
                        </div>
                        <div className="rounded-lg px-3 py-2 text-sm bg-muted text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t bg-card">
                <div className="flex items-center gap-2">
                    <Button
                        variant={isRecording ? "destructive" : "secondary"}
                        size="icon"
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isLoading}
                        className={cn("shrink-0", isRecording && "animate-pulse")}
                    >
                        {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                    <Input
                        placeholder="Type a message..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading || isRecording}
                        className="flex-1"
                    />
                    <Button onClick={() => handleSend("text")} size="icon" disabled={isLoading || !input.trim() || isRecording}>
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
