export interface BillingProvider {
  createSubscription(input: unknown): Promise<{ subscriptionId: string }>;
  getPayment(paymentId: string): Promise<unknown>;
  handleRecurringNotification(payload: unknown): Promise<void>;
  cancelSubscription(subscriptionId: string): Promise<void>;
  handlePaymentFailure(payload: unknown): Promise<void>;
}
