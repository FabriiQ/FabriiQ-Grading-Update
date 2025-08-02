# FabriiQ LXP i18n Testing Guide

## Overview

This document provides comprehensive testing strategies and procedures for validating internationalization (i18n) implementation across English, Arabic, and Spanish languages in the FabriiQ LXP platform.

## Testing Strategy

### 1. Testing Levels

**Unit Testing:**
- Translation key validation
- Component rendering with different locales
- Utility function testing

**Integration Testing:**
- Locale switching functionality
- Route handling with locales
- API responses with localized content

**End-to-End Testing:**
- Complete user workflows in all languages
- Cross-browser compatibility
- Performance testing

**Visual Testing:**
- Layout verification across languages
- RTL layout validation
- Typography and spacing

## Automated Testing

### 1. Translation Key Validation

```typescript
// __tests__/translations.test.ts
import { describe, it, expect } from '@jest/globals';

const locales = ['en', 'ar', 'es'];
const namespaces = ['common', 'navigation', 'auth', 'forms'];

describe('Translation Completeness', () => {
  it('should have all required translation keys for each locale', async () => {
    for (const locale of locales) {
      for (const namespace of namespaces) {
        const messages = await import(`../messages/${locale}/${namespace}.json`);
        
        // Check for required keys
        expect(messages.buttons).toBeDefined();
        expect(messages.buttons.save).toBeDefined();
        expect(messages.buttons.cancel).toBeDefined();
      }
    }
  });
  
  it('should have consistent key structure across locales', async () => {
    const englishMessages = await import('../messages/en/common.json');
    const arabicMessages = await import('../messages/ar/common.json');
    const spanishMessages = await import('../messages/es/common.json');
    
    const englishKeys = Object.keys(englishMessages);
    const arabicKeys = Object.keys(arabicMessages);
    const spanishKeys = Object.keys(spanishMessages);
    
    expect(arabicKeys).toEqual(englishKeys);
    expect(spanishKeys).toEqual(englishKeys);
  });
});
```

### 2. Component Testing with Locales

```typescript
// __tests__/components/LoginForm.test.tsx
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import LoginForm from '@/components/LoginForm';

const messages = {
  en: {
    auth: {
      login: {
        labels: { email: 'Email', password: 'Password' },
        buttons: { signIn: 'Sign In' }
      }
    }
  },
  ar: {
    auth: {
      login: {
        labels: { email: 'البريد الإلكتروني', password: 'كلمة المرور' },
        buttons: { signIn: 'تسجيل الدخول' }
      }
    }
  },
  es: {
    auth: {
      login: {
        labels: { email: 'Correo electrónico', password: 'Contraseña' },
        buttons: { signIn: 'Iniciar sesión' }
      }
    }
  }
};

describe('LoginForm Localization', () => {
  it.each(['en', 'ar', 'es'])('renders correctly in %s locale', (locale) => {
    render(
      <NextIntlClientProvider locale={locale} messages={messages[locale]}>
        <LoginForm />
      </NextIntlClientProvider>
    );
    
    const emailLabel = screen.getByText(messages[locale].auth.login.labels.email);
    const signInButton = screen.getByText(messages[locale].auth.login.buttons.signIn);
    
    expect(emailLabel).toBeInTheDocument();
    expect(signInButton).toBeInTheDocument();
  });
  
  it('applies RTL direction for Arabic', () => {
    const { container } = render(
      <NextIntlClientProvider locale="ar" messages={messages.ar}>
        <LoginForm />
      </NextIntlClientProvider>
    );
    
    const form = container.querySelector('form');
    expect(form).toHaveAttribute('dir', 'rtl');
  });
});
```

### 3. RTL Layout Testing

```typescript
// __tests__/rtl-layout.test.tsx
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import Navigation from '@/components/Navigation';

describe('RTL Layout Tests', () => {
  it('should apply correct flex direction for RTL', () => {
    const { container } = render(
      <NextIntlClientProvider locale="ar" messages={{}}>
        <Navigation />
      </NextIntlClientProvider>
    );
    
    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('flex-row-reverse');
  });
  
  it('should use Arabic fonts for RTL content', () => {
    const { container } = render(
      <NextIntlClientProvider locale="ar" messages={{}}>
        <div>Arabic content</div>
      </NextIntlClientProvider>
    );
    
    expect(container.firstChild).toHaveClass('font-arabic');
  });
  
  it('should position icons correctly in RTL', () => {
    const { container } = render(
      <NextIntlClientProvider locale="ar" messages={{}}>
        <button>
          <span>Text</span>
          <svg data-testid="icon">Icon</svg>
        </button>
      </NextIntlClientProvider>
    );
    
    const button = container.querySelector('button');
    expect(button).toHaveClass('flex-row-reverse');
  });
});
```

