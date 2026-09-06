import type { ComponentChildren } from 'preact';

interface StatusBarProps {
  children: ComponentChildren;
  marginTop?: string;
}

export function StatusBar({ children, marginTop }: StatusBarProps) {
  return (
    <div class="status-indicator-bar" style={marginTop ? { marginTop } : undefined}>
      {children}
    </div>
  );
}