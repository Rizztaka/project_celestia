import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ErrorBoundary } from './ErrorBoundary';

describe('ErrorBoundary Component', () => {
  it('renders children when there is no error', () => {
    const html = renderToString(
      <ErrorBoundary>
        <div data-testid="child">Normal Content</div>
      </ErrorBoundary>
    );
    expect(html).toContain('Normal Content');
    expect(html).not.toContain('role="alert"');
  });

  it('updates state via getDerivedStateFromError when error occurs', () => {
    const derivedState = ErrorBoundary.getDerivedStateFromError(new Error('ChunkLoadError'));
    expect(derivedState.hasError).toBe(true);
    expect(derivedState.error?.message).toBe('ChunkLoadError');
  });

  it('renders error UI with alert role and action buttons when hasError is true', () => {
    const boundary = new ErrorBoundary({
      children: <div>Child</div>,
      fallbackTitle: 'Failed to load module',
    });
    boundary.state = {
      hasError: true,
      error: new Error('Network timeout'),
    };
    const rendered = boundary.render();
    const html = renderToString(rendered as React.ReactElement);

    expect(html).toContain('role="alert"');
    expect(html).toContain('Failed to load module');
    expect(html).toContain('Try Again');
    expect(html).toContain('Reload Page');
  });
});
