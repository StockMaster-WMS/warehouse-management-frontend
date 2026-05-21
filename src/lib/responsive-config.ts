// Responsive Design Constants & Best Practices
// File: src/lib/responsive-config.ts

/**
 * Responsive Breakpoints (Tailwind CSS)
 * Sử dụng mobile-first approach
 */
export const BREAKPOINTS = {
    // xs - Mobile (< 640px) - default
    xs: 0,
    // sm - Small devices (≥ 640px)
    sm: 640,
    // md - Tablet (≥ 768px)
    md: 768,
    // lg - Desktop (≥ 1024px)
    lg: 1024,
    // xl - Large desktop (≥ 1280px)
    xl: 1280,
    // 2xl - Extra large (≥ 1536px)
    '2xl': 1536,
} as const;

/**
 * Responsive Design Patterns
 * Copy-paste ready patterns cho các use cases chung
 */
export const RESPONSIVE_PATTERNS = {
    // Responsive padding
    containerPadding: {
        mobile: 'px-3 py-4',
        tablet: 'md:px-6 md:py-6',
        desktop: 'lg:px-8 lg:py-8',
    },

    // Responsive grid
    grid2Col: 'grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 md:gap-6',
    grid3Col: 'grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3 md:gap-6',
    grid4Col: 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-5 md:gap-6',

    // Responsive text
    heading1: 'text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold',
    heading2: 'text-lg sm:text-xl md:text-2xl font-semibold',
    heading3: 'text-base sm:text-lg font-semibold',
    body: 'text-sm sm:text-base font-normal',
    caption: 'text-xs sm:text-sm font-medium text-muted-foreground',
    label: 'text-xs sm:text-sm font-medium',

    // Responsive gaps
    gapSmall: 'gap-2 sm:gap-3',
    gapMedium: 'gap-3 sm:gap-4 md:gap-5',
    gapLarge: 'gap-4 sm:gap-5 md:gap-6',

    // Responsive buttons
    buttonSmall: 'h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm',
    buttonMedium: 'h-9 sm:h-10 px-3 sm:px-4 text-sm',
    buttonLarge: 'h-10 sm:h-11 px-4 sm:px-6 text-base',

    // Hide/Show
    hideOnMobile: 'hidden md:flex',
    showOnMobile: 'md:hidden',
    hideOnTablet: 'hidden lg:flex',
    showOnTablet: 'lg:hidden',
} as const;

/**
 * Touch Target Size Standards
 * WCAG 2.1 - Minimum 44x44px for touch targets
 */
export const TOUCH_TARGETS = {
    // Minimum touch target in pixels
    minSize: 44,
    // Spacing between touch targets
    minSpacing: 8,
    // Common sizes
    icon: 'size-5', // 20px - use with padding
    iconSmall: 'size-4', // 16px - use with padding
    iconLarge: 'size-6', // 24px - use with padding
} as const;

/**
 * Maximum Content Width Standards
 * Để content dễ đọc và organized
 */
export const MAX_WIDTHS = {
    // Traditional max-width cho body
    prose: 'max-w-3xl',
    // Wider content area
    container: 'max-w-5xl',
    // Full width container
    full: 'w-full',
} as const;

/**
 * Responsive Layout Utilities
 * Helper functions để tạo responsive classes
 */
export const getResponsiveClass = {
    /**
     * Responsive padding around content
     * @param mobile - Mobile padding class (px-3 py-4)
     * @param tablet - Tablet padding class (md:px-6)
     * @param desktop - Desktop padding class (lg:px-8)
     */
    padding: (mobile: string, tablet?: string, desktop?: string) => {
        return [mobile, tablet, desktop].filter(Boolean).join(' ');
    },

    /**
     * Responsive grid columns
     * @param mobile - Default columns
     * @param tablet - md: breakpoint
     * @param desktop - lg: breakpoint
     */
    gridCols: (mobile: number, tablet?: number, desktop?: number) => {
        return [
            `grid-cols-${mobile}`,
            tablet ? `md:grid-cols-${tablet}` : '',
            desktop ? `lg:grid-cols-${desktop}` : '',
        ]
            .filter(Boolean)
            .join(' ');
    },

    /**
     * Responsive gaps
     * @param mobile - Default gap
     * @param tablet - md: gap
     * @param desktop - lg: gap
     */
    gap: (mobile: string, tablet?: string, desktop?: string) => {
        return [
            `gap-${mobile}`,
            tablet ? `md:gap-${tablet}` : '',
            desktop ? `lg:gap-${desktop}` : '',
        ]
            .filter(Boolean)
            .join(' ');
    },
} as const;

