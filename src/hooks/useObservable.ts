import { useState, useEffect } from 'preact/hooks';
import type { Observable } from '../models/Observable';

export function useObservable(...targets: (Observable | null | undefined)[]): void {
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsubscribers = targets
      .filter((t): t is Observable => Boolean(t))
      .map((t) => t.subscribe(() => setTick((v) => v + 1)));

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, targets);
}