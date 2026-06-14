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
          <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-soft">
            <h1 className="text-2xl font-semibold text-slate-900">{i18n.t('common.somethingWentWrong')}</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">{i18n.t('common.somethingWentWrong')}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 rounded-2xl bg-primary px-5 py-3 font-semibold text-white shadow-soft transition hover:bg-primary-600"
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