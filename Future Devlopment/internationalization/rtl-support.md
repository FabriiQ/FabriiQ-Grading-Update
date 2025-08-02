# RTL (Right-to-Left) Support Guide

## Overview

This document provides comprehensive guidelines for implementing and maintaining Right-to-Left (RTL) language support in the FabriiQ LXP platform, specifically for Arabic language users.

## RTL Fundamentals

### What is RTL?

Right-to-Left (RTL) languages like Arabic, Hebrew, and Persian have text that flows from right to left, requiring special considerations for:
- Text direction and alignment
- Layout mirroring
- Icon orientations
- Navigation patterns
- Form layouts

### Arabic Language Specifics

**Text Characteristics:**
- Written from right to left
- Cursive script with connected letters
- Context-sensitive letter forms
- Numbers can be mixed direction (Arabic numerals flow LTR)

**Cultural Considerations:**
- Reading patterns start from top-right
- Navigation expectations mirror text direction
- Visual hierarchy follows RTL flow

## Technical Implementation

### 1. HTML Direction Attribute

```html
<!-- Set document direction -->
<html dir="rtl" lang="ar">
  <body>
    <!-- Content flows right to left -->
  </body>
</html>
```

### 2. CSS Direction Properties

```css
/* Global RTL styles */
[dir="rtl"] {
  direction: rtl;
  text-align: right;
}

/* Specific RTL adjustments */
[dir="rtl"] .navigation {
  flex-direction: row-reverse;
}

[dir="rtl"] .sidebar {
  right: 0;
  left: auto;
}
```

### 3. CSS Logical Properties (Recommended)

```css
/* Instead of directional properties */
.element {
  /* ❌ Avoid */
  margin-left: 1rem;
  padding-right: 0.5rem;
  border-left: 1px solid;
  
  /* ✅ Use logical properties */
  margin-inline-start: 1rem;
  padding-inline-end: 0.5rem;
  border-inline-start: 1px solid;
}
```

### 4. Tailwind CSS RTL Support

```javascript
// tailwind.config.js
module.exports = {
  plugins: [
    require('@tailwindcss/rtl'),
  ],
  theme: {
    extend: {
      fontFamily: {
        'arabic': ['Noto Sans Arabic', 'Amiri', 'sans-serif'],
      }
    }
  }
}
```

**Tailwind RTL Classes:**
```html
<!-- Logical spacing -->
<div class="ms-4 me-2">  <!-- margin-start, margin-end -->
<div class="ps-3 pe-3">  <!-- padding-start, padding-end -->

<!-- RTL-specific utilities -->
<div class="rtl:text-right ltr:text-left">
<div class="rtl:flex-row-reverse ltr:flex-row">
```

## Component Implementation

### 1. Layout Components

```typescript
import { useLocale } from 'next-intl';

export default function MainLayout({ children }) {
  const locale = useLocale();
  const isRTL = locale === 'ar';
  
  return (
    <div 
      dir={isRTL ? 'rtl' : 'ltr'}
      className={`min-h-screen ${isRTL ? 'font-arabic' : 'font-latin'}`}
    >
      <header className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className="ms-4"> {/* margin-start */}
          Logo
        </div>
        <nav className="flex-1">
          Navigation
        </nav>
      </header>
      
      <main className="container mx-auto px-4">
        {children}
      </main>
    </div>
  );
}
```

### 2. Navigation Components

