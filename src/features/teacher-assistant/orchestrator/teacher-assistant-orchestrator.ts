import { v4 as uuidv4 } from 'uuid';
import {
  Message,
  TeacherContext,
  SearchFilters,
  SearchResult,
  IntentCategory
} from '../types';
import { INTENT_KEYWORDS } from '../constants';
import { AIVYPrompts, validateTokenBudget } from '@/lib/aivy-system-prompt';

interface ProcessMessageOptions {
  messages: Message[];
  context: TeacherContext;
}

/**
 * Teacher Assistant Orchestrator
 *
 * Responsible for:
 * - Classifying message intents
 * - Routing to appropriate responses
 * - Managing context and memory
 * - Handling search functionality
 */
export class TeacherAssistantOrchestrator {
  constructor() {
    // Initialize orchestrator
  }

  /**
   * Process a message and generate a response
   */
  async processMessage(content: string, options: ProcessMessageOptions): Promise<string> {
    try {
      // Classify intent
      const intent = this.classifyIntent(content);

      // For now, use local processing with intelligent responses
      console.log('Processing message with local orchestrator:', { intent });

      return this.processGeneralConversation(content, options);
    } catch (error) {
      console.error('Error in TeacherAssistantOrchestrator:', error);
      throw new Error('Failed to process message');
    }
  }

  /**
   * Classify the intent of a message
   *
   * Public method to allow analytics tracking
   */
  classifyIntent(content: string): IntentCategory {
    const normalizedContent = content.toLowerCase();

    // Check each intent category
    for (const [category, keywords] of Object.entries(INTENT_KEYWORDS)) {
      for (const keyword of keywords) {
        if (normalizedContent.includes(keyword.toLowerCase())) {
          return category as IntentCategory;
        }
      }
    }

    // Default to general conversation
    return IntentCategory.GENERAL;
  }



  /**
   * Process general conversation
   */
  private async processGeneralConversation(content: string, options: ProcessMessageOptions): Promise<string> {
    // Generate AIVY system prompt with educational context
    const educationalContext = {
      gradeLevel: options.context.currentClass?.gradeLevel || 'K-12',
      subject: typeof options.context.currentClass?.subject === 'string'
        ? options.context.currentClass.subject
        : options.context.currentClass?.subject?.name || options.context.teacher?.subjects?.[0]?.name,
      topic: options.context.currentClass?.name || 'General Teaching Support',
      learningObjectives: undefined, // Teacher context doesn't have current activity
      assessmentMode: false // Teacher assistant doesn't provide assessment answers
    };

    const tokenBudget = 1200; // Higher budget for teacher assistant
    const aivySystemPrompt = AIVYPrompts.teacherAssistant(educationalContext, tokenBudget);

    // Validate token budget
    const budgetValidation = validateTokenBudget({
      agentType: 'teacher-assistant',
      userRole: 'teacher',
      educationalContext,
      tokenBudget
    });

    // Log AIVY context for debugging (remove in production)
    console.log('AIVY Teacher Assistant Context:', {
      educationalContext,
      tokenBudget: budgetValidation,
      systemPromptLength: aivySystemPrompt.length
    });

    // Classify intent and route to appropriate response
    const intent = this.classifyIntent(content);

    // In a real implementation, this would call an AI service with the AIVY system prompt
    // For now, provide enhanced responses based on AIVY principles
    switch (intent) {
      case IntentCategory.LESSON_PLANNING:
        return this.generateLessonPlanningResponse(content, options, aivySystemPrompt);
      case IntentCategory.ASSESSMENT:
        return this.generateAssessmentResponse(content, options, aivySystemPrompt);
      case IntentCategory.CONTENT_CREATION:
        return this.generateContentCreationResponse(content, options, aivySystemPrompt);
      case IntentCategory.STUDENT_MANAGEMENT:
        return this.generateStudentManagementResponse(content, options, aivySystemPrompt);
      case IntentCategory.TEACHING_STRATEGY:
        return this.generateTeachingStrategyResponse(content, options, aivySystemPrompt);
      case IntentCategory.ADMINISTRATIVE:
        return this.generateAdministrativeResponse(content, options, aivySystemPrompt);
      case IntentCategory.CONTENT_REFINEMENT:
        return this.generateContentRefinementResponse(content, options, aivySystemPrompt);
      default:
        return this.generateGeneralResponse(content, options, aivySystemPrompt);
    }
  }

