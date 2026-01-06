import React from 'react';

interface LinkButtonProps {
  onClick: () => void;
  isVisible: boolean;
}

const LinkButton: React.FC<LinkButtonProps> = ({ onClick, isVisible }) => {
  return (
    <button 
      className={`link-button ${isVisible ? 'visible' : 'hidden'}`}
      onClick={onClick}
    >
    ⚡️ Let's Go
    </button>
  );
};

export default LinkButton;

