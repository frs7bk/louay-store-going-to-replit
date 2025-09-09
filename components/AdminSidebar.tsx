import React, { useContext } from 'react'; 
import { useNavigate } from 'react-router-dom';
import { AdminSection } from '../types';
import { AuthContext } from '../App'; 
import { Button } from './Button'; 
import { useI18n } from '../hooks/useI18n';

// Custom SVGs for collapse/expand toggle
const ChevronDoubleLeftIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5 sm:w-6 sm:h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
  </svg>
);
const ChevronDoubleRightIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5 sm:w-6 sm:h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
  </svg>
);

interface AdminSidebarProps {
  sections: AdminSection[];
  activeSection: string;
  onSelectSection: (sectionId: string) => void;
  isMobileOpen: boolean; // For mobile slide-in/out
  isDesktop: boolean; // True if viewport is md or wider
  isDesktopCollapsed: boolean; // True if sidebar is collapsed on desktop
  onToggleDesktopCollapse: () => void; // Function to toggle desktop collapse
}

const LogoutIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
</svg>
);


export const AdminSidebar: React.FC<AdminSidebarProps> = ({ 
  sections, 
  activeSection, 
  onSelectSection,
  isMobileOpen,
  isDesktop,
  isDesktopCollapsed,
  onToggleDesktopCollapse,
}) => {
  const authCtx = useContext(AuthContext);
  const navigate = useNavigate();
  const { t } = useI18n();

  const handleLogout = () => {
    if (authCtx) {
      authCtx.logoutAdmin();
      navigate('/login'); 
    }
  };

  // Determine if text labels should be shown
  // On mobile: always show if open.
  // On desktop: show if not collapsed.
  const showTextLabels = !isDesktop ? isMobileOpen : !isDesktopCollapsed;

  const sidebarWidthClass = isDesktop ? (isDesktopCollapsed ? 'md:w-20' : 'md:w-72') : (isMobileOpen ? 'w-72' : 'w-0');
  const sidebarTranslateClass = !isDesktop ? (isMobileOpen ? 'translate-x-0 rtl:-translate-x-0' : '-translate-x-full rtl:translate-x-full') : 'md:translate-x-0';


  return (
    <aside 
      id="admin-sidebar"
      className={`fixed top-20 ltr:left-0 rtl:right-0 bottom-0 z-40 bg-gumball-dark text-white p-4 sm:p-6 space-y-4 ltr:rounded-r-xl rtl:rounded-l-xl shadow-lg 
                 dark:bg-gray-900 dark:text-gray-200 flex flex-col justify-between overflow-y-auto
                 transition-all duration-300 ease-in-out
                 ${sidebarWidthClass}
                 ${sidebarTranslateClass}
                 md:static md:h-auto md:min-h-[calc(100vh-5rem)]`}
      aria-label={t('adminMenu')}
    >
      <div>
        <div className="flex items-center justify-between mb-4 sm:mb-6 border-b-2 border-gumball-yellow pb-2">
          <h2 className={`font-display text-2xl sm:text-3xl text-gumball-yellow overflow-hidden whitespace-nowrap ${!showTextLabels && isDesktop ? 'text-center w-full' : ''}`}>
            {showTextLabels ? t('adminMenu') : t('appName').substring(0,3).toUpperCase()}
          </h2>
          {isDesktop && ( // Only show collapse/expand button on desktop
            <Button
                onClick={onToggleDesktopCollapse}
                variant="ghost"
                className="text-white hover:bg-gumball-purple/70 p-1.5 sm:p-2"
                aria-label={isDesktopCollapsed ? t('expandSidebar') : t('collapseSidebar')}
                title={isDesktopCollapsed ? t('expandSidebar') : t('collapseSidebar')}
            >
                {isDesktopCollapsed ? <ChevronDoubleRightIcon className="w-4 h-4 sm:w-5 sm:h-5"/> : <ChevronDoubleLeftIcon className="w-4 h-4 sm:w-5 sm:h-5"/>}
            </Button>
          )}
        </div>
        <nav>
          <ul>
            {sections.map((section) => (
              <li key={section.id} className="mb-1 sm:mb-2">
                <button
                  onClick={() => onSelectSection(section.id)}
                  title={!showTextLabels ? section.name : undefined}
                  className={`w-full flex items-center px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg font-techno text-base sm:text-lg transition-all duration-200
                    ${activeSection === section.id 
                      ? 'bg-gumball-yellow text-gumball-dark shadow-md scale-105 dark:text-gumball-dark-deep' 
                      : 'text-white hover:bg-gumball-purple hover:text-gumball-yellow dark:text-gray-200 dark:hover:bg-gumball-purple/70 dark:hover:text-gumball-yellow'
                    }
                    ${!showTextLabels && isDesktop ? 'justify-center' : ''}`}
                >
                  {section.icon && React.cloneElement(section.icon as React.ReactElement<{ className?: string }>, { 
                    className: `w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 ${!showTextLabels && isDesktop ? 'm-0' : 'ltr:mr-2 rtl:ml-2 sm:ltr:mr-3 sm:rtl:ml-3'}` 
                  })}
                  {showTextLabels && <span className="truncate">{section.name}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      
      <div className="mt-auto pt-4 space-y-2 border-t border-gumball-yellow/30">
        {authCtx?.isAdminAuthenticated && (
            <Button
                onClick={handleLogout}
                variant="ghost" 
                size="sm" 
                className={`w-full font-techno text-sm flex items-center 
                           text-red-400 hover:text-red-300 dark:text-red-500 dark:hover:text-red-400
                           hover:bg-red-500/10 dark:hover:bg-red-500/20
                           ${!showTextLabels && isDesktop ? 'justify-center p-2' : 'justify-start'}`}
                title={!showTextLabels ? t('logout') : undefined}
            >
                <LogoutIcon className={`flex-shrink-0 ${!showTextLabels && isDesktop ? 'w-5 h-5' : 'w-5 h-5 ltr:mr-2 rtl:ml-2'}`} /> 
                {showTextLabels && <span>{t('logout')}</span>}
            </Button>
        )}
      </div>
    </aside>
  );
};