  private generateLessonPlanningResponse(content: string, options: ProcessMessageOptions, aivySystemPrompt?: string): string {
    const teacherName = options.context.teacher?.name || 'there';
    const subjects = options.context.teacher?.subjects?.map(s => s.name).join(', ') || 'your subjects';

    // Enhanced response following AIVY principles for teacher assistance
    return `Hi ${teacherName}! I'd be happy to help you with lesson planning for ${subjects}. As your AIVY teaching assistant, I can provide evidence-based support while respecting your professional expertise.

## How I Can Support Your Lesson Planning:

• **📋 Structured Lesson Plans** - Create standards-aligned plans with clear learning objectives using Bloom's Taxonomy
• **🎯 Engaging Activities** - Suggest research-backed activities that match your teaching style and student needs
• **📊 Assessment Integration** - Develop formative and summative assessments that measure understanding effectively
• **📚 Resource Curation** - Recommend high-quality materials and digital tools to enhance your lessons
• **🔄 Differentiation Strategies** - Help accommodate diverse learning needs using UDL principles
• **🔗 Cross-Curricular Connections** - Identify opportunities to integrate subjects meaningfully

## Next Steps:
What specific aspect would you like to explore? You could ask me to:
- "Help create a lesson plan for [specific topic]"
- "Suggest activities for teaching [concept] to [grade level]"
- "Design an assessment for [learning objective]"
- "Recommend differentiation strategies for [student needs]"

*I'm here to enhance your teaching effectiveness while honoring your professional judgment and classroom expertise.*`;
  }

  private generateAssessmentResponse(content: string, options: ProcessMessageOptions, aivySystemPrompt?: string): string {
    // Enhanced assessment response following AIVY principles
    return `I can help you create effective, standards-aligned assessments! As your AIVY assistant, I focus on evidence-based assessment practices that promote authentic learning.

## Assessment Support I Can Provide:

• **📊 Rubric Development** - Create detailed, criterion-referenced rubrics aligned with learning outcomes
• **❓ Question Design** - Develop questions across Bloom's Taxonomy levels (remembering to creating)
• **⚡ Efficiency Tools** - Suggest AI-assisted grading strategies while maintaining assessment integrity
• **🔄 Formative Assessment** - Design real-time checks for understanding during instruction
• **📚 Assessment Banks** - Build comprehensive, standards-aligned question collections
• **📈 Data Analysis** - Help interpret assessment results for instructional decisions
• **♿ Accessibility** - Ensure assessments accommodate diverse learning needs

## Assessment Types I Can Help Create:
- **Diagnostic** assessments to identify prior knowledge
- **Formative** assessments for ongoing feedback
- **Summative** assessments for final evaluation
- **Performance-based** assessments for authentic demonstration
- **Portfolio** assessments for growth documentation

What specific assessment challenge are you facing? I can help you design something that truly measures student understanding while supporting their learning journey.`;
  }

