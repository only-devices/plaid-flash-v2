/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProductSelector from '@/components/ProductSelector';
import { ProductConfig } from '@/lib/productConfig';

const mockProducts: ProductConfig[] = [
  {
    id: 'auth',
    name: 'Auth',
    shortName: 'Auth',
    products: ['auth'],
    required_if_supported: [],
    gradient: 'linear-gradient(135deg, #4a5fc1 0%, #5a3d7a 100%)',
    icon: '/icons/auth.png',
  },
  {
    id: 'transactions',
    name: 'Transactions',
    products: ['transactions'],
    required_if_supported: [],
    gradient: 'linear-gradient(135deg, #2d9b83 0%, #1a6b5c 100%)',
  },
  {
    id: 'identity',
    name: 'Identity',
    shortName: 'ID',
    products: ['identity'],
    required_if_supported: [],
    gradient: 'linear-gradient(135deg, #c7659f 0%, #c43d52 100%)',
    icon: '/icons/identity.png',
  },
];

describe('ProductSelector', () => {
  it('renders the title', () => {
    render(
      <ProductSelector products={mockProducts} onSelect={jest.fn()} />
    );
    expect(screen.getByText('Choose Your Own Adventure')).toBeTruthy();
  });

  it('renders a custom title when provided', () => {
    render(
      <ProductSelector
        products={mockProducts}
        onSelect={jest.fn()}
        title="Pick a Product"
      />
    );
    expect(screen.getByText('Pick a Product')).toBeTruthy();
  });

  it('renders all product cards', () => {
    render(
      <ProductSelector products={mockProducts} onSelect={jest.fn()} />
    );
    // shortName is used when available, otherwise name
    expect(screen.getByText('Auth')).toBeTruthy();
    expect(screen.getByText('Transactions')).toBeTruthy();
    expect(screen.getByText('ID')).toBeTruthy();
  });

  it('calls onSelect with product id when card is clicked', () => {
    const onSelect = jest.fn();
    render(
      <ProductSelector products={mockProducts} onSelect={onSelect} />
    );

    fireEvent.click(screen.getByText('Auth'));
    expect(onSelect).toHaveBeenCalledWith('auth');

    fireEvent.click(screen.getByText('Transactions'));
    expect(onSelect).toHaveBeenCalledWith('transactions');
  });

  it('renders back button when showBackButton and onBack are provided', () => {
    const onBack = jest.fn();
    render(
      <ProductSelector
        products={mockProducts}
        onSelect={jest.fn()}
        showBackButton={true}
        onBack={onBack}
      />
    );

    const backButton = document.querySelector('.back-button');
    expect(backButton).toBeTruthy();

    fireEvent.click(backButton!);
    expect(onBack).toHaveBeenCalled();
  });

  it('does not render back button when showBackButton is false', () => {
    render(
      <ProductSelector
        products={mockProducts}
        onSelect={jest.fn()}
        showBackButton={false}
        onBack={jest.fn()}
      />
    );

    expect(document.querySelector('.back-button')).toBeNull();
  });

  it('renders settings button when onSettingsClick is provided', () => {
    const onSettingsClick = jest.fn();
    render(
      <ProductSelector
        products={mockProducts}
        onSelect={jest.fn()}
        onSettingsClick={onSettingsClick}
      />
    );

    const settingsButton = document.querySelector('.settings-gear-button');
    expect(settingsButton).toBeTruthy();

    fireEvent.click(settingsButton!);
    expect(onSettingsClick).toHaveBeenCalled();
  });

  it('shows settings indicator when hasCustomSettings is true', () => {
    render(
      <ProductSelector
        products={mockProducts}
        onSelect={jest.fn()}
        onSettingsClick={jest.fn()}
        hasCustomSettings={true}
      />
    );

    expect(document.querySelector('.settings-indicator')).toBeTruthy();
  });

  it('hides settings indicator when hasCustomSettings is false', () => {
    render(
      <ProductSelector
        products={mockProducts}
        onSelect={jest.fn()}
        onSettingsClick={jest.fn()}
        hasCustomSettings={false}
      />
    );

    expect(document.querySelector('.settings-indicator')).toBeNull();
  });

  it('renders reset button when onResetClick is provided', () => {
    const onResetClick = jest.fn();
    render(
      <ProductSelector
        products={mockProducts}
        onSelect={jest.fn()}
        onResetClick={onResetClick}
      />
    );

    // The reset button has title="Reset Session"
    const resetButton = document.querySelector('[title="Reset Session"]');
    expect(resetButton).toBeTruthy();

    fireEvent.click(resetButton!);
    expect(onResetClick).toHaveBeenCalled();
  });

  it('renders product card icons when icon is specified', () => {
    render(
      <ProductSelector products={mockProducts} onSelect={jest.fn()} />
    );

    const icons = document.querySelectorAll('.product-card-icon img');
    expect(icons.length).toBe(2); // auth and identity have icons
    expect((icons[0] as HTMLImageElement).src).toContain('/icons/auth.png');
    expect((icons[1] as HTMLImageElement).src).toContain('/icons/identity.png');
  });

  it('applies has-icon class to cards with icons', () => {
    render(
      <ProductSelector products={mockProducts} onSelect={jest.fn()} />
    );

    const cards = document.querySelectorAll('.product-card');
    expect(cards[0].classList.contains('has-icon')).toBe(true);  // auth
    expect(cards[1].classList.contains('has-icon')).toBe(false); // transactions (no icon)
    expect(cards[2].classList.contains('has-icon')).toBe(true);  // identity
  });

  it('applies gradient background to product cards', () => {
    render(
      <ProductSelector products={mockProducts} onSelect={jest.fn()} />
    );

    const cards = document.querySelectorAll('.product-card') as NodeListOf<HTMLElement>;
    expect(cards[0].style.background).toBe(mockProducts[0].gradient);
  });

  it('disables products when isDisabled returns disabled: true', () => {
    const isDisabled = (id: string) => ({
      disabled: id === 'transactions',
      reason: 'Not available in sandbox',
    });

    render(
      <ProductSelector
        products={mockProducts}
        onSelect={jest.fn()}
        isDisabled={isDisabled}
      />
    );

    const cards = document.querySelectorAll('.product-card') as NodeListOf<HTMLButtonElement>;
    expect(cards[0].disabled).toBe(false); // auth
    expect(cards[1].disabled).toBe(true);  // transactions
    expect(cards[2].disabled).toBe(false); // identity
  });

  it('renders tooltip wrapper for disabled products with reason', () => {
    const isDisabled = (id: string) => ({
      disabled: id === 'auth',
      reason: 'Requires webhook',
    });

    render(
      <ProductSelector
        products={mockProducts}
        onSelect={jest.fn()}
        isDisabled={isDisabled}
      />
    );

    const wrapper = document.querySelector('.product-card-tooltip-wrapper');
    expect(wrapper).toBeTruthy();
    expect(wrapper?.getAttribute('data-tooltip')).toBe('Requires webhook');
  });
});
