import { ComponentChildren } from "preact";
import { IconName } from "../../data/icons";
import { Icon } from "./Icon";

interface PixelFrameProps {
  title: string;
  icon?: IconName;
  isDark?: boolean;
  class?: string;
  style?: Record<string, string | number>;
  children: ComponentChildren;
}

export function PixelFrame({ title, icon, isDark = false, class: className = '', style, children }: PixelFrameProps) {
  return (
    <div class={`pixel-frame ${isDark ? 'is-dark' : ''} ${className}`} style={style}>
      <div class="frame-title">
        {icon && <Icon name={icon} />} {title}
      </div>
      {children}
    </div>
  );
}