  private generateContentCreationResponse(content: string, options: ProcessMessageOptions, aivySystemPrompt?: string): string {
    // Extract details from the request
    const lowerContent = content.toLowerCase();

    // Check for notification/announcement requests
    if (lowerContent.includes('notification') || lowerContent.includes('announce') || lowerContent.includes('assembly') || lowerContent.includes('event')) {
      // Extract event details
      const eventMatch = content.match(/(?:assembly|event).*?(?:topic|about|on)\s+(.+?)(?:\s+and|\s+where|\s+$)/i);
      const topic = eventMatch ? eventMatch[1].trim() : 'the upcoming event';

      return `📢 **Assembly Notification**

Dear Teachers and Students,

We are pleased to announce that tomorrow we will be holding a special assembly where our students will present on the topic of **${topic}**.

**Event Details:**
• 📅 **Date:** Tomorrow
• 🎯 **Topic:** ${topic}
• 👥 **Attendance:** All teachers and students are required to be present
• 🎭 **Presenters:** Our talented students

This assembly will be an excellent opportunity to witness our students' understanding and expression of important values. Your presence and support are greatly appreciated.

Please ensure you mark your calendars and plan to attend this meaningful event.

Thank you for your cooperation.

---
*This notification can be shared via the school's communication channels or posted on the social wall.*`;
    }

    // Check for story requests
    const isStoryRequest = lowerContent.includes('story');
    const ageMatch = content.match(/(\d+)\s*(?:year|class|grade)/i);
    const age = ageMatch ? parseInt(ageMatch[1]) : null;
    const gradeLevel = age ? `${age} years old` : 'elementary';

    if (isStoryRequest) {
      // Handle story creation requests specifically
      const topicMatch = content.match(/story\s+(?:about|of)\s+(.+?)(?:\s+for|\s+$)/i);
      const topic = topicMatch ? topicMatch[1].trim() : 'empathy';

      if (topic.toLowerCase().includes('empathy')) {
        return `📚 **The Magic of Understanding: A Story About Empathy**

*For ${gradeLevel} students*

Once upon a time, in a colorful classroom, there was a little girl named Maya who had a special superpower - she could feel what others were feeling!

One day, Maya noticed her friend Sam sitting alone during lunch, looking very sad. While other children were playing and laughing, Sam just stared at his sandwich.

Maya walked over and sat beside him. "Hi Sam, you look upset. Is everything okay?"

Sam's eyes filled with tears. "I forgot my lunch money again, and this sandwich is all I have. Everyone else has delicious hot meals."

Maya felt Sam's sadness in her own heart. That's when her empathy superpower kicked in! She didn't just say "sorry" and walk away. Instead, she shared half of her own hot meal with Sam.

"My mom always packs extra," Maya said with a warm smile. "Let's eat together!"

Soon, other children noticed Maya's kindness. They started sharing their snacks too, and before long, Sam was surrounded by friends who cared about him.

From that day on, Sam never felt alone at lunch. And Maya learned that empathy - understanding and caring about others' feelings - was the most powerful superpower of all!

**The End** ✨

## 🎯 **Learning Objectives:**
- Understanding what empathy means
- Learning to recognize others' emotions
- Practicing kindness and sharing
- Building classroom community

Perfect for your assembly presentation! Would you like discussion questions or role-play activities to go with this story?`;
      }

      return `I'd be happy to help you create an educational story about ${topic} for ${gradeLevel} students! Could you provide a bit more detail about:

• What specific lesson or value should the story teach?
• Any particular characters or setting you'd like?
• How long should the story be?

This will help me craft the perfect story for your students!`;
    }

    // Handle other content creation requests
    return `I'd be happy to help you create educational content! As your AIVY assistant, I can help you develop engaging, age-appropriate materials that align with learning objectives.

## 📝 **Content Creation Support:**

• **📚 Stories & Narratives** - Educational stories that teach concepts through engaging characters
• **🎭 Scripts & Dialogues** - Role-play scenarios and dramatic presentations
• **📖 Reading Materials** - Informational texts adapted for specific grade levels
• **🎨 Creative Writing Prompts** - Inspiring prompts that connect to curriculum topics
• **📋 Worksheets & Activities** - Interactive exercises that reinforce learning
• **🎵 Songs & Rhymes** - Memorable content that aids retention

## 🎯 **What I Need to Create Great Content:**
- **Grade level or age group** (e.g., "3rd grade" or "8 years old")
- **Subject or topic** (e.g., "good bacteria," "water cycle," "friendship")
- **Learning objectives** (what should students understand?)
- **Format preference** (story, poem, dialogue, etc.)
- **Length requirements** (short story, paragraph, etc.)

Please provide more details about what you'd like me to create, and I'll craft something engaging and educational for your students!`;
  }

