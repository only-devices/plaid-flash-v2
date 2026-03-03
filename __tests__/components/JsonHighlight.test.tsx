/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import JsonHighlight from '@/components/JsonHighlight';

describe('JsonHighlight', () => {
  it('renders a simple object', () => {
    render(<JsonHighlight data={{ name: 'test', value: 42 }} />);

    const container = document.querySelector('.json-container');
    expect(container).toBeTruthy();

    // Check that key names are rendered
    expect(container!.textContent).toContain('"name"');
    expect(container!.textContent).toContain('"test"');
    expect(container!.textContent).toContain('42');
  });

  it('renders null values', () => {
    render(<JsonHighlight data={{ key: null }} />);

    const container = document.querySelector('.json-container');
    expect(container!.textContent).toContain('null');
    expect(document.querySelector('.json-null')).toBeTruthy();
  });

  it('renders boolean values', () => {
    render(<JsonHighlight data={{ active: true, deleted: false }} />);

    const container = document.querySelector('.json-container');
    expect(container!.textContent).toContain('true');
    expect(container!.textContent).toContain('false');
    expect(document.querySelectorAll('.json-boolean').length).toBe(2);
  });

  it('renders number values', () => {
    render(<JsonHighlight data={{ count: 99, price: 12.5 }} />);

    expect(document.querySelectorAll('.json-number').length).toBe(2);
  });

  it('renders string values', () => {
    render(<JsonHighlight data={{ greeting: 'hello' }} />);

    const strings = document.querySelectorAll('.json-string');
    // "hello" should be rendered as a string
    const stringTexts = Array.from(strings).map(s => s.textContent);
    expect(stringTexts.some(t => t?.includes('hello'))).toBe(true);
  });

  it('renders arrays', () => {
    render(<JsonHighlight data={{ items: [1, 2, 3] }} />);

    const container = document.querySelector('.json-container');
    expect(container!.textContent).toContain('[');
    expect(container!.textContent).toContain(']');
    expect(container!.textContent).toContain('1');
    expect(container!.textContent).toContain('2');
    expect(container!.textContent).toContain('3');
  });

  it('renders empty arrays as []', () => {
    render(<JsonHighlight data={{ items: [] }} />);

    const container = document.querySelector('.json-container');
    expect(container!.textContent).toContain('[]');
  });

  it('renders empty objects as {}', () => {
    render(<JsonHighlight data={{ metadata: {} }} />);

    const container = document.querySelector('.json-container');
    expect(container!.textContent).toContain('{}');
  });

  it('renders nested objects', () => {
    render(
      <JsonHighlight
        data={{
          user: {
            name: 'Jane',
            address: { city: 'SF' },
          },
        }}
      />
    );

    const container = document.querySelector('.json-container');
    expect(container!.textContent).toContain('"Jane"');
    expect(container!.textContent).toContain('"SF"');
  });

  it('highlights specified keys', () => {
    render(
      <JsonHighlight
        data={{ important: 'yes', normal: 'no' }}
        highlightKeys={['important']}
      />
    );

    const highlights = document.querySelectorAll('.json-highlight');
    expect(highlights.length).toBe(1);
    expect(highlights[0].textContent).toContain('"important"');
  });

  it('renders copy button by default', () => {
    render(<JsonHighlight data={{ test: true }} />);

    const copyButton = document.querySelector('.json-copy-button');
    expect(copyButton).toBeTruthy();
  });

  it('hides copy button when showCopyButton is false', () => {
    render(<JsonHighlight data={{ test: true }} showCopyButton={false} />);

    const copyButton = document.querySelector('.json-copy-button');
    expect(copyButton).toBeNull();
  });

  it('renders the code block wrapper', () => {
    render(<JsonHighlight data={{ x: 1 }} />);

    expect(document.querySelector('.code-block')).toBeTruthy();
    expect(document.querySelector('pre')).toBeTruthy();
    expect(document.querySelector('code')).toBeTruthy();
  });

  it('renders expandable copy menu when expandableCopy is provided', () => {
    render(
      <JsonHighlight
        data={{ result: 'ok' }}
        expandableCopy={{
          responseData: { result: 'ok' },
          accessToken: 'access-sandbox-123',
        }}
      />
    );

    const expandable = document.querySelector('.json-copy-expandable');
    expect(expandable).toBeTruthy();
    expect(screen.getByText('Response')).toBeTruthy();
    expect(screen.getByText('Access Token')).toBeTruthy();
  });

  it('shows user_id and user_token buttons for CRA products', () => {
    render(
      <JsonHighlight
        data={{ result: 'ok' }}
        expandableCopy={{
          responseData: { result: 'ok' },
          userId: 'user_abc',
          userToken: 'user-token-xyz',
          isCRA: true,
        }}
      />
    );

    expect(screen.getByText('user_id')).toBeTruthy();
    expect(screen.getByText('user_token')).toBeTruthy();
  });

  it('shows link token button when linkToken is provided', () => {
    render(
      <JsonHighlight
        data={{ result: 'ok' }}
        expandableCopy={{
          responseData: { result: 'ok' },
          linkToken: 'link-sandbox-token',
        }}
      />
    );

    expect(screen.getByText('Link Token')).toBeTruthy();
  });
});
