import { CombatMessage } from "../../types/combat";

interface CombatLogStreamProps {
  logs: CombatMessage[];
  maxHeight?: string;
}

export function CombatLogStream({ logs, maxHeight = '280px' }: CombatLogStreamProps) {
  return (
    <div id="combat-log-stream" style={{ maxHeight }}>
      {logs.map((log, index) => (
        <div key={index} class={`log-entry log-${log.type}`}>
          {log.text}
        </div>
      ))}
    </div>
  );
}