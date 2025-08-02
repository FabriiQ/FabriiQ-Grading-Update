# FabriiQ LXP i18n Developer Guide

## Quick Start

This guide provides practical examples and patterns for developers working with internationalization in the FabriiQ LXP platform.

## Basic Usage

### 1. Server Components

```typescript
import { useTranslations } from 'next-intl';

export default function StudentDashboard() {
  const t = useTranslations('student.dashboard');
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('welcomeMessage', { name: 'John' })}</p>
    </div>
  );
}
```

### 2. Client Components

```typescript
'use client';
import { useTranslations } from 'next-intl';

export default function CreateActivityForm() {
  const t = useTranslations('teacher.activities');
  
  return (
    <form>
      <label>{t('form.title')}</label>
      <input placeholder={t('form.titlePlaceholder')} />
      <button>{t('buttons.create')}</button>
    </form>
  );
}
```

### 3. Page Components with Locale

```typescript
import { useTranslations } from 'next-intl';

interface PageProps {
  params: {
    locale: string;
    institution: string;
  };
}

export default function TeacherClassesPage({ params }: PageProps) {
  const t = useTranslations('teacher.classes');
  
  return (
    <div>
      <h1>{t('pageTitle')}</h1>
      {/* Page content */}
    </div>
  );
}
```

## Translation Patterns

### 1. Simple Translations

```json
// messages/en/common.json
{
  "buttons": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete"
  }
}
```

```typescript
const t = useTranslations('common');
<button>{t('buttons.save')}</button>
```

### 2. Translations with Parameters

```json
{
  "welcome": "Welcome back, {name}!",
  "lastLogin": "Last login: {date}",
  "itemCount": "You have {count} items"
}
```

```typescript
const t = useTranslations('dashboard');
<p>{t('welcome', { name: user.name })}</p>
<p>{t('lastLogin', { date: formatDate(user.lastLogin) })}</p>
<p>{t('itemCount', { count: items.length })}</p>
```

### 3. Pluralization

```json
{
  "studentCount": "{count, plural, =0 {No students} =1 {One student} other {# students}}"
}
```

```typescript
<p>{t('studentCount', { count: students.length })}</p>
```

### 4. Rich Text with HTML

```json
{
  "termsText": "By continuing, you agree to our <link>Terms of Service</link>"
}
```

```typescript
<p>{t.rich('termsText', {
  link: (chunks) => <a href="/terms">{chunks}</a>
})}</p>
```

## Form Handling

### 1. Form Labels and Validation

```typescript
'use client';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';

export default function LoginForm() {
  const t = useTranslations('auth.login');
  const { register, handleSubmit, formState: { errors } } = useForm();
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>{t('labels.email')}</label>
        <input 
          {...register('email', { 
            required: t('validation.emailRequired'),
            pattern: {
              value: /^\S+@\S+$/i,
              message: t('validation.emailInvalid')
            }
          })}
          placeholder={t('placeholders.email')}
        />
        {errors.email && <span>{errors.email.message}</span>}
      </div>
      
      <button type="submit">{t('buttons.signIn')}</button>
    </form>
  );
}
```

### 2. Dynamic Validation Messages

```json
{
  "validation": {
    "required": "This field is required",
    "minLength": "Minimum {min} characters required",
    "maxLength": "Maximum {max} characters allowed",
    "passwordMismatch": "Passwords do not match"
  }
}
```

```typescript
const validatePassword = (value: string) => {
  if (value.length < 8) {
    return t('validation.minLength', { min: 8 });
  }
  return true;
};
```

## Date and Number Formatting

### 1. Date Formatting

```typescript
import { useFormatter } from 'next-intl';

export default function ActivityCard({ activity }) {
  const format = useFormatter();
  
  return (
    <div>
      <h3>{activity.title}</h3>
      <p>{format.dateTime(activity.dueDate, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}</p>
    </div>
  );
}
```

### 2. Number and Currency Formatting

```typescript
const format = useFormatter();

// Numbers
<span>{format.number(1234.56)}</span> // 1,234.56 (en) | ١٬٢٣٤٫٥٦ (ar)

// Currency
<span>{format.number(99.99, 'currency')}</span> // $99.99 (en) | ٩٩٫٩٩ $ (ar)

// Percentages
<span>{format.number(0.85, 'percent')}</span> // 85% (en) | ٨٥٪ (ar)
```

## RTL Support

### 1. Direction-Aware Components

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
      <div className={`${isRTL ? 'ml-4' : 'mr-4'}`}>
        Logo
      </div>
      <div className="flex-1">
        Menu Items
      </div>
    </nav>
  );
}
```

### 2. CSS Logical Properties (Recommended)

```typescript
// Use logical properties instead of directional ones
<div className="ms-4 me-2"> {/* margin-start, margin-end */}
  <div className="ps-3 pe-3"> {/* padding-start, padding-end */}
    Content
  </div>