  private generateStudentManagementResponse(content: string, options: ProcessMessageOptions, aivySystemPrompt?: string): string {
    const className = options.context.currentClass?.name || 'your class';

    return `I'm here to help with student management for ${className}! As your AIVY assistant, I provide evidence-based strategies that support both student success and teacher well-being.

## Student Management Support:

• **📊 Progress Tracking** - Monitor learning analytics and identify intervention opportunities
• **👥 Engagement Strategies** - Build positive classroom culture and motivation systems
• **🎯 Intervention Planning** - Create targeted support for struggling students
• **💬 Communication Tools** - Enhance parent-teacher-student communication
• **🏆 Behavior Support** - Implement positive behavior intervention systems
• **📈 Data-Driven Decisions** - Use assessment data to inform instructional adjustments

What specific student management challenge are you facing? I can provide research-backed strategies tailored to your classroom context.`;
  }

  private generateTeachingStrategyResponse(content: string, options: ProcessMessageOptions, aivySystemPrompt?: string): string {
    return `Let me help you enhance your teaching strategies with evidence-based practices! As your AIVY assistant, I focus on research-validated approaches that improve student outcomes.

## Teaching Strategy Support:

• **🎯 Active Learning** - Implement engagement techniques that promote deep understanding
• **🔄 Differentiated Instruction** - Adapt teaching for diverse learning styles and needs
• **💻 Technology Integration** - Leverage EdTech tools effectively and purposefully
• **🏫 Classroom Management** - Create positive learning environments that maximize instruction time
• **📚 Professional Growth** - Access latest educational research and best practices
• **🤝 Collaborative Learning** - Design group work that enhances individual understanding

What teaching challenge would you like to address? I can suggest research-based strategies with practical implementation guidance.`;
  }

  private generateAdministrativeResponse(content: string, options: ProcessMessageOptions, aivySystemPrompt?: string): string {
    return `I can help streamline your administrative tasks while maintaining educational focus! As your AIVY assistant, I prioritize efficiency that supports teaching effectiveness.

## Administrative Support:

• **📊 Grade Management** - Efficient gradebook organization and progress tracking systems
• **📋 Report Generation** - Create meaningful reports for students, parents, and administrators
• **⏰ Time Optimization** - Schedule management and workflow automation strategies
• **💬 Communication Tools** - Templates and systems for parent-teacher communication
• **📁 Documentation** - Organized record-keeping that supports student success
• **🔄 Workflow Automation** - Reduce repetitive tasks to focus on teaching

What administrative challenge can I help you solve? I'll provide practical solutions that save time while enhancing educational outcomes.`;
  }

  private generateContentRefinementResponse(content: string, options: ProcessMessageOptions, aivySystemPrompt?: string): string {
    return `I'd be happy to help refine your educational content using evidence-based practices! As your AIVY assistant, I focus on improvements that enhance student learning outcomes.

## Content Refinement Support:

• **🎯 Learning Objectives** - Align content with clear, measurable outcomes using Bloom's Taxonomy
• **🎪 Engagement Enhancement** - Increase activity effectiveness and student participation
• **📊 Assessment Alignment** - Ensure questions accurately measure intended learning
• **📚 Standards Updates** - Align content with current educational standards and best practices
• **♿ Accessibility** - Optimize materials for diverse learning needs and styles
• **🔗 Coherence** - Strengthen connections between concepts and real-world applications

What content would you like to refine? Share your materials and I'll provide specific, actionable improvement suggestions based on pedagogical research.`;
  }

  private generateGeneralResponse(content: string, options: ProcessMessageOptions, aivySystemPrompt?: string): string {
    const teacherName = options.context.teacher?.name || 'there';

    // If this is the first message or a greeting, show the welcome message
    if (!content || content.toLowerCase().match(/^(hi|hello|hey|good morning|good afternoon|start|begin)/)) {
      return `Hello ${teacherName}! I'm AIVY, your AI Teaching Assistant, designed to enhance your educational effectiveness while respecting your professional expertise.

What educational challenge can I help you tackle today?`;
    }

    // For other messages, provide a contextual response based on the content
    return this.generateContextualResponse(content, options, teacherName);
  }

