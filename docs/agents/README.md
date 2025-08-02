# AIVY Agentic System Documentation

## Overview

AIVY (Artificial Intelligence Virtual Yearning) is the comprehensive agentic system powering FabriiQ's Learning Experience Platform. AIVY consists of specialized AI agents designed to enhance educational outcomes through intelligent, context-aware interactions.

## System Architecture

```
FabriiQ LXP Platform
├── AIVY Agentic System
│   ├── Student Companion Agent
│   ├── Teacher Assistant Agent
│   ├── Agent Orchestrator
│   ├── Context Management
│   └── Safety & Compliance Layer
```

## Core Components

### 1. **Student Companion Agent**
- **Purpose**: Personalized learning support for students
- **Location**: `src/features/student-assistant/`
- **Token Usage**: 200-800 tokens per query
- **Documentation**: [Student Companion](./student-companion.md)

### 2. **Teacher Assistant Agent**
- **Purpose**: Curriculum and pedagogical support for educators
- **Location**: `src/features/teacher-assistant/`
- **Token Usage**: 300-1200 tokens per query
- **Documentation**: [Teacher Assistant](./teacher-assistant.md)

### 3. **Agent Orchestrator**
- **Purpose**: Multi-agent coordination and workflow management
- **Location**: `src/features/agent-orchestrator/`
- **Token Usage**: 150-500 tokens per coordination task
- **Documentation**: [Multi-Agent Orchestration](./multi-agent-orchestration.md)

## Key Features

### Educational Integrity
- Socratic questioning methodology
- Academic honesty enforcement
- Plagiarism detection integration
- Assessment support without answer provision

### Contextual Intelligence
- Curriculum alignment
- Learning objective awareness
- Student progress tracking
- Adaptive difficulty adjustment

### Multi-Modal Support
- Text-based conversations
- Document analysis
- Code review and guidance
- Visual content interpretation

### Safety & Compliance
- Student privacy protection
- FERPA compliance
- Content filtering
- Bias detection and mitigation

## Token Usage Guidelines

### Query Classification
- **Simple Questions**: 200-400 tokens
- **Complex Analysis**: 500-800 tokens
- **Multi-Step Problems**: 800-1200 tokens
- **Research Tasks**: 1000-1500 tokens

### Optimization Strategies
- Context compression for long conversations
- Intelligent prompt engineering
- Caching for frequently accessed content
- Progressive disclosure for complex topics

## Integration Points

### Platform Integration
- **Authentication**: Seamless SSO with FabriiQ accounts
- **Data Access**: Real-time curriculum and progress data
- **Notifications**: Proactive learning suggestions
- **Analytics**: Learning outcome tracking

### External Services
- **AI Providers**: OpenAI, Anthropic, Google AI
- **Content Sources**: Educational databases, textbooks
- **Assessment Tools**: Rubric engines, plagiarism checkers
- **Communication**: Email, SMS, push notifications

## Development Guidelines

### Agent Development
1. Follow the AIVY system prompt guidelines
2. Implement proper error handling
3. Include comprehensive logging
4. Test with educational scenarios
5. Validate against learning objectives

### Quality Assurance
- Educational content accuracy verification
- Response appropriateness testing
- Performance benchmarking
- User experience validation

### Deployment
- Staged rollout to educational institutions
- A/B testing for feature improvements
- Continuous monitoring and optimization
- Feedback collection and analysis

## Implementation Status

### ✅ Completed Components
- **AIVY System Prompt**: Centralized 950-token educational AI prompt (`/src/lib/aivy-system-prompt.ts`)
- **Student Companion**: Updated with AIVY principles and token management
- **Teacher Assistant**: Enhanced with AIVY system prompt integration
- **Documentation**: Comprehensive agent architecture and usage guides

### 🔄 Integration Points
- **Student Assistant Provider**: Uses AIVY system prompt with educational context
- **Teacher Assistant Orchestrator**: Enhanced responses following AIVY principles
- **Token Management**: Intelligent budgeting and validation systems
- **Context Awareness**: Educational context integration across all agents

### 📊 Token Usage Implementation
- **Student Companion**: 200-800 tokens per interaction
- **Teacher Assistant**: 300-1200 tokens per interaction
- **System Prompt**: ~950 tokens baseline + context overhead
- **Budget Validation**: Automatic token allocation and optimization

## Getting Started

1. **Read the Architecture**: Start with [Multi-Agent Orchestration](./multi-agent-orchestration.md)
2. **Understand Agents**: Review [Student Companion](./student-companion.md) and [Teacher Assistant](./teacher-assistant.md)
3. **System Prompt**: Review `/src/lib/aivy-system-prompt.ts` for implementation details
4. **Implementation**: Follow the development guidelines and AIVY principles
5. **Testing**: Use educational test scenarios with token budget validation
6. **Deployment**: Follow staged rollout procedures with monitoring

## Support & Resources

- **Technical Documentation**: `/docs/technical/`
- **API Reference**: `/docs/api/`
- **Educational Guidelines**: `/docs/pedagogy/`
- **AIVY System Prompt**: `/src/lib/aivy-system-prompt.ts`
- **Troubleshooting**: `/docs/troubleshooting/`

## Recent Updates

### AIVY System Integration (Latest)
- ✅ Created centralized AIVY system prompt utility
- ✅ Updated Student Companion with educational integrity principles
- ✅ Enhanced Teacher Assistant with evidence-based response patterns
- ✅ Implemented token budget validation and optimization
- ✅ Added comprehensive documentation for all agent types

---

*AIVY is designed to enhance human education, not replace it. All agents operate under strict educational integrity guidelines to ensure authentic learning experiences while maintaining optimal token efficiency.*
