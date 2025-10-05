import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';

const CustomTooltip = ({ active, payload, label, currency }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border rounded-md shadow-lg">
        <p className="label">{`${format(new Date(label), 'MMM dd, yyyy')}`}</p>
        <p className="intro" style={{ color: payload[0].stroke }}>
            {`Equity: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(payload[0].value)}`}
        </p>
      </div>
    );
  }
  return null;
};

export default function EquityCurveChart({ trades, accountSize }) {
  const chartData = useMemo(() => {
    if (!trades || trades.length === 0) {
      return [{ date: new Date().getTime(), equity: accountSize }];
    }
    
    const sortedTrades = [...trades]
      .filter(t => t.status === 'closed' && t.updated_date)
      .sort((a, b) => new Date(a.updated_date) - new Date(b.updated_date));
      
    let cumulativePnl = 0;
    const data = sortedTrades.map(trade => {
      cumulativePnl += trade.profit_loss || 0;
      return {
        date: new Date(trade.updated_date).getTime(),
        equity: accountSize + cumulativePnl,
      };
    });

    return [
        { date: data.length > 0 ? new Date(sortedTrades[0].updated_date).getTime() - 86400000 : new Date().getTime() - 86400000, equity: accountSize }, 
        ...data
    ];
  }, [trades, accountSize]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Equity Curve</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.5} />
            <XAxis 
              dataKey="date" 
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(unixTime) => format(new Date(unixTime), 'MMM yy')}
              style={{ fontSize: '0.75rem' }}
            />
            <YAxis 
              dataKey="equity"
              domain={['auto', 'auto']}
              tickFormatter={(value) => new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(value)}
              style={{ fontSize: '0.75rem' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line type="monotone" dataKey="equity" stroke="#4f46e5" strokeWidth={2} dot={false} name="Account Value" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}