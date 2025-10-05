
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, X, TrendingUp, TrendingDown, Eye } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function TradesList({ trades, isLoading, onUpdateTrade, onCloseClick, showActions = true }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>No trades found.</p>
      </div>
    );
  }

  const calculateProfitLoss = (trade) => {
    if (trade.status === 'closed' && trade.profit_loss !== undefined) {
      return { amount: trade.profit_loss, percentage: trade.profit_loss_percentage || 0 };
    }
    
    if (trade.status === 'open' && trade.current_price && trade.entry_price) {
      const amount = trade.direction === 'long' 
        ? (trade.current_price - trade.entry_price) * trade.quantity
        : (trade.entry_price - trade.current_price) * trade.quantity;
      
      const percentage = (amount / trade.position_size) * 100;
      return { amount, percentage };
    }
    
    return { amount: 0, percentage: 0 };
  };

  const getStatusBadge = (status) => {
    const variants = {
      open: { variant: 'default', text: 'Open', color: 'bg-emerald-100 text-emerald-800' },
      closed: { variant: 'secondary', text: 'Closed', color: 'bg-gray-100 text-gray-800' },
      watch: { variant: 'outline', text: 'Watch', color: 'bg-blue-100 text-blue-800' }
    };
    
    return variants[status] || variants.open;
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Symbol</TableHead>
            <TableHead>Direction</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Entry Price</TableHead>
            <TableHead>Current/Exit Price</TableHead>
            <TableHead>P&L</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Strategy</TableHead>
            {showActions && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {trades.map((trade) => {
            const { amount, percentage } = calculateProfitLoss(trade);
            const statusBadge = getStatusBadge(trade.status);
            
            return (
              <TableRow key={trade.id} className="hover:bg-gray-50">
                <TableCell>
                  {format(new Date(trade.date_time), 'MMM dd, yyyy')}
                </TableCell>
                <TableCell className="font-medium">{trade.symbol}</TableCell>
                <TableCell>
                  <Badge variant={trade.direction === 'long' ? 'default' : 'secondary'}>
                    {trade.direction === 'long' ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1" />
                    )}
                    {trade.direction}
                  </Badge>
                </TableCell>
                <TableCell>{trade.quantity}</TableCell>
                <TableCell>${trade.entry_price?.toFixed(2)}</TableCell>
                <TableCell>
                  ${trade.status === 'closed' ? trade.exit_price?.toFixed(2) : trade.current_price?.toFixed(2) || 'N/A'}
                </TableCell>
                <TableCell>
                  <div className={`font-medium ${amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    ${amount.toFixed(2)}
                    <br />
                    <span className="text-xs">
                      {percentage >= 0 ? '+' : ''}{percentage.toFixed(1)}%
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={statusBadge.color}>
                    {statusBadge.text}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600">{trade.strategy || 'N/A'}</span>
                </TableCell>
                {showActions && (
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      {trade.status === 'open' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => onCloseClick(trade)}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                      {trade.status === 'watch' && (
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
