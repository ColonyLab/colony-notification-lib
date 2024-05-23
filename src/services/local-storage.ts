type TimestampsPresence = { [key: number]: boolean };

export default class LocalStorage {
  static getItem(key: string) {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  static setItem(key: string, value: any) {
    const serializedValue = JSON.stringify(value);
    localStorage.setItem(key, serializedValue);
  }

  static removeItem(key: string) {
    localStorage.removeItem(key);
  }

  static addNotificationTimestamps(account: string, timestamps: number[]) {
    const key = `notifications-${account}`;
    const storedTimestamps = LocalStorage.getItem(key) || [];

    // Use Set to prevent duplicates
    const timestampSet = new Set([...storedTimestamps, ...timestamps]);
    LocalStorage.setItem(key, Array.from(timestampSet));
  }

  static hasNotificationTimestamps(account: string, timestamps: number[]): TimestampsPresence {
    const key = `notifications-${account}`;
    const storedTimestamps = LocalStorage.getItem(key) || [];
    const timestampSet = new Set(storedTimestamps);

    // Use Set for optimized lookups
    const result: { [key: number]: boolean } = {};
    timestamps.forEach(timestamp => {
      result[timestamp] = timestampSet.has(timestamp);
    });

    return result;
  }
}