</div>
```

### 3. Icon Flipping for RTL

```typescript
import { useLocale } from 'next-intl';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

export default function NavigationArrow() {
  const locale = useLocale();
  const isRTL = locale === 'ar';
  
  return (
    <ChevronRightIcon 
      className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`}
    />
  );
}
```

## Error Handling

### 1. Missing Translation Fallbacks

```typescript
import { useTranslations } from 'next-intl';

export default function Component() {
  const t = useTranslations('namespace');
  
  // Provide fallback for missing keys
  const getText = (key: string, fallback: string) => {
    try {
      return t(key);
    } catch {
      return fallback;
    }
  };
  
  return <span>{getText('missingKey', 'Default text')}</span>;
}
```

### 2. Error Boundaries for i18n

```typescript
'use client';
import { ErrorBoundary } from 'react-error-boundary';

function I18nErrorFallback({ error }: { error: Error }) {
  return (
    <div role="alert">
      <h2>Translation Error</h2>
      <pre>{error.message}</pre>
    </div>
  );
}

export default function App({ children }) {
  return (
    <ErrorBoundary FallbackComponent={I18nErrorFallback}>
      {children}
    </ErrorBoundary>
  );
}
```

## Performance Optimization

### 1. Namespace Splitting

```typescript
// Instead of loading all translations
const t = useTranslations(); // ❌ Loads everything

// Load specific namespaces
const commonT = useTranslations('common'); // ✅ Loads only common
const formsT = useTranslations('forms');   // ✅ Loads only forms
```

### 2. Lazy Loading Translations

```typescript
import { lazy } from 'react';

// Lazy load feature-specific components with their translations
const SocialWall = lazy(() => import('./SocialWall'));

export default function Dashboard() {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <SocialWall />
      </Suspense>
    </div>
  );
}
```

## Testing

### 1. Component Testing with Translations

```typescript
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import LoginForm from './LoginForm';

const messages = {
  auth: {
    login: {
      labels: { email: 'Email' },
      buttons: { signIn: 'Sign In' }
    }
  }
};

test('renders login form', () => {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <LoginForm />
    </NextIntlClientProvider>
  );
  
  expect(screen.getByText('Email')).toBeInTheDocument();
  expect(screen.getByText('Sign In')).toBeInTheDocument();
});
```

### 2. RTL Testing

```typescript
test('renders correctly in RTL', () => {
  const { container } = render(
    <NextIntlClientProvider locale="ar" messages={messages}>
      <Navigation />
    </NextIntlClientProvider>
  );
  
  expect(container.firstChild).toHaveAttribute('dir', 'rtl');
});
```

## Common Patterns

### 1. Conditional Text

```typescript
const t = useTranslations('dashboard');
const status = isOnline ? 'online' : 'offline';

<span className={`status-${status}`}>
  {t(`status.${status}`)}
</span>
```

### 2. Dynamic Keys

```typescript
const t = useTranslations('roles');
const userRole = user.role.toLowerCase();

<span>{t(`${userRole}.title`)}</span>
```

### 3. Nested Translations

```typescript
// For complex nested structures
const t = useTranslations('features.socialWall.posts');

<div>
  <h3>{t('title')}</h3>
  <p>{t('description')}</p>
  <button>{t('actions.create')}</button>
</div>
```

## Best Practices

### Do's ✅

1. **Use semantic keys**: `auth.login.title` not `loginPageTitle`
2. **Provide context**: Add comments in translation files
3. **Use namespaces**: Split translations logically
4. **Test all locales**: Don't just test English
5. **Use logical CSS properties**: `ms-4` instead of `ml-4`

### Don'ts ❌

1. **Don't concatenate**: `t('hello') + ' ' + name` ❌
2. **Don't hardcode text**: Always use translation keys
3. **Don't assume text length**: Design for expansion
4. **Don't forget RTL**: Test Arabic layouts
5. **Don't use technical keys**: `btn_save` ❌, use `buttons.save` ✅

## Troubleshooting

### Common Issues

1. **Missing translations**: Check console for warnings
2. **RTL layout broken**: Use logical CSS properties
3. **Performance issues**: Split namespaces appropriately
4. **Hydration errors**: Ensure server/client locale consistency

### Debug Mode

```typescript
// Enable in development
process.env.NODE_ENV === 'development' && console.log('Translation key:', key);
```

---

For more detailed examples, see the implementation files in the codebase.
