import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

const Logo: React.FC<LogoProps> = ({ className = "text-stone-100", size = 24 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* The Spark (AI/Insight) */}
      <path 
        d="M12 2L13.5 5.5L17 7L13.5 8.5L12 12L10.5 8.5L7 7L10.5 5.5L12 2Z" 
        fill="currentColor" 
        className="text-amber-500"
      />
      
      {/* The Stem (Growth/Support) */}
      <path 
        d="M12 22V12" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
      
      {/* The Psi/Leaves (Mind/Soul) */}
      <path 
        d="M7 14C7 10 9.5 8 12 8C14.5 8 17 10 17 14" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
    </svg>
  );
};

export default Logo;