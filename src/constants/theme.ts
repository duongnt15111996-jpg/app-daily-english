export const COLORS = {
  primary: '#3B82F6',
  primaryDark: '#1560FC',
  primaryLight: '#EEF3FF',
  secondary: '#8B3BF6',
  green: '#00C94F',
  orange: '#FF6900',
  red: '#EF4444',
  white: '#FFFFFF',
  background: '#F5F7FA',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: {
    primary: '#1E2940',
    secondary: '#647587',
    light: '#94A3B8',
  },
  gradient: {
    blue: ['#3B82F6', '#1560FC'] as const,
    purple: ['#AD46FF', '#9810FA'] as const,
    green: ['#00C94F', '#00A63E'] as const,
    orange: ['#FF6900', '#E85E00'] as const,
    pink: ['#F472B6', '#EC4899'] as const,
  },
};

export const FONTS = {
  regular: { fontWeight: '400' as const },
  medium: { fontWeight: '500' as const },
  semiBold: { fontWeight: '600' as const },
  bold: { fontWeight: '700' as const },
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const HEADER_TOP_EXTRA = 13;

export const SHADOW = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
};
