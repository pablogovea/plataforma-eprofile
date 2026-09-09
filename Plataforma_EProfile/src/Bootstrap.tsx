import { Component, type ErrorInfo, type ReactNode } from 'react';
import App from './App';
import { AuthProvider } from './hooks/useAuth';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

class AppErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Error no controlado en EProfile', error, info);
  }

  render(): ReactNode {
    if (this.state.error) {
      return <main className="grid min-h-screen place-items-center bg-slate-100 px-4">
        <section className="w-full max-w-xl rounded-2xl border border-red-200 bg-white p-6 shadow-lg">
          <p className="text-sm font-bold uppercase tracking-wider text-red-700">Error de aplicación</p>
          <h1 className="mt-2 text-2xl font-black text-slate-900">EProfile no pudo mostrar esta página</h1>
          <p className="mt-3 text-slate-600">Recarga la página. Si el problema continúa, revisa la consola del navegador.</p>
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{this.state.error.message}</p>
        </section>
      </main>;
    }

    return this.props.children;
  }
}

export function Bootstrap() {
  return <AppErrorBoundary><AuthProvider><App /></AuthProvider></AppErrorBoundary>;
}