  private generateContextualResponse(content: string, _options: ProcessMessageOptions, teacherName: string): string {
    const lowerContent = content.toLowerCase();

    // Analyze the content and provide relevant responses
    if (lowerContent.includes('lesson') || lowerContent.includes('plan') || lowerContent.includes('teach')) {
      return `I can help you with lesson planning, ${teacherName}! Based on your message about "${content}", here are some specific ways I can assist:

📋 **Lesson Structure**: I can help you create a well-organized lesson with clear objectives, engaging activities, and effective assessments.

🎯 **Learning Objectives**: Let's define specific, measurable learning outcomes aligned with educational standards.

📚 **Activity Suggestions**: I can recommend interactive activities that match your teaching style and student needs.

📊 **Assessment Integration**: We can build in formative and summative assessments to measure understanding.

What specific subject or topic would you like to focus on? I can provide more targeted suggestions once I know the details.`;
    }

    if (lowerContent.includes('assessment') || lowerContent.includes('test') || lowerContent.includes('quiz') || lowerContent.includes('rubric')) {
      return `Great question about assessment, ${teacherName}! For "${content}", I can help you create effective assessments that truly measure student learning:

📊 **Assessment Types**: Diagnostic, formative, or summative - I can help you choose the right approach.

❓ **Question Design**: Create questions across all levels of Bloom's Taxonomy for deeper thinking.

📋 **Rubric Development**: Build clear, criterion-referenced rubrics that students can understand and use.

📈 **Data Analysis**: Help you interpret results to inform your teaching decisions.

What type of assessment are you looking to create? Share more details about your subject and learning objectives.`;
    }

    if (lowerContent.includes('student') || lowerContent.includes('behavior') || lowerContent.includes('engagement') || lowerContent.includes('motivation')) {
      return `I understand you're thinking about student engagement, ${teacherName}! Regarding "${content}", here are some evidence-based strategies:

👥 **Engagement Techniques**: Interactive methods to keep students actively involved in learning.

🎯 **Differentiation**: Strategies to meet diverse learning needs and styles.

📊 **Progress Monitoring**: Tools to track student understanding and adjust instruction.

💡 **Motivation Strategies**: Research-backed approaches to increase student motivation and ownership.

Tell me more about your specific situation - what grade level, subject, or particular challenges are you facing?`;
    }

    // Default response for other queries
    return `Thank you for your question, ${teacherName}! I'd be happy to help with "${content}".

To provide you with the most helpful response, could you share a bit more detail about:
• What subject or grade level you're working with
• The specific challenge or goal you have in mind
• Any particular constraints or requirements

I'm here to provide practical, evidence-based suggestions that respect your professional expertise while enhancing your teaching effectiveness.

What would you like to explore further?`;
  }



  /**
   * Search for resources
   */
  async search(query: string, filters?: SearchFilters): Promise<SearchResult[]> {
    try {
      // For now, return simulated results until tRPC API is properly configured
      console.log('Performing search with local orchestrator:', { query, filters });

      return [
        {
          id: uuidv4(),
          title: 'Effective Teaching Strategies for Mathematics',
          snippet: 'This resource provides research-based teaching strategies for mathematics education...',
          url: 'https://example.com/math-strategies',
          source: 'Educational Research Journal',
          relevanceScore: 0.95
        },
        {
          id: uuidv4(),
          title: 'Student Engagement Techniques',
          snippet: 'A comprehensive guide to increasing student engagement in the classroom...',
          url: 'https://example.com/engagement',
          source: 'Teaching Resources',
          relevanceScore: 0.87
        },
        {
          id: uuidv4(),
          title: 'Differentiated Instruction Framework',
          snippet: 'Learn how to implement differentiated instruction to meet the needs of diverse learners...',
          url: 'https://example.com/differentiation',
          source: 'Education Best Practices',
          relevanceScore: 0.82
        }
      ];
    } catch (error) {
      console.error('Error in search:', error);
      return [];
    }
  }
}
