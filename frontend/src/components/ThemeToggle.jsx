import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

 
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className="relative w-14 h-7 rounded-full border border-surface-border
                 bg-surface transition-all duration-300 flex items-center px-1
                 hover:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
    >
     
      <span
        className={`w-5 h-5 rounded-full flex items-center justify-center
                    transition-all duration-300 shadow-md
                    ${isDark
                      ? 'translate-x-0 bg-slate-600'
                      : 'translate-x-7 bg-brand-500'
                    }`}
      >
        {isDark
          ? <Moon size={11} className="text-slate-200" />
          : <Sun  size={11} className="text-white" />
        }
      </span>

      {/* Background icons (decorative) */}
      <Sun  size={11} className={`absolute right-1.5 transition-opacity duration-300
                                  ${isDark ? 'opacity-30' : 'opacity-0'} text-slate-400`} />
      <Moon size={11} className={`absolute left-1.5  transition-opacity duration-300
                                  ${isDark ? 'opacity-0' : 'opacity-30'} text-slate-400`} />
    </button>
  );
}