```typescript
export default function Navigation() {
  const locale = useLocale();
  const isRTL = locale === 'ar';
  
  return (
    <nav className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} space-x-4`}>
      {menuItems.map((item) => (
        <a 
          key={item.id}
          href={item.href}
          className="px-3 py-2 hover:bg-gray-100"
        >
          {isRTL && item.icon && (
            <span className="me-2">{item.icon}</span>
          )}
          {item.label}
          {!isRTL && item.icon && (
            <span className="ms-2">{item.icon}</span>
          )}
        </a>
      ))}
    </nav>
  );
}
```

### 3. Form Components

```typescript
export default function LoginForm() {
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const t = useTranslations('auth.login');
  
  return (
    <form className="space-y-4">
      <div className={`flex flex-col ${isRTL ? 'text-right' : 'text-left'}`}>
        <label className="mb-2 font-medium">
          {t('labels.email')}
        </label>
        <input 
          type="email"
          className={`px-3 py-2 border rounded ${
            isRTL ? 'text-right' : 'text-left'
          }`}
          placeholder={t('placeholders.email')}
          dir={isRTL ? 'rtl' : 'ltr'}
        />
      </div>
      
      <button 
        type="submit"
        className={`w-full py-2 px-4 bg-blue-600 text-white rounded ${
          isRTL ? 'font-arabic' : 'font-latin'
        }`}
      >
        {t('buttons.signIn')}
      </button>
    </form>
  );
}
```

### 4. Icon Handling

```typescript
import { ChevronRightIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';

export default function NavigationArrow({ direction = 'next' }) {
  const locale = useLocale();
  const isRTL = locale === 'ar';
  
  // Determine which icon to show based on direction and RTL
  const getIcon = () => {
    if (direction === 'next') {
      return isRTL ? ChevronLeftIcon : ChevronRightIcon;
    } else {
      return isRTL ? ChevronRightIcon : ChevronLeftIcon;
    }
  };
  
  const Icon = getIcon();
  
  return <Icon className="w-5 h-5" />;
}
```

## Layout Patterns

### 1. Sidebar Layouts

```css
/* LTR Layout */
.sidebar-layout {
  display: flex;
}

.sidebar {
  width: 250px;
  order: 1;
}

.main-content {
  flex: 1;
  order: 2;
}

/* RTL Layout */
[dir="rtl"] .sidebar {
  order: 2;
}

[dir="rtl"] .main-content {
  order: 1;
}
```

### 2. Card Layouts

```typescript
export default function ActivityCard({ activity }) {
  const locale = useLocale();
  const isRTL = locale === 'ar';
  
  return (
    <div className={`p-4 border rounded-lg ${isRTL ? 'text-right' : 'text-left'}`}>
      <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center mb-2`}>
        <div className="flex-shrink-0 me-3">
          <ActivityIcon />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">{activity.title}</h3>
          <p className="text-gray-600">{activity.description}</p>
        </div>
      </div>
      
      <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} justify-between items-center`}>
        <span className="text-sm text-gray-500">
          {formatDate(activity.dueDate)}
        </span>
        <button className="px-3 py-1 bg-blue-600 text-white rounded">
          {t('buttons.view')}
        </button>
      </div>
    </div>
  );
}
```

### 3. Table Layouts

```typescript
export default function StudentsTable({ students }) {
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const t = useTranslations('teacher.students');
  
  return (
    <div className="overflow-x-auto">
      <table className={`w-full ${isRTL ? 'text-right' : 'text-left'}`}>
        <thead>
          <tr className="border-b">
            <th className="py-2 px-4">{t('table.name')}</th>
            <th className="py-2 px-4">{t('table.email')}</th>
            <th className="py-2 px-4">{t('table.grade')}</th>
            <th className="py-2 px-4">{t('table.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id} className="border-b">
              <td className="py-2 px-4">{student.name}</td>
              <td className="py-2 px-4" dir="ltr">{student.email}</td>
              <td className="py-2 px-4">{student.grade}</td>
              <td className="py-2 px-4">
                <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} space-x-2`}>
                  <button className="text-blue-600">{t('actions.edit')}</button>
                  <button className="text-red-600">{t('actions.delete')}</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## Typography and Fonts

### 1. Arabic Font Selection

```css
/* Arabic font stack */
.font-arabic {
  font-family: 'Noto Sans Arabic', 'Amiri', 'Tahoma', sans-serif;
}

/* Ensure proper Arabic rendering */
[dir="rtl"] {
  font-family: 'Noto Sans Arabic', 'Amiri', 'Tahoma', sans-serif;
  font-feature-settings: 'liga' 1, 'calt' 1;
}
```

### 2. Font Loading

```typescript
// app/layout.tsx
import { Noto_Sans_Arabic, Inter } from 'next/font/google';

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  variable: '--font-arabic',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-latin',
  display: 'swap',
});

export default function RootLayout({ children, params: { locale } }) {
  const isRTL = locale === 'ar';
  
  return (
    <html 
      lang={locale} 
      dir={isRTL ? 'rtl' : 'ltr'}
      className={`${notoSansArabic.variable} ${inter.variable}`}
    >
      <body className={isRTL ? 'font-arabic' : 'font-latin'}>
        {children}
      </body>
    </html>
  );
}
```

## Number and Date Formatting

### 1. Number Formatting

```typescript
import { useFormatter } from 'next-intl';

export default function GradeDisplay({ grade }) {
  const format = useFormatter();
  const locale = useLocale();
  
  return (
    <div>
      {/* Numbers in Arabic use Arabic-Indic digits */}
      <span>{format.number(grade)}</span>
      
      {/* Percentages */}
      <span>{format.number(grade / 100, 'percent')}</span>
    </div>
  );
}
```

### 2. Date Formatting

```typescript
export default function DateDisplay({ date }) {
  const format = useFormatter();
  const locale = useLocale();
  
  return (
    <div>
      {/* Full date in Arabic */}
      <span>{format.dateTime(date, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      })}</span>
      
      {/* Time display */}
      <span>{format.dateTime(date, {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      })}</span>
    </div>
  );
}
```

## Testing RTL Layouts

### 1. Visual Testing

```typescript
// __tests__/rtl-layout.test.tsx
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

