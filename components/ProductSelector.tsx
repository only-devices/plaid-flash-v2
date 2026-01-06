import React from 'react';
import { ProductConfig } from '@/lib/productConfig';

interface ProductSelectorProps {
  products: ProductConfig[];
  onSelect: (productId: string) => void;
  onBack?: () => void;
  showBackButton?: boolean;
  onSettingsClick?: () => void;
  hasCustomSettings?: boolean;
  title?: string;
  onResetClick?: () => void;
}

const ProductSelector: React.FC<ProductSelectorProps> = ({ 
  products, 
  onSelect, 
  onBack, 
  showBackButton,
  onSettingsClick,
  hasCustomSettings = false,
  title = 'Choose Your Own Adventure',
  onResetClick
}) => {
  return (
    <div className="product-selector">
      {showBackButton && onBack && (
        <button className="back-button" onClick={onBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g transform="rotate(45 12 12)">
              <path d="M17 7L7 17M7 17V7M7 17H17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </g>
          </svg>
        </button>
      )}
      {onSettingsClick && (
        <button className="settings-gear-button" onClick={onSettingsClick}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {hasCustomSettings && (
            <span className="settings-indicator"></span>
          )}
        </button>
      )}
      {onResetClick && (
        <button className="settings-gear-button" onClick={onResetClick} title="Reset Session" style={{ background: 'linear-gradient(135deg, #c7659f 0%, #c43d52 100%)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2" />
          </svg>
        </button>
      )}
      <h2 className="product-selector-title">{title}</h2>
      <p className="product-selector-subtitle"></p>
      <div className="product-grid">
        {products.map((product) => (
          <button
            key={product.id}
            className={`product-card ${product.icon ? 'has-icon' : ''}`}
            onClick={() => onSelect(product.id)}
            style={{ background: product.gradient }}
          >
            {product.icon && (
              <div className="product-card-icon">
                <img src={product.icon} alt={`${product.name} icon`} />
              </div>
            )}
            <div className="product-card-arrow">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g transform="rotate(45 12 12)">
                <path d="M7 17L17 7M17 7H7M17 7V17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </g>
            </svg>
            </div>
            <h3 className="product-card-name">{product.shortName || product.name}</h3>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProductSelector;

