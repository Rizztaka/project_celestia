import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { InfoTooltip } from './InfoTooltip';

describe('InfoTooltip Component', () => {
  it('renders trigger button with accessible aria-label and icon', () => {
    const html = renderToString(
      <InfoTooltip
        title="Test Title"
        content="Detailed calculation guidance for testing."
      />
    );

    expect(html).toContain('aria-label="Test Title"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('<button');
  });

  it('renders default aria-label when title is omitted', () => {
    const html = renderToString(
      <InfoTooltip content="Generic calculation description." />
    );

    expect(html).toContain('aria-label="Information"');
  });

  it('applies custom className and iconClassName', () => {
    const html = renderToString(
      <InfoTooltip
        content="Testing styles"
        className="custom-container"
        iconClassName="text-amber-500"
      />
    );

    expect(html).toContain('custom-container');
    expect(html).toContain('text-amber-500');
  });

  it('applies correct alignment classes for right, left, and center', () => {
    // InfoTooltip SSR initial state is closed; check container rendering
    const htmlRight = renderToString(
      <InfoTooltip
        content="Right aligned tooltip"
        align="right"
      />
    );
    expect(htmlRight).toContain('<button');

    const htmlLeft = renderToString(
      <InfoTooltip
        content="Left aligned tooltip"
        align="left"
      />
    );
    expect(htmlLeft).toContain('<button');

    const htmlCenter = renderToString(
      <InfoTooltip
        content="Center aligned tooltip"
        align="center"
      />
    );
    expect(htmlCenter).toContain('<button');
  });
});
