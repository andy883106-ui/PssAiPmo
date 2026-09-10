"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class DeskErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("DeskErrorBoundary", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="app-shell">
        <div className="login-card">
          <p className="app-kicker">陳小均</p>
          <h1>畫面出了一點狀況</h1>
          <p className="guide-body">請重新整理。若一直發生，把錯誤訊息傳給管理者。</p>
          <pre className="login-error whitespace-pre-wrap text-xs">{this.state.error.message}</pre>
          <div className="guide-actions">
            <Button className="h-11 flex-1" onClick={() => window.location.reload()}>
              重新整理
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
