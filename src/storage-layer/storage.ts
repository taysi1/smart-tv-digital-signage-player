export interface StorageLayer {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export class LocalStorageLayer implements StorageLayer {
  getItem(key: string): Promise<string | null> {
    return Promise.resolve(window.localStorage.getItem(key));
  }

  setItem(key: string, value: string): Promise<void> {
    window.localStorage.setItem(key, value);
    return Promise.resolve();
  }

  removeItem(key: string): Promise<void> {
    window.localStorage.removeItem(key);
    return Promise.resolve();
  }
}
