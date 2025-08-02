# FabriiQ LXP Translation Guidelines

## Overview

This document provides comprehensive guidelines for creating, maintaining, and managing translations for the FabriiQ Learning Experience Platform across English, Arabic, and Spanish languages.

## Translation Principles

### 1. Accuracy and Clarity
- Maintain the original meaning while adapting to target language
- Use clear, concise language appropriate for educational context
- Ensure technical terms are accurately translated or localized

### 2. Consistency
- Use consistent terminology across all features
- Maintain the same tone and style throughout the platform
- Follow established glossaries and style guides

### 3. Cultural Adaptation
- Adapt content to local cultural contexts
- Consider educational system differences
- Respect cultural sensitivities and norms

## Language-Specific Guidelines

### English (en) - Source Language

**Tone and Style:**
- Professional yet approachable
- Clear and concise
- Educational and supportive

**Writing Standards:**
- Use American English spelling
- Follow sentence case for UI elements
- Use active voice when possible
- Keep sentences under 20 words for UI text

**Examples:**
```json
{
  "buttons": {
    "save": "Save",
    "cancel": "Cancel",
    "submit": "Submit assignment"
  },
  "messages": {
    "success": "Your assignment has been submitted successfully",
    "error": "Unable to save your work. Please try again."
  }
}
```

### Arabic (ar) - RTL Language

**Cultural Considerations:**
- Use formal Arabic (Modern Standard Arabic)
- Respect Islamic educational values
- Consider regional variations (Gulf, Levant, North Africa)

**Technical Requirements:**
- Right-to-left text direction
- Arabic numerals (٠١٢٣٤٥٦٧٨٩) for UI elements
- Proper Arabic typography and spacing

**Grammar and Style:**
- Use appropriate honorifics for teachers/students
- Maintain gender-neutral language where possible
- Use clear, formal educational terminology

**Examples:**
```json
{
  "buttons": {
    "save": "حفظ",
    "cancel": "إلغاء",
    "submit": "تسليم الواجب"
  },
  "messages": {
    "success": "تم تسليم واجبك بنجاح",
    "error": "تعذر حفظ عملك. يرجى المحاولة مرة أخرى."
  }
}
```

**RTL-Specific Considerations:**
- Icon directions (arrows, chevrons)
- Number formatting
- Date and time display
- Layout adjustments

### Spanish (es) - International Spanish

**Regional Considerations:**
- Use neutral Spanish (español neutro)
- Avoid region-specific slang or expressions
- Consider both Latin American and European contexts

**Educational Context:**
- Use formal "usted" for teacher-student interactions
- Adapt to different educational system terminologies
- Consider bilingual education contexts

**Grammar and Style:**
- Use inclusive language
- Maintain formal tone for academic content
- Use clear, educational vocabulary

**Examples:**
```json
{
  "buttons": {
    "save": "Guardar",
    "cancel": "Cancelar",
    "submit": "Enviar tarea"
  },
  "messages": {
    "success": "Su tarea ha sido enviada exitosamente",
    "error": "No se pudo guardar su trabajo. Por favor, inténtelo de nuevo."
  }
}
```

## Translation File Structure

### Namespace Organization

```
/messages
├── en/
│   ├── common.json          # Shared UI elements
│   ├── navigation.json      # Navigation items
│   ├── auth.json           # Authentication
│   ├── forms.json          # Form elements
│   ├── errors.json         # Error messages
│   ├── student/            # Student portal
│   ├── teacher/            # Teacher portal
│   ├── admin/              # Admin portal
│   └── features/           # Feature-specific
├── ar/
│   └── [same structure]
└── es/
    └── [same structure]
```

### Key Naming Conventions

**Hierarchical Structure:**
```json
{
  "section": {
    "subsection": {
      "element": "Translation"
    }
  }
}
```

**Examples:**
```json
{
  "dashboard": {
    "student": {
      "welcome": "Welcome to your dashboard",
      "stats": {
        "assignments": "Assignments",
        "grades": "Grades",
        "activities": "Activities"
      }
    }
  }
}
```

## Content Categories

### 1. UI Elements

**Buttons:**
```json
{
  "buttons": {
    "primary": {
      "save": "Save",
      "submit": "Submit",
      "create": "Create",
      "edit": "Edit",
      "delete": "Delete"
    },
    "secondary": {
      "cancel": "Cancel",
      "back": "Back",
      "close": "Close"
    }
  }
}
```

**Navigation:**
```json
{
  "navigation": {
    "student": {
      "dashboard": "Dashboard",
      "activities": "Activities",
      "grades": "Grades",
      "profile": "Profile"
    },
    "teacher": {
      "dashboard": "Dashboard",
      "classes": "Classes",
      "assessments": "Assessments",
      "analytics": "Analytics"
    }
  }
}
```

### 2. Form Elements

