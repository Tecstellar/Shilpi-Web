import React from 'react';

interface ShilpiEditVectorIconProps {
  color?: string;
  size?: number;
  className?: string;
}

/**
 * Official Shilpi Vector Edit Icon
 * Precision matched to the user's uploaded edit vector spec:
 * - Square outer frame with rounded corners and a 45-degree top-right cutout
 * - Diagonal stylus shaft cutting through the frame gap
 * - L-shaped nib with an inward curved arc in the bottom-left
 * - Rounded dome cap at the top-right
 */
export const ShilpiEditVectorIcon: React.FC<ShilpiEditVectorIconProps> = ({
  color = '#e8276b',
  size = 18,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* 1. Outer Frame with 45-degree top-right opening */}
      <path
        d="M 12 0 L 58.7 0 L 45.1 13.6 L 13.6 13.6 L 13.6 86.4 L 86.4 86.4 L 86.4 54.9 L 100 41.3 L 100 88 A 12 12 0 0 1 88 100 L 12 100 A 12 12 0 0 1 0 88 L 0 12 A 12 12 0 0 1 12 0 Z"
        fill={color}
      />
      {/* 2. Pencil Nib pointing to bottom-left */}
      <path
        d="M 22.7 58.5 L 22.7 77.3 L 41.5 77.3 A 24 24 0 0 0 22.7 58.5 Z"
        fill={color}
      />
      {/* 3. Diagonal Pencil Shaft */}
      <path
        d="M 30.2 51.7 L 70.2 11.7 A 15.5 15.5 0 0 1 88.2 29.7 L 48.4 69.5 A 15.5 15.5 0 0 0 30.2 51.7 Z"
        fill={color}
      />
      {/* 4. Rounded Pencil Cap */}
      <path
        d="M 75.6 6.4 A 15.5 15.5 0 0 1 93.6 24.4 A 12.8 12.8 0 0 0 75.6 6.4 Z"
        fill={color}
      />
    </svg>
  );
};

export default ShilpiEditVectorIcon;
