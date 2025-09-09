


import React, { useState, useContext, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NAV_LINKS } from '../constants';
import { CartContext, ThemeContext } from '../App';
import { useI18n } from '../hooks/useI18n';
import { LanguageSwitcher } from './LanguageSwitcher';
import { toast } from 'react-toastify';


const ThemeToggleButton: React.FC = () => {
  const themeCtx = useContext(ThemeContext);
  const { t } = useI18n();
  if (!themeCtx) return null;

  return (
    <button
      onClick={themeCtx.toggleTheme}
      className="p-2 rounded-full text-white hover:bg-gumball-yellow/20 dark:hover:bg-gumball-yellow/30 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gumball-yellow"
      aria-label={themeCtx.theme === 'light' ? t('switchToDarkMode') : t('switchToLightMode')}
    >
      {themeCtx.theme === 'light' ? (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 008.25-4.502Z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0Z" />
        </svg>
      )}
    </button>
  );
};

const CartIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.658-.463 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>
);


export const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdminLinkVisible, setIsAdminLinkVisible] = useState(false);
  const location = useLocation();
  const { t } = useI18n();
  const cartContext = useContext(CartContext);
  const itemCount = cartContext?.cart.reduce((sum, item) => sum + item.quantity, 0) || 0;
  
  const [animateCart, setAnimateCart] = useState(false);
  const prevItemCountRef = useRef(itemCount);

  // Effect for periodic bounce to attract attention
  useEffect(() => {
    if (itemCount > 0) {
      const bounceInterval = setInterval(() => {
        setAnimateCart(true);
      }, 10000); // Every 10 seconds
      return () => clearInterval(bounceInterval);
    }
  }, [itemCount]);

  // Effect for bounce when a new item is added
  useEffect(() => {
    if (itemCount > prevItemCountRef.current) {
      setAnimateCart(true);
    }
    prevItemCountRef.current = itemCount;
  }, [itemCount]);

  // Effect to reset animation state after it runs
  useEffect(() => {
    if (animateCart) {
      const timer = setTimeout(() => setAnimateCart(false), 600); // Corresponds to bounceOnce animation duration
      return () => clearTimeout(timer);
    }
  }, [animateCart]);


  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && (event.key === 'a' || event.key === 'A')) {
        event.preventDefault();
        setIsAdminLinkVisible(currentVisibility => {
            if (!currentVisibility) {
                toast.info(t('adminLinkShown'));
            }
            return true;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [t]);


  return (
    <nav className="bg-gumball-blue shadow-lg sticky top-0 z-50 dark:bg-gumball-blue/90"> {/* Increased z-index to z-50 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center min-w-0 me-2"> {/* Allow shrinking and add small margin */}
            <Link to="/" className="group overflow-hidden md:overflow-visible"> {/* Allow content to be hidden if needed for truncate */}
              <span className="font-display text-xl xxs:text-2xl sm:text-3xl text-white group-hover:text-gumball-yellow transition-colors duration-300 group-hover:animate-wiggleSoft inline-block truncate md:whitespace-normal md:overflow-visible">
                {/* Responsive font size, truncate for small, allow wrap and visibility for medium+ */}
                {t('appName')}
              </span>
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-center gap-x-6">
              {NAV_LINKS.map((link) => {
                if (link.nameKey === 'navAdminPanel' && !isAdminLinkVisible) {
                    return null;
                }
                const isCartLink = link.nameKey === 'navCart';
                return (
                    <Link
                    key={link.nameKey}
                    to={link.path}
                    className={`relative px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 ease-in-out transform hover:scale-110
                        ${location.pathname === link.path 
                        ? 'bg-gumball-yellow text-gumball-dark shadow-inner ring-2 ring-gumball-pink/70 dark:text-gumball-dark' 
                        : 'text-white hover:bg-gumball-purple hover:text-white dark:hover:bg-gumball-purple/80'
                        }`}
                    >
                      {t(link.nameKey)}
                      {isCartLink && itemCount > 0 && (
                        <span className={`absolute -top-2 -right-2 bg-gumball-pink text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center ${animateCart ? 'animate-bounceOnce' : ''}`}>
                          {itemCount}
                        </span>
                      )}
                    </Link>
                );
              })}
            </div>
          </div>
          <div className="hidden md:flex items-center gap-x-4 flex-shrink-0"> {/* Ensure icons don't shrink */}
             <LanguageSwitcher />
             <ThemeToggleButton />
          </div>
          <div className="-me-2 flex md:hidden items-center flex-shrink-0 gap-x-2"> {/* Ensure icons don't shrink */}
            <LanguageSwitcher />
            <ThemeToggleButton />
             <Link 
                to="/cart" 
                className="relative p-2 rounded-full text-white hover:bg-gumball-yellow/20 dark:hover:bg-gumball-yellow/30 transition-colors focus:outline-none focus:ring-2 focus:ring-gumball-yellow"
                aria-label={t('navCart')}
              >
              <CartIcon className="h-6 w-6"/>
              {itemCount > 0 && (
                  <span className={`absolute top-0 right-0 bg-gumball-pink text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center ${animateCart ? 'animate-bounceOnce' : ''}`}>
                      {itemCount}
                  </span>
              )}
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              type="button"
              className="ms-1 bg-gumball-purple p-2 inline-flex items-center justify-center rounded-md text-white hover:bg-gumball-pink focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">{t('openMainMenu')}</span>
              {!isMobileMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 animate-fadeIn">
            {NAV_LINKS.filter(link => link.nameKey !== 'navCart').map((link) => {
              if (link.nameKey === 'navAdminPanel' && !isAdminLinkVisible) {
                  return null;
              }
              return (
              <Link
                key={link.nameKey}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-300 text-center
                  ${location.pathname === link.path 
                    ? 'bg-gumball-yellow text-gumball-dark ring-2 ring-gumball-pink/70 dark:text-gumball-dark' 
                    : 'text-white hover:bg-gumball-purple hover:text-white dark:hover:bg-gumball-purple/80'
                  }`}
              >
                {t(link.nameKey)}
              </Link>
            )})}
          </div>
        </div>
      )}
    </nav>
  );
};
