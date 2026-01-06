import React from 'react';

interface ModalProps {
  isVisible: boolean;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isVisible, children }) => {
  return (
    <div className={`modal ${isVisible ? 'modal-visible' : ''}`}>
      <div className="modal-content">
        {children}
      </div>
    </div>
  );
};

export default Modal;