/**
 * Responsive Font Size Configuration
 */
export const RESPONSIVE_FONT_SIZES = {
    // Heading 1
    h1: {
        mobile: '1.25rem', // 20px
        tablet: '1.5rem', // 24px
        desktop: '2rem', // 32px
    },
    // Heading 2
    h2: {
        mobile: '1.125rem', // 18px
        tablet: '1.375rem', // 22px
        desktop: '1.75rem', // 28px
    },
    // Body
    body: {
        mobile: '0.875rem', // 14px
        tablet: '1rem', // 16px
        desktop: '1rem', // 16px
    },
    // Caption
    caption: {
        mobile: '0.75rem', // 12px
        tablet: '0.875rem', // 14px
        desktop: '0.875rem', // 14px
    },
} as const;

/**
 * Common Responsive Viewport Meta Tags
 */
export const VIEWPORT_META = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
} as const;

/**
 * Mobile First Utilities
 * Dùng các tiện ích này khi xây dựng responsive components
 */
export const MOBILE_FIRST = {
    // Layouts
    containerLayout: 'flex flex-col md:flex-row',
    stackLayout: 'flex flex-col gap-3 sm:gap-4 md:gap-5',
    gridLayout: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',

    // Visibility
    hideBelow: {
        sm: 'hidden sm:block',
        md: 'hidden md:block',
        lg: 'hidden lg:block',
        xl: 'hidden xl:block',
    },
    showBelow: {
        sm: 'sm:hidden',
        md: 'md:hidden',
        lg: 'lg:hidden',
        xl: 'xl:hidden',
    },

    // Display
    inlineBlock: 'block md:inline-block',
    inlineFlex: 'flex flex-col md:flex-row',
} as const;

/**
 * Testing Breakpoints
 * Các kích thước cần test trên các devices khác nhau
 */
export const TEST_BREAKPOINTS = {
    // Mobile
    iPhone_SE: { width: 375, height: 667, name: 'iPhone SE' },
    iPhone_12: { width: 390, height: 844, name: 'iPhone 12' },
    iPhone_14_Pro_Max: { width: 430, height: 932, name: 'iPhone 14 Pro Max' },
    Pixel_5: { width: 393, height: 851, name: 'Pixel 5' },

    // Tablet
    iPad_Mini: { width: 768, height: 1024, name: 'iPad Mini' },
    iPad_Pro: { width: 1024, height: 1366, name: 'iPad Pro' },
    Galaxy_Tab: { width: 800, height: 1280, name: 'Galaxy Tab' },

    // Desktop
    Desktop_HD: { width: 1366, height: 768, name: 'HD (1366x768)' },
    Desktop_FHD: { width: 1920, height: 1080, name: 'FHD (1920x1080)' },
    Desktop_2K: { width: 2560, height: 1440, name: '2K (2560x1440)' },
    Desktop_4K: { width: 3840, height: 2160, name: '4K (3840x2160)' },
} as const;

/**
 * Accessibility Guidelines for Responsive Design
 */
export const A11Y_GUIDELINES = {
    // Minimum touch target size
    minTouchSize: 44,
    // Minimum spacing between touch targets
    minTouchSpacing: 8,
    // Minimum line height for readability
    minLineHeight: 1.5,
    // Maximum line length for readability (characters)
    maxLineLength: 80,
    // Minimum color contrast ratio (WCAG AA)
    minContrastRatio: 4.5,
} as const;

/**
 * Performance Tips for Responsive Design
 */
export const PERFORMANCE_TIPS = [
    'Sử dụng responsive images với next/image',
    'Lazy load components heavy trên mobile',
    'Minimize CSS sử dụng Tailwind purging',
    'Use CSS Grid/Flexbox thay vì floats',
    'Avoid using !important trong responsive rules',
    'Test performance trên slow 3G/4G networks',
    'Use media queries efficiently (mobile-first)',
    'Không sử dụng fixed widths, dùng relative units',
] as const;

const responsiveConfig = {
    BREAKPOINTS,
    RESPONSIVE_PATTERNS,
    TOUCH_TARGETS,
    MAX_WIDTHS,
    RESPONSIVE_FONT_SIZES,
    VIEWPORT_META,
    MOBILE_FIRST,
    TEST_BREAKPOINTS,
    A11Y_GUIDELINES,
    PERFORMANCE_TIPS,
};

export default responsiveConfig;
