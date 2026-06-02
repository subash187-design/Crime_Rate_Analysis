import { useState, useRef, useEffect } from "react";
import { useListConversations, useCreateConversation, useGetConversationMessages, useQueryAgent, getGetConversationMessagesQueryKey, getListConversationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, Plus, Send, Bot, User, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AgentPage() {
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [openaiError, setOpenaiError] = useState(false);

  const { data: conversations, isLoading: isListLoading } = useListConversations();
  const { data: messages, isLoading: isMessagesLoading } = useGetConversationMessages(activeId ?? 0, {
    query: { enabled: !!activeId, queryKey: getGetConversationMessagesQueryKey(activeId ?? 0) }
  });

  const createConversation = useCreateConversation();
  const queryAgent = useQueryAgent();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversations && conversations.length > 0 && !activeId) {
      setActiveId(conversations[0].id);
    }
  }, [conversations, activeId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, queryAgent.isPending]);

  const handleNewConversation = () => {
    createConversation.mutate({ data: { title: "New Analysis" } }, {
      onSuccess: (newConv) => {
        queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
        setActiveId(newConv.id);
      }
    });
  };

  const handleSend = () => {
    if (!input.trim() || !activeId) return;

    const question = input.trim();
    setInput("");
    setOpenaiError(false);

    // Optimistically update the UI if we wanted to, but relying on invalidate is fine
    queryAgent.mutate({ data: { question, conversationId: activeId } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetConversationMessagesQueryKey(activeId) });
      },
      onError: (err: any) => {
        if (err?.message?.includes("API key") || err?.status === 401 || err?.status === 500) {
          setOpenaiError(true);
        }
      }
    });
  };

  return (
    <div className="flex h-full p-8 gap-6">
      <div className="w-80 flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">AI Analyst</h2>
          <p className="text-muted-foreground mt-1 text-sm">Query the database naturally.</p>
        </div>
        
        <Button onClick={handleNewConversation} disabled={createConversation.isPending} className="w-full justify-start" variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          New Conversation
        </Button>

        <Card className="flex-1 min-h-0 overflow-hidden flex flex-col bg-muted/20">
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {isListLoading ? (
                <div className="p-4 text-sm text-center text-muted-foreground">Loading...</div>
              ) : conversations?.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setActiveId(conv.id)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                    activeId === conv.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <div className="truncate">{conv.title}</div>
                  <div className="text-[10px] opacity-70 mt-1">{new Date(conv.createdAt).toLocaleDateString()}</div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </Card>
      </div>

      <div className="flex-1 flex flex-col gap-4 h-full min-h-0">
        {openaiError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Configuration Error</AlertTitle>
            <AlertDescription>
              AI agent requires an OpenAI API key — contact your administrator.
            </AlertDescription>
          </Alert>
        )}

        <Card className="flex-1 min-h-0 flex flex-col relative bg-card">
          <ScrollArea className="flex-1 p-4">
            {isMessagesLoading ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Loading messages...
              </div>
            ) : !messages || messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4">
                <Bot className="w-12 h-12 opacity-20" />
                <p>Start a new analysis by typing a question below.</p>
              </div>
            ) : (
              <div className="space-y-6 pb-4">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div className={`px-4 py-3 rounded-lg max-w-[80%] text-sm ${
                      msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted border border-border'
                    }`}>
                      {msg.content}
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-secondary-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                {queryAgent.isPending && (
                  <div className="flex gap-4 justify-start">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="px-4 py-3 rounded-lg bg-muted border border-border flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Analyzing data...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>
          
          <div className="p-4 border-t border-border bg-card">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex items-center gap-2"
            >
              <Input 
                value={input} 
                onChange={e => setInput(e.target.value)} 
                placeholder="Ask about crime trends, hotspots, or specific incidents..."
                className="flex-1 bg-muted/50 border-border"
                disabled={queryAgent.isPending || !activeId}
              />
              <Button type="submit" disabled={!input.trim() || queryAgent.isPending || !activeId}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
