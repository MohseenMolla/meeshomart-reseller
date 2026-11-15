'use client';
import { createContext, useContext } from 'react';

export type Overview = {
  name?: string;
  email: string;
  phone?: string;
  verified: boolean;
  twoFactor: boolean;
  shopName: string;
  status: string;
  sellerCode?: string;
  referralCode?: string;
  subscriptionEndsAt?: string;
  orders: {
    byStatus: Record<string, number>;
    total: number;
    today: number;
  };
  sales: number;
  profit: number;
  todaySales: number;
  todayProfit?: number;
  wallet: {
    available: number;
    pending: number;
  };
  referralEarnings: number;
  recentOrders?: any[];
};

export const OverviewCtx = createContext<Overview | null>(null);
export const useOverview = () => useContext(OverviewCtx)!;
