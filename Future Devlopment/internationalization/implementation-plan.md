# FabriiQ LXP i18n Implementation Plan

## Project Overview

This document outlines the comprehensive implementation plan for adding multi-language support to the FabriiQ Learning Experience Platform, supporting English, Arabic, and Spanish with full RTL support.

## Implementation Phases

### Phase 1: Infrastructure Setup (Days 1-3)

#### 1.1 Dependencies Installation
```bash
npm install next-intl @formatjs/intl-localematcher negotiator
npm install -D @types/negotiator
```

#### 1.2 Core Configuration Files

**Files to Create:**
- `src/config/i18n.ts` - Locale configuration
- `src/i18n.ts` - next-intl configuration
- `src/lib/i18n/` - Utility functions
- `messages/` - Translation files structure

**Files to Modify:**
- `next.config.js` - Add next-intl plugin
- `src/middleware.ts` - Integrate locale routing
- `src/app/layout.tsx` - Add locale provider

#### 1.3 Routing Updates

**Current Structure:**
```
/[institution]/portal/page
```

**New Structure:**
```
/[locale]/[institution]/portal/page
```

**Migration Strategy:**
1. Update middleware to handle locale detection
2. Modify existing route groups to include locale
3. Add locale parameter to all page components
4. Update internal navigation links

### Phase 2: Translation File Structure (Days 4-5)

#### 2.1 Namespace Organization

```
/messages
├── en/
│   ├── common.json          # Buttons, labels, common UI
│   ├── navigation.json      # All navigation items
│   ├── auth.json           # Login, register, forgot password
│   ├── forms.json          # Form labels and validation
│   ├── errors.json         # Error messages and alerts
│   ├── student/
│   │   ├── dashboard.json   # Student dashboard
│   │   ├── activities.json  # Student activities
│   │   ├── grades.json      # Grades and performance
│   │   └── profile.json     # Student profile
│   ├── teacher/
│   │   ├── dashboard.json   # Teacher dashboard
│   │   ├── classes.json     # Class management
│   │   ├── assessments.json # Assessment creation
│   │   ├── activities.json  # Activity management
│   │   └── analytics.json   # Teacher analytics
│   ├── admin/
│   │   ├── dashboard.json   # Admin dashboard
│   │   ├── users.json       # User management
│   │   ├── campus.json      # Campus management
│   │   └── settings.json    # System settings
│   └── features/
│       ├── social-wall.json # Social wall feature
│       ├── h5p.json        # H5P integration
│       ├── bloom.json      # Bloom's taxonomy
│       └── rubrics.json    # Rubric system
├── ar/ [same structure]
└── es/ [same structure]
```

#### 2.2 Translation Key Standards

**Naming Convention:**
```json
{
  "section": {
    "subsection": {
      "element": "Translation text"
    }
  }
}
```

**Examples:**
```json
{
  "buttons": {
    "primary": {
      "save": "Save",
      "submit": "Submit",
      "create": "Create"
    },
    "secondary": {
      "cancel": "Cancel",
      "back": "Back"
    }
  },
  "forms": {
    "validation": {
      "required": "This field is required",
      "email": "Please enter a valid email",
      "minLength": "Minimum {count} characters required"
    }
  }
}
```

### Phase 3: Core Component Migration (Days 6-9)

#### 3.1 Priority Order

1. **Layout Components** (Day 6)
   - `src/app/layout.tsx`
   - `src/app/client-layout.tsx`
   - Navigation components
   - Header/Footer components

2. **Authentication Components** (Day 7)
   - Login form
   - Registration form
   - Password reset
   - Error pages

3. **Navigation Components** (Day 8)
   - Role-based navigation
   - Mobile navigation
   - Breadcrumbs
   - Menu items

4. **Common UI Components** (Day 9)
   - Buttons
   - Forms
   - Modals
   - Alerts/Notifications

#### 3.2 Migration Pattern

**Before:**
```typescript
export default function LoginForm() {
  return (
    <form>
      <label>Username</label>
      <input placeholder="Enter your username" />
      <button>Sign In</button>
    </form>
  );
}
```

**After:**
```typescript
import { useTranslations } from 'next-intl';

export default function LoginForm() {
  const t = useTranslations('auth.login');
  
  return (
    <form>
      <label>{t('labels.username')}</label>
      <input placeholder={t('placeholders.username')} />
      <button>{t('buttons.signIn')}</button>
    </form>
  );
}
```

### Phase 4: Feature Component Migration (Days 10-16)

#### 4.1 Student Portal (Days 10-11)
- Dashboard components
- Activity viewers
- Grade displays
- Profile management
- Social wall (student view)

#### 4.2 Teacher Portal (Days 12-13)
- Dashboard components
- Class management
- Assessment creation
- Activity management
- Analytics views

#### 4.3 Admin Portal (Days 14-15)
- User management
- Campus administration
- System settings
- Reports and analytics

#### 4.4 Shared Features (Day 16)
- Social wall components
- Bloom's taxonomy
- Rubric system
- Assessment engine

### Phase 5: RTL Support Implementation (Days 17-19)

#### 5.1 CSS Framework Updates (Day 17)

