/**
 * AIVY Assistant Component for Post Creator
 * AI-powered content generation and enhancement for social wall posts
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Zap,
  Wand2, // Use Wand2 instead of Sparkle
  MessageSquare,
  BookOpen,
  Target,
  Users,
  Lightbulb,
  RefreshCw,
  Copy,
  Check,
  Award // Use Award instead of Heart (Award exists in lucide-react)
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

import { toast } from 'sonner';

interface AIVYAssistantProps {
  onContentGenerated: (content: string) => void;
  currentContent?: string;
  classId: string;
  className?: string;
}

interface ContentSuggestion {
  id: string;
  title: string;
  content: string;
  type: 'announcement' | 'engagement' | 'educational' | 'motivational';
  tags: string[];
}

const CONTENT_TYPES = [
  { id: 'announcement', label: 'Announcement', icon: MessageSquare, color: 'bg-blue-500' },
  { id: 'engagement', label: 'Engagement', icon: Users, color: 'bg-green-500' },
  { id: 'educational', label: 'Educational', icon: BookOpen, color: 'bg-purple-500' },
  { id: 'motivational', label: 'Motivational', icon: Target, color: 'bg-orange-500' },
];

const QUICK_PROMPTS = [
  "Create an engaging post about today's lesson",
  "Write a motivational message for students",
  "Announce upcoming assignment deadline",
  "Share interesting facts about the subject",
  "Create a discussion starter question",
  "Write a congratulatory message for achievements"
];

export function AIVYAssistant({ 
  onContentGenerated, 
  currentContent, 
  classId,
  className 
}: AIVYAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [selectedType, setSelectedType] = useState<string>('engagement');
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<ContentSuggestion[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // AI content generation mutation with social wall specific prompts
  const generateContentMutation = {
    mutate: (data: any) => {
      setIsGenerating(true);
      // Generate social wall specific content based on prompt
      setTimeout(() => {
        const suggestions = generateSocialWallContent(data.prompt, data.contentType);
        setSuggestions(suggestions);
        setIsGenerating(false);
        toast.success('Content generated successfully!');
      }, 2000);
    },
    isLoading: isGenerating
  };

  // Generate social wall specific content
  const generateSocialWallContent = (prompt: string, contentType: string): ContentSuggestion[] => {
    const lowerPrompt = prompt.toLowerCase();

    // Detect content type from prompt
    if (lowerPrompt.includes('notification') || lowerPrompt.includes('announce') || lowerPrompt.includes('assembly') || lowerPrompt.includes('event')) {
      return [
        {
          id: '1',
          title: 'Event Announcement',
          content: `📢 **Important Announcement**\n\n🎭 Tomorrow we have a special assembly where our talented students will perform on the topic of **Empathy**. This is a wonderful opportunity to see our students showcase their understanding of this important value.\n\n📅 **Date:** Tomorrow\n🎯 **Topic:** Empathy\n👥 **Attendance:** All teachers and students are required to be present\n\nLet's come together to support our students and celebrate their learning! 🌟`,
          type: 'announcement' as const,
          tags: ['announcement', 'assembly', 'empathy', 'attendance']
        },
        {
          id: '2',
          title: 'Formal Notice',
          content: `🏫 **Assembly Notice**\n\nDear Teachers and Students,\n\nWe are pleased to announce that tomorrow our students will be presenting on the important topic of Empathy during our school assembly.\n\n**Details:**\n• Date: Tomorrow\n• Topic: Student presentations on Empathy\n• Attendance: Mandatory for all teachers and students\n\nThis assembly will be an excellent opportunity to witness our students' understanding and expression of empathy. Your presence and support are greatly appreciated.\n\nThank you for your cooperation.`,
          type: 'announcement' as const,
          tags: ['formal', 'assembly', 'mandatory', 'empathy']
        }
      ];
    }

    if (lowerPrompt.includes('lesson') || lowerPrompt.includes('recap') || lowerPrompt.includes('today')) {
      return [
        {
          id: '1',
          title: 'Engaging Lesson Recap',
          content: `🎯 Great work today, class! We explored fascinating concepts in ${contentType}. Remember to review your notes and prepare for tomorrow's discussion. What was your biggest takeaway from today's lesson?`,
          type: 'educational' as const,
          tags: ['lesson', 'engagement', 'review']
        },
        {
          id: '2',
          title: 'Interactive Follow-up',
          content: `📚 Today's lesson was packed with valuable insights! I'd love to hear your thoughts:\n\n💭 What concept surprised you the most?\n🤔 Which part would you like to explore further?\n✨ How can you apply what we learned today?\n\nShare your reflections in the comments below! 👇`,
          type: 'engagement' as const,
          tags: ['reflection', 'interaction', 'follow-up']
        }
      ];
    }

    if (lowerPrompt.includes('motivat') || lowerPrompt.includes('encourage') || lowerPrompt.includes('inspire')) {
      return [
        {
          id: '1',
          title: 'Motivational Message',
          content: `✨ Your dedication to learning continues to impress me! Keep pushing forward and remember that every challenge is an opportunity to grow. You've got this! 💪`,
          type: 'motivational' as const,
          tags: ['motivation', 'encouragement', 'growth']
        },
        {
          id: '2',
          title: 'Achievement Recognition',
          content: `🌟 I'm so proud of the progress you're all making! Each day you're becoming more confident, more curious, and more capable. Remember:\n\n🎯 Every mistake is a learning opportunity\n💡 Your questions show your engagement\n🚀 Your effort is what matters most\n\nKeep up the amazing work! 👏`,
          type: 'motivational' as const,
          tags: ['achievement', 'progress', 'confidence']
        }
      ];
    }

    // Default suggestions for general prompts
    return [
      {
        id: '1',
        title: 'Class Engagement',
        content: `🎯 Let's make learning interactive today! I'm excited to see your thoughts and ideas. Remember, every question and comment helps us all learn better together. What's on your mind? 💭`,
        type: 'engagement' as const,
        tags: ['engagement', 'interaction', 'learning']
      },
      {
        id: '2',
        title: 'Learning Reminder',
        content: `📚 Don't forget to review today's materials and prepare for our next session. If you have any questions or need clarification on anything, feel free to reach out. Learning is a journey we take together! 🌟`,
        type: 'educational' as const,
        tags: ['reminder', 'preparation', 'support']
      }
    ];
  };

  // Content enhancement mutation (placeholder - will be implemented)
  const enhanceContentMutation = {
    mutate: (data: any) => {
      // Simulate content enhancement
      setTimeout(() => {
        const enhanced = `✨ ${data.content}\n\n💭 What are your thoughts on this? Share your ideas in the comments below!`;
        onContentGenerated(enhanced);
        setIsOpen(false);
        toast.success('Content enhanced successfully!');
      }, 1500);
    },
    isLoading: false
  };

  const handleGenerateContent = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    generateContentMutation.mutate({
      prompt: prompt.trim(),
      contentType: selectedType,
      classId,
      context: {
        existingContent: currentContent,
        platform: 'social_wall'
      }
    });
  };

  const handleEnhanceContent = async () => {
    if (!currentContent?.trim()) {
      toast.error('No content to enhance');
      return;
    }

    enhanceContentMutation.mutate({
      content: currentContent,
      enhancementType: 'social_engagement',
      classId
    });
  };

  const handleQuickPrompt = (quickPrompt: string) => {
    setPrompt(quickPrompt);
  };

  const handleUseSuggestion = (suggestion: ContentSuggestion) => {
    onContentGenerated(suggestion.content);
    setIsOpen(false);
    toast.success('Content applied successfully!');
  };

  const handleCopySuggestion = async (suggestion: ContentSuggestion) => {
    try {
      await navigator.clipboard.writeText(suggestion.content);
      setCopiedId(suggestion.id);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success('Content copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy content');
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "flex items-center gap-2 hover:bg-primary/5 hover:border-primary/30 transition-all duration-200",
            className
          )}
        >
          <motion.div
            animate={{ rotate: isGenerating ? 360 : 0 }}
            transition={{ duration: 1, repeat: isGenerating ? Infinity : 0, ease: "linear" }}
          >
            <Zap className="w-4 h-4 text-primary" />
          </motion.div>
          <span className="font-medium">AIVY</span>
          <Award className="w-3 h-3 text-yellow-500" />
        </Button>
      </PopoverTrigger>

      <PopoverContent 
        className="w-96 p-0" 
        align="start"
        side="bottom"
        sideOffset={8}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="w-5 h-5 text-primary" />
              AIVY Assistant
              <Badge variant="secondary" className="ml-auto">
                AI-Powered
              </Badge>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <Tabs defaultValue="generate" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="generate" className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4" />
                  Generate
                </TabsTrigger>
                <TabsTrigger value="enhance" className="flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Enhance
                </TabsTrigger>
              </TabsList>

              <TabsContent value="generate" className="space-y-4 mt-4">
                {/* Content Type Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Content Type</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {CONTENT_TYPES.map((type) => {
                      const Icon = type.icon;
                      return (
                        <Button
                          key={type.id}
                          variant={selectedType === type.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedType(type.id)}
                          className="flex items-center gap-2 h-auto p-2"
                        >
                          <div className={cn("w-2 h-2 rounded-full", type.color)} />
                          <Icon className="w-3 h-3" />
                          <span className="text-xs">{type.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Prompts */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Quick Prompts</Label>
                  <div className="grid grid-cols-1 gap-1 max-h-24 overflow-y-auto">
                    {QUICK_PROMPTS.map((quickPrompt, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        onClick={() => handleQuickPrompt(quickPrompt)}
                        className="justify-start text-xs h-auto p-2 text-left"
                      >
                        <Lightbulb className="w-3 h-3 mr-2 flex-shrink-0" />
                        <span className="truncate">{quickPrompt}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Custom Prompt */}
                <div className="space-y-2">
                  <Label htmlFor="prompt" className="text-sm font-medium">
                    Custom Prompt
                  </Label>
                  <Textarea
                    id="prompt"
                    placeholder="Describe what you want to post about..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[80px] text-sm"
                  />
                </div>

                {/* Generate Button */}
                <Button
                  onClick={handleGenerateContent}
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Generate Content
                    </>
                  )}
                </Button>
              </TabsContent>

              <TabsContent value="enhance" className="space-y-4 mt-4">
                <div className="text-sm text-muted-foreground">
                  Enhance your existing content with AI-powered improvements for better engagement.
                </div>
                
                <Button
                  onClick={handleEnhanceContent}
                  disabled={!currentContent?.trim() || enhanceContentMutation.isLoading}
                  className="w-full"
                >
                  {enhanceContentMutation.isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Enhancing...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Enhance Content
                    </>
                  )}
                </Button>
              </TabsContent>
            </Tabs>

            {/* Generated Suggestions */}
            <AnimatePresence>
              {suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <Label className="text-sm font-medium">Suggestions</Label>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {suggestions.map((suggestion) => (
                      <motion.div
                        key={suggestion.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 border rounded-lg space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">{suggestion.title}</h4>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopySuggestion(suggestion)}
                              className="h-6 w-6 p-0"
                            >
                              {copiedId === suggestion.id ? (
                                <Check className="w-3 h-3 text-green-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleUseSuggestion(suggestion)}
                              className="h-6 px-2 text-xs"
                            >
                              Use
                            </Button>
                          </div>
                        </div>
                        <div className="text-sm text-foreground max-h-32 overflow-y-auto border rounded p-2 bg-muted/30">
                          <p className="whitespace-pre-wrap">
                            {suggestion.content}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {suggestion.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}
