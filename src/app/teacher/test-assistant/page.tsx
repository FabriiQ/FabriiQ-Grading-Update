'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/core/button';
import { Input } from '@/components/ui/core/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/core/card';
import { api } from '@/trpc/react';
import { Loader2, MessageSquare, Send } from 'lucide-react';

/**
 * Test page for Teacher Assistant functionality
 * This page allows testing the AI assistant without the full UI
 */
export default function TestAssistantPage() {
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>>([]);

  const assistantMutation = api.teacherAssistant.getAssistantResponse.useMutation({
    onSuccess: (data) => {
      setConversation(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }]);
    },
    onError: (error) => {
      setConversation(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${error.message}`,
        timestamp: new Date()
      }]);
    }
  });

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    // Add user message to conversation
    setConversation(prev => [...prev, {
      role: 'user',
      content: message,
      timestamp: new Date()
    }]);

    // Send to AI assistant
    assistantMutation.mutate({
      message: message.trim(),
      context: JSON.stringify({
        currentPage: { path: '/teacher/test-assistant', title: 'Test Assistant' },
        teacher: { name: 'Test Teacher', subjects: [{ id: '1', name: 'Mathematics' }] }
      })
    });

    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const testQuestions = [
    "Help me create a lesson plan for algebra",
    "How can I improve student engagement?",
    "Suggest assessment strategies for mathematics",
    "What are some classroom management techniques?",
    "Help me with differentiated instruction"
  ];

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Teacher Assistant Test</h1>
        <p className="text-muted-foreground">
          Test the AI Teaching Assistant functionality. Try asking questions about lesson planning, 
          student management, assessments, or teaching strategies.
        </p>
      </div>

      {/* Quick Test Questions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Quick Test Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {testQuestions.map((question, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => setMessage(question)}
                className="text-left justify-start h-auto py-2 px-3"
              >
                {question}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Conversation */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Conversation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {conversation.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No conversation yet. Send a message to start!
              </p>
            ) : (
              conversation.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="text-sm font-medium mb-1">
                      {msg.role === 'user' ? 'You' : 'AI Assistant'}
                    </div>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    <div className="text-xs opacity-70 mt-1">
                      {msg.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
            {assistantMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>AI Assistant is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Message Input */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask the AI assistant anything about teaching..."
              disabled={assistantMutation.isPending}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || assistantMutation.isPending}
              size="icon"
            >
              {assistantMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </CardContent>
      </Card>

      {/* Status */}
      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Status: {assistantMutation.isPending ? 'Processing...' : 'Ready'}
        </p>
      </div>
    </div>
  );
}
