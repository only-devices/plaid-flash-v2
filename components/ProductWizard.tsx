import React from 'react';

export interface WizardPill {
  id: string;
  label: string;
  selected?: boolean;
  disabled?: boolean;
  disabledReason?: string;
}

export interface WizardSubgroup {
  id: string;
  name: string;
  pills: WizardPill[];
}

export interface WizardCard {
  id: string;
  name: string;
  icon?: string;
  /** Direct leaf children of this card (rendered as plain pills, no subgroup label). */
  pills: WizardPill[];
  /** Subcategory groups whose children are leaves (each rendered with its name as a label). */
  subgroups: WizardSubgroup[];
  /**
   * Plain pills rendered after the subgroups, anchored to the bottom of the card.
   * Used for special-case affordances like CRA's Upgrade Mode that don't belong
   * to any subgroup but should sit below the structured product list.
   */
  bottomPills?: WizardPill[];
}

export type WizardMode = 'select' | 'pick';

interface ProductWizardProps {
  cards: WizardCard[];
  mode: WizardMode;
  title?: string;
  subtitle?: string;
  onPillClick: (leafId: string) => void;
  onContinue?: () => void;
  continueDisabled?: boolean;
  continueLabel?: string;
  onSettingsClick?: () => void;
  hasCustomSettings?: boolean;
  onResetClick?: () => void;
}

const ProductWizard: React.FC<ProductWizardProps> = ({
  cards,
  mode,
  title,
  subtitle,
  onPillClick,
  onContinue,
  continueDisabled,
  continueLabel,
  onSettingsClick,
  hasCustomSettings = false,
  onResetClick,
}) => {
  const resolvedTitle =
    title ?? (mode === 'select' ? 'Choose your products' : 'Pick a product to test');
  const resolvedSubtitle =
    subtitle ??
    (mode === 'select'
      ? 'Select every product you want to include in this session, then continue.'
      : 'Click any pill below to call its API.');

  return (
    <div className="product-wizard">
      {onSettingsClick && (
        <button
          type="button"
          className="settings-gear-button"
          onClick={onSettingsClick}
          aria-label="Open settings"
          title="Settings"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 15a3 3 0 100-6 3 3 0 000 6z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {hasCustomSettings && <span className="settings-indicator" />}
        </button>
      )}
      {onResetClick && (
        <button
          type="button"
          className="settings-gear-button icon-button-red"
          onClick={onResetClick}
          aria-label="Reset session"
          title="Reset Session"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2" />
          </svg>
        </button>
      )}

      <div className="product-wizard-header">
        <h2 className="product-wizard-title">{resolvedTitle}</h2>
        {resolvedSubtitle && <p className="product-wizard-subtitle">{resolvedSubtitle}</p>}
      </div>

      <div className="wizard-grid">
        {cards.map((card) => {
          const renderPill = (pill: WizardPill) => {
            const isSelected = mode === 'select' && !!pill.selected;
            const isDisabled = !!pill.disabled;
            const className = [
              'wizard-pill',
              isSelected ? 'wizard-pill--selected' : '',
              isDisabled ? 'wizard-pill--disabled' : '',
              mode === 'pick' ? 'wizard-pill--clickable' : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <button
                type="button"
                key={pill.id}
                className={className}
                onClick={() => !isDisabled && onPillClick(pill.id)}
                disabled={isDisabled}
                title={isDisabled ? pill.disabledReason : undefined}
                aria-pressed={mode === 'select' ? isSelected : undefined}
              >
                {mode === 'select' && (
                  <span
                    className={`wizard-pill__check ${isSelected ? 'wizard-pill__check--on' : ''}`}
                    aria-hidden="true"
                  >
                    {isSelected && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>
                )}
                <span className="wizard-pill__label">{pill.label}</span>
              </button>
            );
          };

          return (
            <section className="wizard-card" key={card.id} aria-label={card.name}>
              <header className="wizard-card-header">
                {card.icon && (
                  <span className="wizard-card-icon" aria-hidden="true">
                    <img src={card.icon} alt="" />
                  </span>
                )}
                <h3 className="wizard-card-title">{card.name}</h3>
              </header>
              <div className="wizard-card-body">
                {card.pills.length > 0 && (
                  <div className="wizard-pills" role={mode === 'select' ? 'group' : 'list'}>
                    {card.pills.map(renderPill)}
                  </div>
                )}
                {card.subgroups.map((sg) => (
                  <div className="wizard-subgroup" key={sg.id}>
                    <div className="wizard-subgroup-label">{sg.name}</div>
                    <div className="wizard-pills" role={mode === 'select' ? 'group' : 'list'}>
                      {sg.pills.map(renderPill)}
                    </div>
                  </div>
                ))}
                {card.bottomPills && card.bottomPills.length > 0 && (
                  <div className="wizard-pills wizard-pills--bottom" role={mode === 'select' ? 'group' : 'list'}>
                    {card.bottomPills.map(renderPill)}
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {mode === 'select' && onContinue && (
        <div className="wizard-cta-row">
          <button
            type="button"
            className="action-button button-blue wizard-continue-button"
            onClick={onContinue}
            disabled={continueDisabled}
          >
            {continueLabel ?? 'Start'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductWizard;
