import React from 'react'
import './CssPages/StarRating.css'




const StarRating = ({ rating = 0, size = 'medium', animated = false, interactive = false, onRate}) => {
  const sizeClass = `star-rating-${size}`;
  const animatedClass = animated ? 'star-rating-animated' : '';
  const interactiveClass = interactive ? 'star-rating-interactive' : '';

  const handleStarClick = (index) => {
    if (interactive && onRate) {
      onRate(index + 1);
    }
  };

  return (
    <div className={`star-rating-container ${sizeClass} ${animatedClass} ${interactiveClass}`}>
      <div className="star-rating-stars">
        {[...Array(5)].map((_, i) => {
          const fillPercentage = Math.min(Math.max(rating - i, 0), 1);
          return (
            <div 
              key={i} 
              className="star-rating-item"
              style={{ '--star-index': i }}
              onClick={() => handleStarClick(i)}
            >
              <span className="star-rating-empty">★</span>
              <span 
                className="star-rating-filled"
                style={{ width: `${fillPercentage * 100}%` }}
              >
                ★
              </span>
            </div>
          );
        })}
      </div>
      <span className="star-rating-value">
        {rating.toFixed(1)}
      </span>
    </div>
  );
};

export default StarRating