/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import Modal from '@/components/Modal';

describe('Modal', () => {
  it('renders children', () => {
    render(
      <Modal isVisible={true}>
        <p>Test content</p>
      </Modal>
    );
    expect(screen.getByText('Test content')).toBeTruthy();
  });

  it('applies modal-visible class when isVisible is true', () => {
    render(
      <Modal isVisible={true}>
        <p>Visible modal</p>
      </Modal>
    );

    const modal = document.querySelector('.modal');
    expect(modal?.classList.contains('modal-visible')).toBe(true);
  });

  it('does not apply modal-visible class when isVisible is false', () => {
    render(
      <Modal isVisible={false}>
        <p>Hidden modal</p>
      </Modal>
    );

    const modal = document.querySelector('.modal');
    expect(modal?.classList.contains('modal-visible')).toBe(false);
  });

  it('always renders the modal-content wrapper', () => {
    render(
      <Modal isVisible={false}>
        <p>Content</p>
      </Modal>
    );

    expect(document.querySelector('.modal-content')).toBeTruthy();
  });

  it('renders complex children correctly', () => {
    render(
      <Modal isVisible={true}>
        <h1>Title</h1>
        <div>
          <button>Action</button>
          <span>Description</span>
        </div>
      </Modal>
    );

    expect(screen.getByText('Title')).toBeTruthy();
    expect(screen.getByText('Action')).toBeTruthy();
    expect(screen.getByText('Description')).toBeTruthy();
  });
});
