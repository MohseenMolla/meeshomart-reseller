export const NEXT: Record<string, string[]> = {
  pending: ['confirmed', 'packaging', 'cancelled'],
  confirmed: ['packaging', 'shipped', 'cancelled'],
  processing: ['packaging', 'shipped', 'cancelled'],
  packaging: ['shipped', 'cancelled'],
  ready_to_ship: ['shipped', 'cancelled'],
  shipped: ['delivered', 'returned'],
  out_for_delivery: ['delivered', 'returned'],
  delivered: ['returned'],
  returned: ['refunded'],
  cancelled: [],
  refunded: []
};
