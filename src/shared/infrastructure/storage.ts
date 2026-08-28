export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export class BrowserStorage implements KeyValueStorage {
  getItem(key: string) {
    return window.localStorage.getItem(key);
  }

  setItem(key: string, value: string) {
    window.localStorage.setItem(key, value);
  }

  removeItem(key: string) {
    window.localStorage.removeItem(key);
  }
}

export class SessionStorage implements KeyValueStorage {
  getItem(key: string) {
    return window.sessionStorage.getItem(key);
  }

  setItem(key: string, value: string) {
    window.sessionStorage.setItem(key, value);
  }

  removeItem(key: string) {
    window.sessionStorage.removeItem(key);
  }
}

export class MemoryStorage implements KeyValueStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

export class JsonStore<T> {
  constructor(
    private readonly storage: KeyValueStorage,
    private readonly key: string,
    private readonly fallback: T,
  ) {}

  read(): T {
    const raw = this.storage.getItem(this.key);
    if (!raw) return structuredClone(this.fallback);
    try {
      return JSON.parse(raw) as T;
    } catch {
      return structuredClone(this.fallback);
    }
  }

  write(value: T) {
    this.storage.setItem(this.key, JSON.stringify(value));
  }
}
