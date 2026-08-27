import React from 'react';
import BalanceDetails from './BalanceDetails';
import RateCards from './RateCards';
import SummaryChart from './SummaryChart';
import TransactionsList from './TransactionsList';

export default function Dashboard({ onNavigate }) {
  return (
    <div className="max-w-[1400px] mx-auto px-3 sm:px-6 py-5 sm:py-6 flex flex-col gap-5">
      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-5 items-start">
        <BalanceDetails />
        <RateCards />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TransactionsList onNavigate={onNavigate} />
        <SummaryChart />
      </div>
    </div>
  );
}