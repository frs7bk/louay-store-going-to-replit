import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  let sizeClass = 'max-w-md'; // Default md
  switch (size) {
    case 'sm': sizeClass = 'max-w-sm'; break;
    case 'lg': sizeClass = 'max-w-lg'; break;
    case 'xl': sizeClass = 'max-w-xl'; break;
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className={`bg-white dark:bg-gumball-dark-card rounded-xl shadow-2xl p-6 m-4 ${sizeClass} w-full transform transition-all duration-300 ease-out animate-bounceOnce relative`}
        onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking inside
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 dark:text-gray-400 hover:text-gumball-pink dark:hover:text-gumball-pink transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gumball-dark"
          aria-label="Close modal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {title && (
          <h2 className="text-2xl font-display text-gumball-blue dark:text-gumball-blue/90 mb-4 text-center">{title}</h2>
        )}
        <div className="font-body text-gumball-dark dark:text-gumball-light-bg/90">
          {children}
        </div>
      </div>
    </div>
  );
};