import React from 'react';

type Props = { children: React.ReactNode };
type State = { error: string | null };

/** Display the actual React runtime exception instead of a blank AI Studio preview. */
export class RuntimeErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error): State {
    return { error: error?.message || String(error) };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[LOTO V7 RuntimeErrorBoundary]', error, info.componentStack);
  }
  render(): React.ReactNode {
    if (!this.state.error) return this.props.children;
    return (
      <main role="alert" className="min-h-screen bg-[#211307] text-amber-100 p-6 font-sans">
        <h1 className="text-xl font-bold text-red-300">Lô Tô: lỗi chạy React</h1>
        <p className="mt-2">Bản mã nguồn: V7.0.0-AUDIO-SEQUENCE-5-PACKS</p>
        <pre className="mt-3 overflow-auto whitespace-pre-wrap rounded border border-red-800 p-3 text-sm">{this.state.error}</pre>
        <p className="mt-3">Mở Console trong DevTools để xem stack trace, sau đó đối chiếu mã đang chạy trong AI Studio.</p>
        <button type="button" className="mt-4 rounded bg-amber-500 px-4 py-2 text-black" onClick={() => window.location.reload()}>Tải lại trang</button>
      </main>
    );
  }
}
