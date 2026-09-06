import { IconName, ICONS } from "../../data/icons";

interface IconProps {
  name: IconName;
  class?: string;
}

export function Icon({ name, class: className }: IconProps) {
  const svg = ICONS[name];
  if (!svg) return null;
  return <span class={`pixel-icon-container ${className || ''}`} dangerouslySetInnerHTML={{ __html: svg }} />;
}