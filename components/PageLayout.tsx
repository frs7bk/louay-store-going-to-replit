import React from 'react';

interface PageLayoutProps {
  children: React.ReactNode;
  useContainer?: boolean;
}

export const PageLayout: React.FC<PageLayoutProps> = ({ children, useContainer = true }) => {
  const backgroundAndTransitionClasses = "bg-gumball-light-bg dark:bg-gumball-dark-deep transition-colors duration-300";
  // The main element that PageLayout renders should be a flex item and fill available space,
  // and it's responsible for the overall page background.
  const mainWrapperClasses = `flex-1 w-full ${backgroundAndTransitionClasses}`;

  if (useContainer) {
    // If using a container, the main wrapper provides the background and flex behavior.
    // An inner div handles the container (centering, max-width) and padding.
    return (
      <main className={mainWrapperClasses}>
        <div className="container mx-auto px-4 py-8">
          {children}
        </div>
      </main>
    );
  }

  // If not using a container (e.g., AdminPanelPage, LoginPage),
  // the main wrapper still provides the background and flex behavior.
  // The child component is expected to manage its own layout and padding.
  return (
    <main className={mainWrapperClasses}>
       {children}
    </main>
  );
};