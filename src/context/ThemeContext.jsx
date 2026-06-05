import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Busca o tema salvo ou define 'light' como padrão
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('app-theme') || 'light';
  });

  // Aplica o tema na raiz do HTML e salva no navegador
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook para usar nos componentes
export const useTheme = () => useContext(ThemeContext);