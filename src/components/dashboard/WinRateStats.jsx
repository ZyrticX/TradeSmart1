import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Target, Trophy, TrendingUp, TrendingDown, Divide } from 'lucide-react';

const StatItem = ({ icon: Icon, label, value, colorClass, small = false }) => (
    <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
            <Icon className={`w-4 h-4 ${colorClass}`} />
            <p className={`text-sm font-medium ${small ? 'text-xs' : 'text-sm'}`}>{label}</p>
        </div>
        <p className={`font-bold ${small ? 'text-sm' : 'text-base'} ${colorClass}`}>{value}</p>
    </div>
);

export default function WinRateStats({ trades }) {
  const stats = useMemo(() => {
    const closedTrades = trades.filter(t => t.status === 'closed');
    if (closedTrades.length === 0) {
      return { winRate: 0, avgWin: 0, avgLoss: 0, profitFactor: 0, totalTrades: 0, winningTradesCount: 0, losingTradesCount: 0 };
    }

    const winningTrades = closedTrades.filter(t => (t.profit_loss || 0) > 0);
    const losingTrades = closedTrades.filter(t => (t.profit_loss || 0) < 0);
    
    const totalWinAmount = winningTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
    const totalLossAmount = losingTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
    
    const winRate = (winningTrades.length / closedTrades.length) * 100;
    const avgWin = winningTrades.length > 0 ? totalWinAmount / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? totalLossAmount / losingTrades.length : 0;
    const profitFactor = totalLossAmount !== 0 ? Math.abs(totalWinAmount / totalLossAmount) : 0;

    return {
      winRate,
      avgWin,
      avgLoss,
      profitFactor,
      totalTrades: closedTrades.length,
      winningTradesCount: winningTrades.length,
      losingTradesCount: losingTrades.length,
    };
  }, [trades]);

  const formatCurrency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Stats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <StatItem icon={Trophy} label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} colorClass="text-amber-600" />
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 pl-6">
            <StatItem icon={CheckCircle} label="Wins" value={stats.winningTradesCount} colorClass="text-green-600" small={true} />
            <StatItem icon={XCircle} label="Losses" value={stats.losingTradesCount} colorClass="text-red-600" small={true} />
        </div>
        <hr/>
        <StatItem icon={TrendingUp} label="Average Win" value={formatCurrency(stats.avgWin)} colorClass="text-green-600" />
        <StatItem icon={TrendingDown} label="Average Loss" value={formatCurrency(stats.avgLoss)} colorClass="text-red-600" />
        <hr/>
        <StatItem icon={Divide} label="Profit Factor" value={stats.profitFactor.toFixed(2)} colorClass="text-blue-600" />
      </CardContent>
    </Card>
  );
}