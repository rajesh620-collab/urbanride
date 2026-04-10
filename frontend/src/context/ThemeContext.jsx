import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches || false;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'bright');
    localStorage.setItem('theme', dark ? 'dark' : 'bright');
  }, [dark]);

  const toggle = () => {
    document.documentElement.classList.add('theme-transitioning');
    setDark(d => !d);
    
    // Remove the class after the transition duration
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 500); // 500ms to be safe (matching or exceeding the CSS duration)
  };

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
