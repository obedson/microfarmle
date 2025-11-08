# Marob Farm - Mobile-First Responsive Design Specification

## Design System Overview

### Core Principles
- **Mobile-First**: Design starts at 320px and scales up
- **Progressive Enhancement**: Core functionality works on all devices
- **Performance-First**: Sub-3s load times on 3G networks
- **Accessibility**: WCAG 2.1 AA compliance

## Visual Design System

### Color Palette
```css
:root {
  /* Primary Colors */
  --primary-50: #f0fdf4;
  --primary-500: #22c55e;
  --primary-600: #16a34a;
  --primary-700: #15803d;
  
  /* Neutral Colors */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-500: #6b7280;
  --gray-900: #111827;
  
  /* Semantic Colors */
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;
}
```

### Typography Scale
```css
:root {
  /* Font Families */
  --font-primary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  
  /* Font Sizes (Mobile-First) */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  --text-4xl: 2.25rem;   /* 36px */
}
```

### Spacing System
```css
:root {
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
}
```

## Responsive Breakpoints

```css
:root {
  --breakpoint-sm: 640px;   /* Small tablets */
  --breakpoint-md: 768px;   /* Tablets */
  --breakpoint-lg: 1024px;  /* Small laptops */
  --breakpoint-xl: 1280px;  /* Desktops */
  --breakpoint-2xl: 1536px; /* Large screens */
}
```

## Component Architecture

### 1. Layout Components

#### Header/Navigation
```tsx
// Mobile: Hamburger menu with slide-out drawer
// Desktop: Horizontal navigation with dropdowns
<Header>
  <Logo />
  <MobileMenuToggle />
  <DesktopNav />
  <UserActions />
</Header>
```

#### Grid System
```css
.container {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 var(--space-4);
}

.grid {
  display: grid;
  gap: var(--space-4);
  grid-template-columns: 1fr; /* Mobile default */
}

@media (min-width: 640px) {
  .grid-sm-2 { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 1024px) {
  .grid-lg-3 { grid-template-columns: repeat(3, 1fr); }
  .grid-lg-4 { grid-template-columns: repeat(4, 1fr); }
}
```

### 2. UI Components

#### Button System
```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-6);
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.2s ease;
  min-height: 44px; /* Touch target */
}

.btn-primary {
  background: var(--primary-600);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-700);
  transform: translateY(-1px);
}
```

#### Card Components
```css
.card {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
```

## Page-Specific Designs

### 1. Property Listing Page
```tsx
<PropertyGrid>
  {/* Mobile: 1 column, Tablet: 2 columns, Desktop: 3-4 columns */}
  <PropertyCard>
    <ImageCarousel />
    <PropertyInfo>
      <Title />
      <Location />
      <Price />
      <Features />
    </PropertyInfo>
    <ActionButtons />
  </PropertyCard>
</PropertyGrid>
```

### 2. Property Details Page
```tsx
<PropertyDetails>
  <ImageGallery /> {/* Full-width on mobile, sidebar on desktop */}
  <PropertyInfo>
    <Header />
    <Description />
    <Amenities />
    <Location />
  </PropertyInfo>
  <BookingForm /> {/* Sticky on mobile, sidebar on desktop */}
</PropertyDetails>
```

### 3. Dashboard Layout
```tsx
<Dashboard>
  <Sidebar /> {/* Hidden on mobile, slide-out menu */}
  <MainContent>
    <StatsCards /> {/* 1 col mobile, 2-4 cols desktop */}
    <DataTable /> {/* Horizontal scroll on mobile */}
  </MainContent>
</Dashboard>
```

## Performance Optimization

### 1. Image Optimization
```tsx
// Use next-gen formats with fallbacks
<picture>
  <source srcSet="image.webp" type="image/webp" />
  <source srcSet="image.avif" type="image/avif" />
  <img src="image.jpg" alt="Property" loading="lazy" />
</picture>
```

### 2. Code Splitting
```tsx
// Lazy load non-critical components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const PropertyDetails = lazy(() => import('./pages/PropertyDetails'));
```

### 3. Critical CSS
```css
/* Inline critical CSS for above-the-fold content */
.hero, .header, .main-nav {
  /* Critical styles here */
}
```

## Icon System

### Icon Library: Lucide React
```tsx
import { 
  Home, 
  Search, 
  User, 
  MapPin, 
  Calendar,
  DollarSign,
  Star,
  Heart,
  Share2
} from 'lucide-react';

// Consistent sizing
const iconSizes = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32
};
```

## Animation & Interactions

### 1. Micro-interactions
```css
.interactive {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.interactive:hover {
  transform: translateY(-1px);
}

.interactive:active {
  transform: translateY(0);
}
```

### 2. Loading States
```tsx
<Skeleton className="h-4 w-full animate-pulse" />
<Spinner className="animate-spin" />
```

## Security Considerations

### 1. Content Security Policy
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; img-src 'self' data: https:; script-src 'self'">
```

### 2. Input Sanitization
```tsx
// Use DOMPurify for user-generated content
import DOMPurify from 'dompurify';

const sanitizedHTML = DOMPurify.sanitize(userContent);
```

## Accessibility Features

### 1. Keyboard Navigation
```css
.focusable:focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}
```

### 2. Screen Reader Support
```tsx
<button aria-label="Add to favorites">
  <Heart />
</button>

<img src="property.jpg" alt="2-bedroom apartment in downtown" />
```

### 3. Color Contrast
- Minimum 4.5:1 for normal text
- Minimum 3:1 for large text
- Use tools like WebAIM contrast checker

## Implementation Tools

### 1. CSS Framework: Tailwind CSS
```bash
npm install tailwindcss @tailwindcss/forms @tailwindcss/typography
```

### 2. Component Library: Headless UI
```bash
npm install @headlessui/react
```

### 3. Animation: Framer Motion
```bash
npm install framer-motion
```

### 4. Icons: Lucide React
```bash
npm install lucide-react
```

## Testing Strategy

### 1. Responsive Testing
- Chrome DevTools device simulation
- Real device testing (iOS Safari, Android Chrome)
- BrowserStack for cross-browser testing

### 2. Performance Testing
- Lighthouse CI integration
- WebPageTest for real-world conditions
- Core Web Vitals monitoring

### 3. Accessibility Testing
- axe-core automated testing
- Manual keyboard navigation testing
- Screen reader testing (NVDA, JAWS, VoiceOver)

## Deployment Checklist

- [ ] Minified CSS/JS bundles
- [ ] Gzip/Brotli compression enabled
- [ ] CDN for static assets
- [ ] Service worker for offline functionality
- [ ] Progressive Web App manifest
- [ ] Meta tags for social sharing
- [ ] Structured data for SEO
