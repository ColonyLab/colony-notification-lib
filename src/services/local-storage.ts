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

  // Notifications

  static getNotificationTimestamp(account: string): number {
    const key = `notifications-${account}`;
    const timestamp = LocalStorage.getItem(key);
    return timestamp || 0;
  }

  static setNotificationTimestamp(account: string) {
    const key = `notifications-${account}`;

    // use current timestamp
    const timestamp = Math.floor(Date.now() / 1000);
    LocalStorage.setItem(key, timestamp);
  }

  static clearNotificationTimestamp(account: string) {
    const key = `notifications-${account}`;
    LocalStorage.removeItem(key);
  }
}