### 4. Date and Number Formatting Tests

```typescript
// __tests__/formatting.test.ts
import { formatDate, formatNumber } from '@/lib/i18n/formatters';

describe('Locale-specific Formatting', () => {
  const testDate = new Date('2024-01-15T10:30:00Z');
  const testNumber = 1234.56;
  
  it('formats dates correctly for each locale', () => {
    expect(formatDate(testDate, 'en')).toMatch(/January 15, 2024/);
    expect(formatDate(testDate, 'ar')).toMatch(/١٥ يناير ٢٠٢٤/);
    expect(formatDate(testDate, 'es')).toMatch(/15 de enero de 2024/);
  });
  
  it('formats numbers correctly for each locale', () => {
    expect(formatNumber(testNumber, 'en')).toBe('1,234.56');
    expect(formatNumber(testNumber, 'ar')).toBe('١٬٢٣٤٫٥٦');
    expect(formatNumber(testNumber, 'es')).toBe('1.234,56');
  });
  
  it('formats currency correctly for each locale', () => {
    expect(formatNumber(testNumber, 'en', 'currency')).toMatch(/\$1,234.56/);
    expect(formatNumber(testNumber, 'ar', 'currency')).toMatch(/١٬٢٣٤٫٥٦/);
    expect(formatNumber(testNumber, 'es', 'currency')).toMatch(/1\.234,56/);
  });
});
```

## Manual Testing Procedures

### 1. Locale Switching Testing

**Test Steps:**
1. Navigate to any page in the application
2. Use language selector to switch to Arabic
3. Verify URL changes to include `/ar/` prefix
4. Confirm all UI text displays in Arabic
5. Check RTL layout application
6. Switch to Spanish and verify similar behavior
7. Return to English and confirm proper restoration

**Expected Results:**
- URL correctly reflects locale
- All text translates appropriately
- Layout adjusts for RTL (Arabic only)
- User preferences persist across sessions

### 2. RTL Layout Validation

**Test Areas:**
- Navigation menus
- Form layouts
- Data tables
- Card components
- Modal dialogs
- Dropdown menus

**Checklist:**
- [ ] Text flows right to left
- [ ] Navigation items reverse order
- [ ] Icons face correct direction
- [ ] Margins and padding mirror correctly
- [ ] Scrollbars appear on left side
- [ ] Form fields align properly

### 3. Typography Testing

**Arabic Typography Checklist:**
- [ ] Arabic fonts load correctly
- [ ] Character connections render properly
- [ ] Diacritics display correctly
- [ ] Line height appropriate for Arabic text
- [ ] Mixed content (Arabic + English) handles properly

**Spanish Typography Checklist:**
- [ ] Accented characters display correctly
- [ ] Special characters (ñ, ¿, ¡) render properly
- [ ] Font weights and styles consistent

### 4. Form Testing

**Test Scenarios:**
1. **Input Fields:**
   - Text direction in RTL
   - Placeholder text alignment
   - Error message positioning
   - Label alignment

2. **Validation Messages:**
   - Translated error messages
   - Proper positioning in RTL
   - Character count displays

3. **Submit Buttons:**
   - Text translation
   - Icon positioning
   - Loading states

### 5. Navigation Testing

**Areas to Test:**
- Main navigation menu
- Breadcrumb navigation
- Pagination controls
- Tab navigation
- Mobile navigation

**Verification Points:**
- [ ] Menu items translate correctly
- [ ] Active states display properly
- [ ] Hover effects work in all languages
- [ ] Mobile menu functions in RTL

## Performance Testing

### 1. Bundle Size Analysis

```bash
# Analyze bundle sizes per locale
npm run build
npm run analyze

# Check translation file sizes
du -sh messages/*/
```

**Metrics to Monitor:**
- Total bundle size increase
- Per-locale bundle sizes
- Translation file loading times
- Font loading performance

### 2. Loading Performance

```typescript
// __tests__/performance.test.ts
import { measurePerformance } from '@/lib/testing/performance';

describe('i18n Performance', () => {
  it('should load translations within acceptable time', async () => {
    const startTime = performance.now();
    
    await import('../messages/ar/common.json');
    
    const loadTime = performance.now() - startTime;
    expect(loadTime).toBeLessThan(100); // 100ms threshold
  });
  
  it('should not significantly impact page load time', async () => {
    const metrics = await measurePerformance('/ar/student/dashboard');
    
    expect(metrics.firstContentfulPaint).toBeLessThan(2000);
    expect(metrics.largestContentfulPaint).toBeLessThan(4000);
  });
});
```

## Cross-Browser Testing

