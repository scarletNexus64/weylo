import React from 'react';
import './PremiumBadge.css';

const PremiumBadge = ({ size = 'medium', showTooltip = true }) => {
  const sizeClass = `premium-badge-${size}`;

  return (
    <div className={`premium-badge ${sizeClass}`} title={showTooltip ? "Compte vérifié Premium" : ""}>
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="premium-badge-icon"
      >
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    </div>
  );
};

export default PremiumBadge;
