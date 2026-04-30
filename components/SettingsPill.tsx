import React from 'react';

interface SettingsPillProps {
  label: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  tooltip?: string;
}

/**
 * Boolean-toggle styled as a wizard pill (multi-line text variant).
 * Reuses `.wizard-pill` / `.wizard-pill--selected` / `.wizard-pill__check`
 * classes from globals.css so the Settings cards visually match the
 * Configuration Wizard.
 */
const SettingsPill: React.FC<SettingsPillProps> = ({
  label,
  checked,
  onChange,
  disabled = false,
  tooltip,
}) => {
  const className = [
    'wizard-pill',
    'wizard-pill--wrap',
    checked ? 'wizard-pill--selected' : '',
    disabled ? 'wizard-pill--disabled' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const defaultTooltip = disabled ? 'Incompatible with other settings' : undefined;
  const displayTooltip = tooltip ?? defaultTooltip;

  return (
    <button
      type="button"
      className={className}
      onClick={() => !disabled && onChange()}
      disabled={disabled}
      title={displayTooltip}
      aria-pressed={checked}
    >
      <span
        className={`wizard-pill__check ${checked ? 'wizard-pill__check--on' : ''}`}
        aria-hidden="true"
      >
        {checked && (
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </span>
      <span className="wizard-pill__label">{label}</span>
    </button>
  );
};

export default SettingsPill;
