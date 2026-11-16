import { describe, it, expect, vi } from 'vitest';
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

  it('executes onRetry callback and resets error state on handleRetry', () => {
    const onRetry = vi.fn();
    const boundary = new ErrorBoundary({
      children: <div>Child</div>,
      onRetry,
    });
    boundary.state = {
      hasError: true,
      error: new Error('Failed to fetch dynamically imported module'),
    };

    let updatedState: any = null;
    boundary.setState = ((updater: any) => {
      updatedState = typeof updater === 'function' ? updater(boundary.state) : updater;
      boundary.state = { ...boundary.state, ...updatedState };
    }) as any;

    (boundary as any).handleRetry();

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(updatedState).toEqual({ hasError: false, error: undefined });
    expect(boundary.state.hasError).toBe(false);
  });

  it('renders Download Error Report button and exposes sanitized diagnostic payload', () => {
    const boundary = new ErrorBoundary({
      children: <div>Child</div>,
    });
    boundary.state = {
      hasError: true,
      error: new Error('Render crash in TestComponent'),
    };

    const rendered = boundary.render();
    const html = renderToString(rendered as React.ReactElement);

    expect(html).toContain('Download Error Report');

    const report = boundary.generateErrorReport();
    expect(report.error).toBe('Render crash in TestComponent');
    expect(report.timestamp).toBeDefined();
    expect(typeof report.schemaVersion).toBe('number');
    expect(typeof report.rosterCount).toBe('number');
    expect(typeof report.weaponCount).toBe('number');
  });
});
