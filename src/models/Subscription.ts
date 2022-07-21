export interface Subscription {
  id: number | string;
  unsubscribe: () => void;
}
