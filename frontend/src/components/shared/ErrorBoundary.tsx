import type { ErrorInfo, ReactNode } from 'react';
import React from 'react';
import i18n from '../../i18n';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(error, errorInfo);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="card max-w-md text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-3xl">⚠️</div>
            <h1 className="mt-5 text-page-title">{i18n.t('common.somethingWentWrong')}</h1>
            <p className="mt-3 text-body">{i18n.t('common.somethingWentWrong')}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn-primary mt-6 w-full"
            >
              {i18n.t('common.reload')}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}