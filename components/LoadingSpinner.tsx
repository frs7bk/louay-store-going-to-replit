import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string; // Tailwind color class e.g., 'text-gumball-blue'
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = 'text-gumball-blue',
  message 
}) => {
  let sizeClasses = '';
  switch (size) {
    case 'sm':
      sizeClasses = 'h-6 w-6';
      break;
    case 'md':
      sizeClasses = 'h-12 w-12';
      break;
    case 'lg':
      sizeClasses = 'h-20 w-20';
      break;
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <svg 
        className={`animate-spin ${sizeClasses} ${color}`} 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24"
      >
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        ></circle>
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      {message && <p className={`mt-3 text-lg font-semibold ${color}`}>{message}</p>}
    </div>
  );
};
