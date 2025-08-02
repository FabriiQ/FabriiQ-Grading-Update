# FabriiQ LXP Internationalization (i18n) Documentation

## Overview

This document provides comprehensive guidelines for implementing and maintaining multi-language support in the FabriiQ Learning Experience Platform. The platform supports English (en), Arabic (ar), and Spanish (es) with full RTL support for Arabic.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Setup and Configuration](#setup-and-configuration)
3. [Translation File Structure](#translation-file-structure)
4. [Development Guidelines](#development-guidelines)
5. [RTL Support](#rtl-support)
6. [Testing Guidelines](#testing-guidelines)
7. [Maintenance Procedures](#maintenance-procedures)

## Architecture Overview

### Technology Stack

- **Library**: `next-intl` - Optimized for Next.js App Router
- **Routing**: Locale-based routing with institution support
- **File Format**: JSON for translation files
- **Type Safety**: Full TypeScript support for translations
- **Performance**: Bundle splitting and lazy loading per locale

### URL Structure

```
Pattern: /[locale]/[institution]/[...path]

Examples:
- /en/fabriiq/student/dashboard
- /ar/fabriiq/teacher/classes
- /es/fabriiq/admin/users
```

### Supported Locales

| Locale | Language | Direction | Status |
|--------|----------|-----------|---------|
| `en` | English | LTR | Default |
| `ar` | Arabic | RTL | Supported |
| `es` | Spanish | LTR | Supported |

## Setup and Configuration

### Dependencies

```json
{
  "next-intl": "^3.0.0",
  "@formatjs/intl-localematcher": "^0.4.0",
  "negotiator": "^0.6.3"
}
```

### Next.js Configuration

```typescript
// next.config.js
const withNextIntl = require('next-intl/plugin')('./src/i18n.ts');

module.exports = withNextIntl({
  // Your existing Next.js config
});
```

### Middleware Configuration

The middleware handles both locale detection and institution routing:

```typescript
// src/middleware.ts
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './config/i18n';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always'
});
```

## Translation File Structure

### Directory Organization

```
/messages
├── en/                     # English translations
│   ├── common.json         # Shared UI elements
│   ├── navigation.json     # Navigation items
│   ├── auth.json          # Authentication
│   ├── forms.json         # Form labels and validation
│   ├── errors.json        # Error messages
│   ├── student/           # Student portal
│   │   ├── dashboard.json
│   │   ├── activities.json
│   │   └── grades.json
│   ├── teacher/           # Teacher portal
│   │   ├── dashboard.json
│   │   ├── classes.json
│   │   └── assessments.json
│   ├── admin/             # Admin portal
│   │   ├── dashboard.json
│   │   ├── users.json
│   │   └── settings.json
│   └── features/          # Feature-specific
│       ├── social-wall.json
│       ├── assessments.json
│       └── activities.json
├── ar/                    # Arabic translations
│   └── [same structure]
└── es/                    # Spanish translations
    └── [same structure]
```

### Translation Key Naming Convention

```json
{
  "buttons": {
    "save": "Save",
    "cancel": "Cancel",
    "submit": "Submit",
    "delete": "Delete"
  },
  "forms": {
    "labels": {
      "email": "Email Address",
      "password": "Password",
      "confirmPassword": "Confirm Password"
    },
    "validation": {
      "required": "This field is required",
      "invalidEmail": "Please enter a valid email address",
      "passwordMismatch": "Passwords do not match"
    }
  },
  "navigation": {
    "student": {
      "dashboard": "Dashboard",
      "activities": "Activities",
      "grades": "Grades",
      "profile": "Profile"
    }
  }
}
```

## Development Guidelines

### Using Translations in Components

#### Server Components

```typescript
import { useTranslations } from 'next-intl';

export default function StudentDashboard() {
  const t = useTranslations('student.dashboard');
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('welcome', { name: 'John' })}</p>
    </div>
  );
}
```

#### Client Components

```typescript
'use client';
import { useTranslations } from 'next-intl';

export default function ActivityForm() {
  const t = useTranslations('forms');
  
  return (
    <form>
      <label>{t('labels.title')}</label>
      <input placeholder={t('placeholders.enterTitle')} />
      <button>{t('buttons.save')}</button>
    </form>
  );
}
```

### Translation with Parameters

```typescript
// Translation file
{
  "welcome": "Welcome back, {name}!",
  "itemCount": "You have {count, plural, =0 {no items} =1 {one item} other {# items}}"
}

// Component usage
const t = useTranslations();
<p>{t('welcome', { name: user.name })}</p>
<p>{t('itemCount', { count: items.length })}</p>
```

### Date and Number Formatting

```typescript
import { useFormatter } from 'next-intl';

export default function Dashboard() {
  const format = useFormatter();
  
  return (
    <div>
      <p>{format.dateTime(new Date(), 'short')}</p>
      <p>{format.number(1234.56, 'currency')}</p>
    </div>
  );
}
```

## RTL Support

### CSS Configuration

```css
/* globals.css */
[dir="rtl"] {
  direction: rtl;
}

[dir="rtl"] .rtl-flip {
  transform: scaleX(-1);
}
```

### Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  plugins: [
    require('@tailwindcss/rtl'),
  ],
  // RTL-aware utilities
  theme: {
    extend: {
      spacing: {
        'rtl-safe': 'var(--spacing-rtl-safe)',
      }
    }
  }
}
```

### Component RTL Handling

```typescript
import { useLocale } from 'next-intl';

export default function Navigation() {
  const locale = useLocale();
  const isRTL = locale === 'ar';
  
  return (
    <nav className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className="ms-4"> {/* margin-start instead of margin-left */}
        Content
      </div>
    </nav>
  );
}
```

## Testing Guidelines

### Translation Testing

```typescript
// __tests__/i18n.test.ts
import { getTranslations } from 'next-intl/server';

describe('Translations', () => {
  it('should have all required keys for each locale', async () => {
    const locales = ['en', 'ar', 'es'];
    
    for (const locale of locales) {
      const t = await getTranslations({ locale, namespace: 'common' });
      expect(t('buttons.save')).toBeDefined();
      expect(t('buttons.cancel')).toBeDefined();
    }
  });
});
```

### RTL Layout Testing

```typescript
// __tests__/rtl.test.tsx
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

describe('RTL Layout', () => {
  it('should render correctly in Arabic', () => {
    const { container } = render(
      <NextIntlClientProvider locale="ar" messages={{}}>
        <Navigation />
      </NextIntlClientProvider>
    );
    
    expect(container.firstChild).toHaveAttribute('dir', 'rtl');
  });
});
```

## Maintenance Procedures

### Adding New Translations

1. Add the key to the English translation file first
2. Update TypeScript types if using typed translations
3. Add corresponding translations in Arabic and Spanish
4. Test the translation in all supported locales

### Translation Validation

```bash
# Run translation validation script
npm run i18n:validate

# Check for missing translations
npm run i18n:missing

# Generate translation reports
npm run i18n:report
```

### Performance Monitoring

- Monitor bundle sizes per locale
- Track translation loading performance
- Validate lazy loading effectiveness

## Best Practices

### Do's ✅

- Use semantic translation keys
- Provide context for translators
- Test all locales during development
- Use ICU message format for pluralization
- Implement proper fallbacks
- Consider text expansion in layouts

### Don'ts ❌

- Don't concatenate translated strings
- Don't hardcode text in components
- Don't assume text length will be the same
- Don't forget to test RTL layouts
- Don't use technical terms as translation keys

## Troubleshooting

### Common Issues

1. **Missing Translation Keys**: Check console for missing key warnings
2. **RTL Layout Issues**: Verify CSS logical properties usage
3. **Bundle Size**: Monitor translation file sizes
4. **Performance**: Check for unnecessary re-renders

### Debug Mode

```typescript
// Enable debug mode in development
const messages = {
  ...require(`../messages/${locale}.json`),
  ...(process.env.NODE_ENV === 'development' && {
    debug: true
  })
};
```

## Resources

- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [ICU Message Format](https://formatjs.io/docs/core-concepts/icu-syntax/)
- [RTL Styling Guide](https://rtlstyling.com/)
- [Arabic Typography Guidelines](https://arabictypography.com/)

---

For questions or contributions to this documentation, please contact the development team.
