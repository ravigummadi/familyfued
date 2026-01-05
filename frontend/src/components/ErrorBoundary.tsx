import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          background: 'linear-gradient(135deg, #1a1a3e 0%, #0d0d2b 100%)',
          color: '#f8fafc',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
          <h1 style={{
            fontSize: '2rem',
            marginBottom: '1rem',
            color: '#fbbf24',
          }}>
            Oops! Something went wrong
          </h1>
          <p style={{
            marginBottom: '1.5rem',
            color: '#94a3b8',
            textAlign: 'center',
            maxWidth: '400px',
          }}>
            We're sorry, but something went wrong loading the game.
            Please try refreshing the page.
          </p>
          <button
            onClick={this.handleReload}
            style={{
              padding: '0.75rem 2rem',
              fontSize: '1rem',
              fontWeight: 600,
              color: '#1a1a3e',
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(251, 191, 36, 0.3)',
            }}
          >
            Reload Page
          </button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{
              marginTop: '2rem',
              padding: '1rem',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '0.5rem',
              maxWidth: '600px',
              width: '100%',
            }}>
              <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>
                Error Details (Development Only)
              </summary>
              <pre style={{
                fontSize: '0.75rem',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
