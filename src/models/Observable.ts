export class Observable {
  #listeners = new Set<() => void>();
  #notifyScheduled = false;

  public subscribe(listener: () => void): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  public notify(): void {
    if (this.#notifyScheduled) return;
    this.#notifyScheduled = true;

    // Batches synchronous mutations across the call stack into one render pass
    queueMicrotask(() => {
      this.#notifyScheduled = false;
      for (const listener of this.#listeners) {
        listener();
      }
    });
  }

  /**
   * Recursively wraps a target object/array in a Proxy store.
   * Any mutation on the target or its nested properties triggers this.notify().
   */
  protected createReactiveStore<T extends object>(target: T): T {
    const self = this;
    const proxyCache = new WeakMap<object, any>();

    function createProxy<O extends object>(obj: O): O {
      if (proxyCache.has(obj)) {
        return proxyCache.get(obj);
      }

      const handler: ProxyHandler<O> = {
        get(t, prop, receiver) {
          const val = Reflect.get(t, prop, receiver);
          if (val !== null && typeof val === 'object') {
            return createProxy(val);
          }
          return val;
        },
        set(t, prop, value, receiver) {
          const old = (t as any)[prop];
          if (old === value) return true;

          const result = Reflect.set(t, prop, value, receiver);
          self.notify();
          return result;
        },
        deleteProperty(t, prop) {
          const result = Reflect.deleteProperty(t, prop);
          self.notify();
          return result;
        },
      };

      const proxy = new Proxy(obj, handler);
      proxyCache.set(obj, proxy);
      return proxy;
    }

    return createProxy(target);
  }
}