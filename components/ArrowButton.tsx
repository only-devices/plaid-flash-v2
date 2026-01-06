interface ArrowButtonProps {
  onClick: () => void;
  variant?: 'blue' | 'red' | 'purple' | 'green';
  direction?: 'forward' | 'back';
  children?: React.ReactNode;
}

export default function ArrowButton({ 
  onClick, 
  variant = 'blue', 
  direction = 'forward',
  children 
}: ArrowButtonProps) {
  return (
    <button 
      className={`arrow-button arrow-button-${variant} arrow-button-${direction}`}
      onClick={onClick}
    >
      {direction === 'back' ? (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g transform="rotate(45 12 12)">
            <path d="M17 7L7 17M7 17V7M7 17H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </g>
        </svg>
      ) : (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g transform="rotate(45 12 12)">
            <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </g>
        </svg>
      )}
      {children && <span className="arrow-button-text">{children}</span>}
    </button>
  );
}