### 1. Browser Compatibility Matrix

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| RTL Layout | ✅ | ✅ | ✅ | ✅ |
| Arabic Fonts | ✅ | ✅ | ✅ | ✅ |
| Locale Switching | ✅ | ✅ | ✅ | ✅ |
| Number Formatting | ✅ | ✅ | ✅ | ✅ |

### 2. Mobile Testing

**Devices to Test:**
- iOS Safari (iPhone/iPad)
- Android Chrome
- Android Firefox

**Focus Areas:**
- Touch interactions in RTL
- Mobile navigation menus
- Form input behavior
- Keyboard display for Arabic

## Accessibility Testing

### 1. Screen Reader Testing

**Tools:**
- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (macOS/iOS)
- TalkBack (Android)

**Test Scenarios:**
- Navigation in different languages
- Form completion
- Content reading order in RTL
- Language announcements

### 2. Keyboard Navigation

**Test Points:**
- Tab order in RTL layouts
- Focus indicators visibility
- Keyboard shortcuts functionality
- Skip links behavior

## Visual Regression Testing

### 1. Screenshot Testing

```typescript
// __tests__/visual-regression.test.ts
import { takeScreenshot, compareScreenshots } from '@/lib/testing/visual';

describe('Visual Regression Tests', () => {
  it('should maintain layout consistency across locales', async () => {
    const englishScreenshot = await takeScreenshot('/en/student/dashboard');
    const arabicScreenshot = await takeScreenshot('/ar/student/dashboard');
    const spanishScreenshot = await takeScreenshot('/es/student/dashboard');
    
    // Compare layouts (allowing for text differences)
    const layoutDiff = compareScreenshots(englishScreenshot, arabicScreenshot, {
      ignoreText: true,
      threshold: 0.1
    });
    
    expect(layoutDiff).toBeLessThan(0.05);
  });
});
```

### 2. Component Visual Testing

```typescript
// __tests__/component-visual.test.tsx
import { render } from '@testing-library/react';
import { toMatchImageSnapshot } from 'jest-image-snapshot';

expect.extend({ toMatchImageSnapshot });

describe('Component Visual Tests', () => {
  it('renders navigation correctly in all locales', () => {
    const locales = ['en', 'ar', 'es'];
    
    locales.forEach(locale => {
      const { container } = render(
        <NextIntlClientProvider locale={locale} messages={messages[locale]}>
          <Navigation />
        </NextIntlClientProvider>
      );
      
      expect(container).toMatchImageSnapshot({
        customSnapshotIdentifier: `navigation-${locale}`
      });
    });
  });
});
```

## Test Data Management

### 1. Test Translation Files

```json
// __tests__/fixtures/test-messages.json
{
  "en": {
    "common": {
      "buttons": {
        "save": "Save",
        "cancel": "Cancel"
      }
    }
  },
  "ar": {
    "common": {
      "buttons": {
        "save": "حفظ",
        "cancel": "إلغاء"
      }
    }
  },
  "es": {
    "common": {
      "buttons": {
        "save": "Guardar",
        "cancel": "Cancelar"
      }
    }
  }
}
```

### 2. Mock Data Localization

```typescript
// __tests__/fixtures/mock-data.ts
export const mockStudents = {
  en: [
    { id: 1, name: 'John Doe', grade: 'A' },
    { id: 2, name: 'Jane Smith', grade: 'B+' }
  ],
  ar: [
    { id: 1, name: 'أحمد محمد', grade: 'ممتاز' },
    { id: 2, name: 'فاطمة علي', grade: 'جيد جداً' }
  ],
  es: [
    { id: 1, name: 'Juan Pérez', grade: 'A' },
    { id: 2, name: 'María García', grade: 'B+' }
  ]
};
```

## Continuous Integration

### 1. CI Pipeline Integration

```yaml
# .github/workflows/i18n-tests.yml
name: i18n Tests

on: [push, pull_request]

jobs:
  i18n-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run translation validation
        run: npm run test:i18n
        
      - name: Run RTL layout tests
        run: npm run test:rtl
        
      - name: Run visual regression tests
        run: npm run test:visual
        
      - name: Check bundle sizes
        run: npm run analyze:bundle
```

### 2. Quality Gates

**Translation Coverage:**
- 100% key coverage across all locales
- No missing translations in production builds
- Consistent key structure validation

**Performance Thresholds:**
- Bundle size increase < 20%
- Translation loading time < 100ms
- Page load time impact < 10%

**Visual Consistency:**
- Layout regression threshold < 5%
- Typography rendering accuracy 100%
- RTL layout validation 100%

---

This comprehensive testing guide ensures robust internationalization implementation that provides consistent, high-quality user experiences across all supported languages and cultures.
