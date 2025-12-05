import { useState, useEffect } from 'react';

// ============================================================================
// TYPES
// ============================================================================
export interface ThemeColors {
  // UI Colors
  uiBgPrimary: string;
  uiBgSecondary: string;
  uiTextPrimary: string;
  uiTextSecondary: string;
  uiAccent: string;
  uiBorder: string;
  
  // 3D Environment Colors
  skyColor: string;
  ambientLightIntensity: number;
  directionalLightIntensity: number;
  fogColor: string;
  fogDensity: number;
  
  // Room Colors
  roomMainFloor: string;
  roomMainWall: string;
  roomDiceFloor: string;
  roomDiceWall: string;
  roomBasketballFloor: string;
  roomBasketballWall: string;
  roomSimonFloor: string;
  roomSimonWall: string;
  roomPurpleFloor: string;
  roomPurpleWall: string;
  
  // Game Element Colors
  hoopColor: string;
  basketballColor: string;
  diceColor: string;
  simonButtonBase: string;
  simonButtonLit: string[];
}

// ============================================================================
// THEME CONFIGURATIONS
// ============================================================================
const LIGHT_THEME: ThemeColors = {
  // UI Colors
  uiBgPrimary: '#ffffff',
  uiBgSecondary: '#f8f9fa',
  uiTextPrimary: '#212529',
  uiTextSecondary: '#6c757d',
  uiAccent: '#4a90e2',
  uiBorder: '#dee2e6',
  
  // 3D Environment
  skyColor: '#87ceeb',
  ambientLightIntensity: 0.8,
  directionalLightIntensity: 1.0,
  fogColor: '#cccccc',
  fogDensity: 0.001,
  
  // Room Colors (brighter)
  roomMainFloor: '#777788',
  roomMainWall: '#666677',
  roomDiceFloor: '#996666',
  roomDiceWall: '#774444',
  roomBasketballFloor: '#669999',
  roomBasketballWall: '#557777',
  roomSimonFloor: '#999966',
  roomSimonWall: '#777744',
  roomPurpleFloor: '#775599',
  roomPurpleWall: '#664477',
  
  // Game Elements
  hoopColor: '#ff7700',
  basketballColor: '#ff5500',
  diceColor: '#cc0000',
  simonButtonBase: '#333333',
  simonButtonLit: ['#ff4444', '#ffff44', '#44ff44', '#4444ff', '#ff44ff'],
};

const DARK_THEME: ThemeColors = {
  // UI Colors
  uiBgPrimary: '#121212',
  uiBgSecondary: '#1e1e1e',
  uiTextPrimary: '#f8f9fa',
  uiTextSecondary: '#adb5bd',
  uiAccent: '#64b5f6',
  uiBorder: '#495057',
  
  // 3D Environment (darker, moody)
  skyColor: '#1a2a3a',
  ambientLightIntensity: 0.4,
  directionalLightIntensity: 0.7,
  fogColor: '#222222',
  fogDensity: 0.003,
  
  // Room Colors (darker, saturated)
  roomMainFloor: '#444455',
  roomMainWall: '#333344',
  roomDiceFloor: '#663333',
  roomDiceWall: '#552222',
  roomBasketballFloor: '#336666',
  roomBasketballWall: '#225555',
  roomSimonFloor: '#666633',
  roomSimonWall: '#555522',
  roomPurpleFloor: '#553377',
  roomPurpleWall: '#442266',
  
  // Game Elements (vibrant)
  hoopColor: '#ff9900',
  basketballColor: '#ff6600',
  diceColor: '#ff2222',
  simonButtonBase: '#222222',
  simonButtonLit: ['#ff6666', '#ffff66', '#66ff66', '#6666ff', '#ff66ff'],
};

// ============================================================================
// THEME HOOK
// ============================================================================
export function useTheme() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const [isDarkMode, setIsDarkMode] = useState(prefersDark);
  const [theme, setTheme] = useState<ThemeColors>(prefersDark ? DARK_THEME : LIGHT_THEME);

  // Detect system preference
  useEffect(() => {
    const updateCSSVars = (themeColors: ThemeColors) => {
      const root = document.documentElement;
      
      // UI Colors
      root.style.setProperty('--ui-bg-primary', themeColors.uiBgPrimary);
      root.style.setProperty('--ui-bg-secondary', themeColors.uiBgSecondary);
      root.style.setProperty('--ui-text-primary', themeColors.uiTextPrimary);
      root.style.setProperty('--ui-text-secondary', themeColors.uiTextSecondary);
      root.style.setProperty('--ui-accent', themeColors.uiAccent);
      root.style.setProperty('--ui-border', themeColors.uiBorder);
      
      // Shadows adjust based on theme
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) {
        root.style.setProperty('--ui-shadow-sm', '0 2px 4px rgba(0, 0, 0, 0.4)');
        root.style.setProperty('--ui-shadow-md', '0 4px 8px rgba(0, 0, 0, 0.5)');
        root.style.setProperty('--ui-shadow-lg', '0 8px 16px rgba(0, 0, 0, 0.6)');
        root.style.setProperty('--ui-panel-bg', 'rgba(30, 30, 30, 0.95)');
        root.style.setProperty('--ui-panel-border', 'rgba(255, 255, 255, 0.1)');
      } else {
        root.style.setProperty('--ui-shadow-sm', '0 2px 4px rgba(0, 0, 0, 0.1)');
        root.style.setProperty('--ui-shadow-md', '0 4px 8px rgba(0, 0, 0, 0.15)');
        root.style.setProperty('--ui-shadow-lg', '0 8px 16px rgba(0, 0, 0, 0.2)');
        root.style.setProperty('--ui-panel-bg', 'rgba(255, 255, 255, 0.95)');
        root.style.setProperty('--ui-panel-border', 'rgba(0, 0, 0, 0.1)');
      }
    };
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
      setTheme(e.matches ? DARK_THEME : LIGHT_THEME);
      
      // Update CSS variables
      updateCSSVars(e.matches ? DARK_THEME : LIGHT_THEME);
    };
    
    // Initial setup
    updateCSSVars(theme);
    
    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [theme]);

  return {
    isDarkMode,
    theme,
    colors: theme,
  };
}