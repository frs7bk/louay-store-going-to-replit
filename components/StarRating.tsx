import React, { useState } from 'react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  starSize?: string; // e.g., 'w-5 h-5'
  className?: string;
  interactive?: false; // Explicitly non-interactive for this component
}

interface InteractiveStarRatingProps {
  rating: number;
  setRating: (rating: number) => void;
  maxRating?: number;
  starSize?: string; // e.g., 'w-7 h-7'
  className?: string;
  interactive: true; // Explicitly interactive
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  starSize = 'w-5 h-5',
  className = '',
}) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.4 ? 1 : 0; // Adjusted threshold for half star
  const emptyStars = maxRating - fullStars - halfStar;

  return (
    <div className={`flex items-center ${className}`} aria-label={`Rating: ${rating.toFixed(1)} out of ${maxRating}`}>
      {[...Array(fullStars)].map((_, i) => (
        <svg key={`full-${i}`} className={`${starSize} text-gumball-yellow fill-current`} viewBox="0 0 24 24">
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      ))}
      {halfStar === 1 && (
        <svg key="half" className={`${starSize} text-gumball-yellow fill-current`} viewBox="0 0 24 24">
          <path d="M12 15.4V6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z" /> {/* Simplified half star path */}
        </svg>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <svg key={`empty-${i}`} className={`${starSize} text-gray-300 dark:text-gray-500 fill-current`} viewBox="0 0 24 24">
          <path d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z" />
        </svg>
      ))}
    </div>
  );
};


export const InteractiveStarRating: React.FC<InteractiveStarRatingProps> = ({
  rating,
  setRating,
  maxRating = 5,
  starSize = 'w-7 h-7',
  className = '',
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {[...Array(maxRating)].map((_, index) => {
        const starValue = index + 1;
        return (
          <button
            type="button"
            key={starValue}
            className={`p-1 rounded-full focus:outline-none transition-transform duration-150 ease-in-out hover:scale-110
                       ${(hoverRating || rating) >= starValue ? 'text-gumball-yellow' : 'text-gray-300 dark:text-gray-500'}`}
            onClick={() => setRating(starValue)}
            onMouseEnter={() => setHoverRating(starValue)}
            onMouseLeave={() => setHoverRating(0)}
            aria-label={`Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
          >
            <svg className={`${starSize} fill-current`} viewBox="0 0 24 24">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
};