describe('RTL Layout Tests', () => {
  it('should apply RTL direction for Arabic', () => {
    const { container } = render(
      <NextIntlClientProvider locale="ar" messages={{}}>
        <MainLayout>
          <div>Test content</div>
        </MainLayout>
      </NextIntlClientProvider>
    );
    
    expect(container.firstChild).toHaveAttribute('dir', 'rtl');
  });
  
  it('should use Arabic fonts for RTL', () => {
    const { container } = render(
      <NextIntlClientProvider locale="ar" messages={{}}>
        <div>Arabic text</div>
      </NextIntlClientProvider>
    );
    
    expect(container.firstChild).toHaveClass('font-arabic');
  });
});
```

### 2. Manual Testing Checklist

**Layout Testing:**
- [ ] Text flows right to left
- [ ] Navigation mirrors correctly
- [ ] Icons face correct direction
- [ ] Forms align properly
- [ ] Tables display correctly

**Typography Testing:**
- [ ] Arabic fonts load correctly
- [ ] Text renders properly
- [ ] Line height appropriate
- [ ] Character spacing correct

**Interaction Testing:**
- [ ] Scrolling behavior correct
- [ ] Dropdown menus position properly
- [ ] Modal dialogs center correctly
- [ ] Tooltips appear in right position

## Common Pitfalls and Solutions

### 1. Mixed Content Direction

**Problem:** English text within Arabic content
```html
<!-- ❌ Problematic -->
<p>هذا نص عربي مع email@example.com في الوسط</p>
```

**Solution:** Use direction isolation
```html
<!-- ✅ Correct -->
<p>هذا نص عربي مع <span dir="ltr">email@example.com</span> في الوسط</p>
```

### 2. Icon Direction

**Problem:** Directional icons not flipping
```typescript
// ❌ Static icon
<ChevronRightIcon className="w-5 h-5" />
```

**Solution:** Conditional icon selection
```typescript
// ✅ Direction-aware icon
const Icon = isRTL ? ChevronLeftIcon : ChevronRightIcon;
<Icon className="w-5 h-5" />
```

### 3. Absolute Positioning

**Problem:** Fixed positioning breaks in RTL
```css
/* ❌ Directional positioning */
.dropdown {
  position: absolute;
  left: 0;
}
```

**Solution:** Use logical properties
```css
/* ✅ Logical positioning */
.dropdown {
  position: absolute;
  inset-inline-start: 0;
}
```

## Performance Considerations

### 1. Font Loading Optimization

```typescript
// Preload Arabic fonts
<link
  rel="preload"
  href="/fonts/NotoSansArabic-Regular.woff2"
  as="font"
  type="font/woff2"
  crossOrigin="anonymous"
/>
```

### 2. CSS Bundle Optimization

```css
/* Conditional RTL styles */
@media (dir: rtl) {
  .component {
    /* RTL-specific styles */
  }
}
```

---

This guide ensures proper RTL support implementation that provides an excellent user experience for Arabic-speaking users while maintaining performance and accessibility standards.