**Tailwind Configuration:**
```javascript
module.exports = {
  plugins: [
    require('@tailwindcss/rtl'),
  ],
  theme: {
    extend: {
      fontFamily: {
        'arabic': ['Noto Sans Arabic', 'sans-serif'],
        'latin': ['Inter', 'sans-serif'],
      }
    }
  }
}
```

**Global CSS Updates:**
```css
/* Add to globals.css */
[dir="rtl"] {
  direction: rtl;
  font-family: 'Noto Sans Arabic', sans-serif;
}

[dir="ltr"] {
  direction: ltr;
  font-family: 'Inter', sans-serif;
}
```

#### 5.2 Component RTL Adaptations (Day 18)

**Layout Adjustments:**
- Navigation positioning
- Icon orientations
- Text alignment
- Spacing and margins
- Form layouts

**Example RTL Component:**
```typescript
import { useLocale } from 'next-intl';

export default function Navigation() {
  const locale = useLocale();
  const isRTL = locale === 'ar';
  
  return (
    <nav 
      dir={isRTL ? 'rtl' : 'ltr'}
      className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Navigation items */}
    </nav>
  );
}
```

#### 5.3 Icon and Asset Updates (Day 19)
- Flip directional icons for RTL
- Update arrow directions
- Adjust logo positioning
- Test image layouts

### Phase 6: Language Switching UI (Days 20-21)

#### 6.1 Language Selector Component (Day 20)

```typescript
'use client';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';

export default function LanguageSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  
  const switchLanguage = (newLocale: string) => {
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };
  
  return (
    <select 
      value={locale} 
      onChange={(e) => switchLanguage(e.target.value)}
    >
      <option value="en">English</option>
      <option value="ar">العربية</option>
      <option value="es">Español</option>
    </select>
  );
}
```

#### 6.2 User Preference Integration (Day 21)
- Database schema updates
- User preference storage
- Automatic locale detection
- Remember user choice

### Phase 7: Database Schema Updates (Days 22-23)

#### 7.1 User Preferences (Day 22)

```sql
-- Add locale preference to users
ALTER TABLE "User" ADD COLUMN "preferredLocale" VARCHAR(5) DEFAULT 'en';

-- Add locale to content where needed
ALTER TABLE "Post" ADD COLUMN "locale" VARCHAR(5) DEFAULT 'en';
ALTER TABLE "Assessment" ADD COLUMN "locale" VARCHAR(5) DEFAULT 'en';
```

#### 7.2 Content Localization (Day 23)
- Multi-language content support
- Locale-specific content filtering
- Content translation workflows

### Phase 8: Translation Content Creation (Days 24-28)

#### 8.1 English Baseline (Day 24)
- Extract all hardcoded strings
- Create comprehensive English translations
- Organize by namespaces
- Add context comments

#### 8.2 Arabic Translations (Days 25-26)
- Professional Arabic translation
- Cultural adaptation
- RTL-specific considerations
- Review and validation

#### 8.3 Spanish Translations (Days 27-28)
- Professional Spanish translation
- Regional considerations
- Review and validation
- Final proofreading

### Phase 9: Testing and Quality Assurance (Days 29-31)

#### 9.1 Automated Testing (Day 29)
- Translation key validation
- Missing translation detection
- RTL layout testing
- Performance testing

#### 9.2 Manual Testing (Day 30)
- Full application testing in all languages
- RTL layout validation
- User experience testing
- Cross-browser testing

#### 9.3 Performance Optimization (Day 31)
- Bundle size optimization
- Lazy loading validation
- Translation caching
- Performance monitoring

## Risk Mitigation

### Technical Risks
1. **Bundle Size Increase**: Implement lazy loading and code splitting
2. **Performance Impact**: Monitor and optimize translation loading
3. **RTL Layout Issues**: Comprehensive testing and CSS logical properties
4. **SEO Impact**: Proper hreflang implementation

### Content Risks
1. **Translation Quality**: Professional translation services
2. **Cultural Sensitivity**: Cultural review process
3. **Maintenance Overhead**: Automated validation tools
4. **Consistency**: Translation style guides

## Success Metrics

### Technical Metrics
- Bundle size increase < 20%
- Page load time increase < 10%
- Translation coverage 100%
- Zero missing translation errors

### User Experience Metrics
- Language switching success rate > 99%
- RTL layout rendering accuracy 100%
- User preference persistence 100%
- Cross-browser compatibility 100%

## Rollout Strategy

### Phase 1: Internal Testing
- Development team testing
- Stakeholder review
- Bug fixes and refinements

### Phase 2: Beta Release
- Limited user group testing
- Feedback collection
- Performance monitoring

### Phase 3: Production Release
- Gradual rollout
- Monitoring and support
- Documentation updates

## Maintenance Plan

### Ongoing Tasks
- Translation updates
- New feature localization
- Performance monitoring
- User feedback incorporation

### Quarterly Reviews
- Translation accuracy review
- Performance optimization
- User experience assessment
- Technology updates

---

This implementation plan ensures a systematic approach to adding comprehensive multi-language support while maintaining application performance and user experience quality.