**Labels:**
```json
{
  "forms": {
    "labels": {
      "email": "Email address",
      "password": "Password",
      "firstName": "First name",
      "lastName": "Last name"
    },
    "placeholders": {
      "email": "Enter your email address",
      "password": "Enter your password",
      "search": "Search..."
    }
  }
}
```

**Validation Messages:**
```json
{
  "validation": {
    "required": "This field is required",
    "email": "Please enter a valid email address",
    "minLength": "Minimum {count} characters required",
    "maxLength": "Maximum {count} characters allowed",
    "passwordMismatch": "Passwords do not match"
  }
}
```

### 3. Educational Content

**Bloom's Taxonomy:**
```json
{
  "bloom": {
    "levels": {
      "remember": "Remember",
      "understand": "Understand",
      "apply": "Apply",
      "analyze": "Analyze",
      "evaluate": "Evaluate",
      "create": "Create"
    },
    "descriptions": {
      "remember": "Recall facts and basic concepts",
      "understand": "Explain ideas or concepts"
    }
  }
}
```

**Assessment Types:**
```json
{
  "assessments": {
    "types": {
      "quiz": "Quiz",
      "assignment": "Assignment",
      "project": "Project",
      "exam": "Exam"
    },
    "status": {
      "draft": "Draft",
      "published": "Published",
      "completed": "Completed"
    }
  }
}
```

## Translation Process

### 1. Preparation Phase

**Source Analysis:**
- Review English source text
- Understand context and purpose
- Identify technical terms
- Note UI constraints (character limits)

**Research Phase:**
- Verify educational terminology
- Check cultural appropriateness
- Consult subject matter experts
- Review existing translations

### 2. Translation Phase

**Initial Translation:**
- Translate maintaining meaning and tone
- Adapt to target culture
- Consider UI space constraints
- Use appropriate formality level

**Review Process:**
- Self-review for accuracy
- Check consistency with glossary
- Verify technical terms
- Test in UI context

### 3. Quality Assurance

**Linguistic Review:**
- Grammar and syntax check
- Spelling and punctuation
- Style consistency
- Cultural appropriateness

**Technical Review:**
- UI integration testing
- Character limit compliance
- RTL layout verification (Arabic)
- Functionality testing

## Style Guides

### Tone and Voice

**Educational Platform Characteristics:**
- Professional yet approachable
- Supportive and encouraging
- Clear and instructional
- Respectful of all users

**Language Levels:**
- **Formal**: Official communications, policies
- **Semi-formal**: General UI, instructions
- **Friendly**: Encouragement, achievements

### Formatting Standards

**Capitalization:**
- Sentence case for UI elements
- Title case for page headings
- ALL CAPS only for emphasis (sparingly)

**Punctuation:**
- Consistent use across languages
- Adapt to language-specific rules
- Minimal punctuation in UI elements

**Numbers and Dates:**
- Localized number formats
- Appropriate date formats
- Currency localization

## Glossary Management

### Core Educational Terms

| English | Arabic | Spanish | Notes |
|---------|--------|---------|-------|
| Assessment | تقييم | Evaluación | Formal evaluation |
| Assignment | واجب | Tarea | Student work |
| Dashboard | لوحة التحكم | Panel de control | Main interface |
| Grade | درجة | Calificación | Academic score |
| Learning Outcome | مخرج التعلم | Resultado de aprendizaje | Educational goal |

### Technical Terms

| English | Arabic | Spanish | Notes |
|---------|--------|---------|-------|
| Login | تسجيل الدخول | Iniciar sesión | Authentication |
| Logout | تسجيل الخروج | Cerrar sesión | End session |
| Profile | الملف الشخصي | Perfil | User information |
| Settings | الإعدادات | Configuración | System preferences |

## Quality Assurance Checklist

### Pre-Translation
- [ ] Source text reviewed and understood
- [ ] Context and purpose clarified
- [ ] Technical terms identified
- [ ] Cultural considerations noted

### During Translation
- [ ] Meaning preserved
- [ ] Tone appropriate
- [ ] Terminology consistent
- [ ] Character limits respected

### Post-Translation
- [ ] Grammar and spelling checked
- [ ] Style guide followed
- [ ] Glossary terms verified
- [ ] UI context tested

### Final Review
- [ ] Native speaker review completed
- [ ] Technical functionality verified
- [ ] Cultural appropriateness confirmed
- [ ] Consistency across platform maintained

## Maintenance Guidelines

### Regular Updates
- Review translations quarterly
- Update based on user feedback
- Maintain consistency with new features
- Refresh cultural references

### Version Control
- Track translation changes
- Maintain translation memory
- Document revision reasons
- Coordinate with development team

### Feedback Integration
- Collect user feedback
- Monitor usage patterns
- Address reported issues
- Continuous improvement

---

These guidelines ensure high-quality, culturally appropriate translations that enhance the learning experience for all FabriiQ LXP users across different languages and cultures.
