import React, { useState, useEffect } from "react";
import { Trade, Account } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle }
  from "@/components/ui/card";
import { Plus, TrendingUp, TrendingDown, DollarSign, Shield, Banknote, CalendarDays } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format as formatDate, startOfMonth, endOfMonth } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import MetricCard from "../components/dashboard/MetricCard";
import OpenTradesTable from "../components/dashboard/OpenTradesTable";
import TradingCalendar from "../components/dashboard/TradingCalendar";
import NewTradeModal from "../components/trades/NewTradeModal";
import CloseTradeModal from "../components/trades/CloseTradeModal";
import AddQuantityModal from "../components/trades/AddQuantityModal";
import TradeDetailModal from "../components/trades/TradeDetailModal";
import WinRateStats from "../components/dashboard/WinRateStats";
import ClosedTradesTable from "../components/dashboard/ClosedTradesTable";

export default function Dashboard() {
  const [trades, setTrades] = useState([]);
  const [showNewTradeModal, setShowNewTradeModal] = useState(false);
  const [tradeToEdit, setTradeToEdit] = useState(null);
  const [tradeToClose, setTradeToClose] = useState(null);
  const [tradeToAddQuantity, setTradeToAddQuantity] = useState(null);
  const [tradeToView, setTradeToView] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [deletingTradeId, setDeletingTradeId] = useState(null);

  const language = localStorage.getItem('language') || 'en';

  const getText = (en, he) => {
    switch (language) {
      case 'he': return he;
      default: return en;
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setIsLoading(true);
    try {
      const accountsData = await Account.list();
      setAccounts(accountsData);

      const currentId = localStorage.getItem('currentAccountId');
      const accountExists = currentId && accountsData.some(acc => acc.id === currentId);

      if (accountExists) {
        const account = accountsData.find(a => a.id === currentId);
        setCurrentAccount(account);
        loadData(currentId);
      } else if (accountsData.length > 0) {
        localStorage.setItem('currentAccountId', accountsData[0].id);
        window.location.reload();
      } else {
        localStorage.removeItem('currentAccountId');
        setCurrentAccount(null);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
      setIsLoading(false);
    }
  };

  const loadData = async (accountId) => {
    try {
      if (!accountId) {
        setIsLoading(false);
        return;
      }
      const allTrades = await Trade.filter({ account_id: accountId }, '-date_time');
      setTrades(allTrades);
    } catch (error) {
      console.error('Error loading data:', error);
      setTrades([]); // Set empty array on error
    }
    setIsLoading(false);
  };

  const handleNewOrUpdateTrade = async (tradeData, eventData) => {
    try {
      if (tradeToEdit) {
        await Trade.update(tradeToEdit.id, tradeData);
      } else {
        const newTrade = await Trade.create(tradeData);
        if (eventData) {
          const { TradeEvent } = await import('@/api/entities');
          await TradeEvent.create({ ...eventData, trade_id: newTrade.id });
        }
      }
      setShowNewTradeModal(false);
      setTradeToEdit(null);
      loadData(currentAccount.id);
    } catch (error) {
      console.error('Error creating/updating trade:', error);
      alert(getText('Error saving trade. Please try again.', 'שגיאה בשמירת העסקה. אנא נסה שוב.'));
    }
  };

  const handleEditClick = (trade) => {
    // Verify trade still exists before editing
    if (!trade || !trade.id) {
      alert(getText('This trade no longer exists.', 'עסקה זו כבר לא קיימת.'));
      loadData(currentAccount.id); // Refresh data
      return;
    }
    setTradeToEdit(trade);
    setShowNewTradeModal(true);
  };

  const handleEditEvent = (eventToEdit) => {
    console.log("Editing event:", eventToEdit);
    alert(getText("Editing individual trade events coming soon!", "עריכת אירועי טרייד בודדים תגיע בקרוב!"));
  };

  const handleCloseTrade = async (tradeId, closeData, eventData) => {
    try {
      await Trade.update(tradeId, closeData);
      if (eventData) {
        const { TradeEvent } = await import('@/api/entities');
        await TradeEvent.create({ ...eventData, trade_id: tradeId });
      }
      setTradeToClose(null);
      loadData(currentAccount.id);
    } catch (error) {
      console.error('Error closing trade:', error);
      alert(getText('Error closing trade. Please try again.', 'שגיאה בסגירת העסקה. אנא נסה שוב.'));
      loadData(currentAccount.id); // Refresh to get current state
    }
  };

  const handleAddQuantity = async (tradeId, updateData, eventData) => {
    try {
      await Trade.update(tradeId, updateData);
      if (eventData) {
        const { TradeEvent } = await import('@/api/entities');
        await TradeEvent.create({ ...eventData, trade_id: tradeId });
      }
      setTradeToAddQuantity(null);
      loadData(currentAccount.id);
    } catch (error) {
      console.error('Error adding quantity:', error);
      alert(getText('Error adding quantity. Please try again.', 'שגיאה בהוספת כמות. אנא נסה שוב.'));
      loadData(currentAccount.id); // Refresh to get current state
    }
  };

  const handleViewClick = (trade) => {
    // Verify trade still exists before viewing
    if (!trade || !trade.id) {
      alert(getText('This trade no longer exists.', 'עסקה זו כבר לא קיימת.'));
      loadData(currentAccount.id); // Refresh data
      return;
    }
    setTradeToView(trade);
  };

  const handleDeleteTrade = async (tradeId) => {
    if (deletingTradeId) return;

    if (window.confirm(getText("Are you sure you want to delete this trade permanently? This will delete all associated events.", "האם אתה בטוח שברצונך למחוק עסקה זו לצמיתות? פעולה זו תמחק את כל האירועים הקשורים."))) {
      setDeletingTradeId(tradeId);
      
      try {
        // First verify the trade exists
        const tradeExists = trades.find(t => t.id === tradeId);
        if (!tradeExists) {
          alert(getText('This trade has already been deleted.', 'עסקה זו כבר נמחקה.'));
          loadData(currentAccount.id);
          return;
        }

        const { TradeEvent } = await import('@/api/entities');
        const events = await TradeEvent.filter({ trade_id: tradeId });
        for (const event of events) {
          await TradeEvent.delete(event.id);
        }
        await Trade.delete(tradeId);
        loadData(currentAccount.id);
      } catch (error) {
        console.error('Error deleting trade:', error);
        alert(getText("Failed to delete trade. It may have already been deleted.", "נכשל במחיקת העסקה. ייתכן שהיא כבר נמחקה."));
        loadData(currentAccount.id); // Refresh to get current state
      }
      
      setDeletingTradeId(null);
    }
  };

  const handleAccountChange = (accountId) => {
    localStorage.setItem('currentAccountId', accountId);
    window.location.reload();
  };

  // Filter out any null/undefined trades and validate data
  const validTrades = trades.filter(trade => trade && trade.id);
  const openTrades = validTrades.filter(trade => trade.status === 'open');
  const closedTrades = validTrades.filter(trade => trade.status === 'closed');

  const monthlyClosedTrades = closedTrades.filter(trade => {
    if (!trade.updated_date) return false;
    try {
      const closedDate = new Date(trade.updated_date);
      const start = startOfMonth(new Date());
      const end = endOfMonth(new Date());
      return closedDate >= start && closedDate <= end;
    } catch (error) {
      console.error('Error parsing trade date:', error);
      return false;
    }
  });

  const totalRisk = openTrades.reduce((sum, trade) => sum + (trade.risk_amount || 0), 0);
  const totalPositionValue = openTrades.reduce((sum, trade) => sum + (trade.position_size || 0), 0);
  const totalRealizedPL = closedTrades.reduce((sum, trade) => sum + (trade.profit_loss || 0), 0);

  const accountSize = currentAccount?.account_size || 0;
  const availableCash = accountSize - totalPositionValue;
  const availableCashPercentage = accountSize > 0 ? (availableCash / accountSize) * 100 : 0;
  const riskPercentageOfAccount = accountSize > 0 ? (totalRisk / accountSize) * 100 : 0;
  const riskPercentageOfPositions = totalPositionValue > 0 ? (totalRisk / totalPositionValue) * 100 : 0;

  if (accounts.length === 0 && !isLoading) {
    return (
      <div className="p-6 text-center text-gray-600">
        <h2 className="text-xl font-semibold">{getText('Welcome to the Trading System', 'ברוכים הבאים למערכת המסחר')}</h2>
        <p className="mt-2">{getText('Please create your first account on the ', 'אנא צרו את החשבון הראשון שלכם בעמוד ')}
          <Link to={createPageUrl("Settings")} className="text-blue-600 underline">{getText('Settings', 'הגדרות')}</Link>
          {getText(' page to get started.', ' כדי להתחיל.')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{getText('Home Page', 'עמוד הבית')}</h1>
          </div>
          {accounts.length > 1 && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600">{getText('Account:', 'חשבון:')}</label>
              <Select value={currentAccount?.id || ''} onValueChange={handleAccountChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={getText('Select account', 'בחר חשבון')} />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <Button onClick={() => { setTradeToEdit(null); setShowNewTradeModal(true); }} className="bg-purple-600 hover:bg-purple-700 text-white">
          <Plus className="w-4 h-4 mx-2" />
          {getText('New Trade', 'עסקה חדשה')}
        </Button>
      </div>

      {currentAccount && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title={getText('Account Value', 'שווי החשבון')}
              value={`${new Intl.NumberFormat('en-US', { style: 'currency', currency: currentAccount?.currency || 'USD' }).format(accountSize)}`}
              icon={Banknote}
              color="blue"
            />
            <MetricCard
              title={getText('Open Trades Value', 'שווי עסקאות פתוחות')}
              value={`${new Intl.NumberFormat('en-US', { style: 'currency', currency: currentAccount?.currency || 'USD' }).format(totalPositionValue)}`}
              subValue={`${(100 - availableCashPercentage).toFixed(1)}% ${getText('in use', 'בשימוש')}`}
              icon={TrendingUp}
              color="purple"
            />
            <MetricCard
              title={getText('Available Cash', 'מזומן זמין')}
              value={`${new Intl.NumberFormat('en-US', { style: 'currency', currency: currentAccount?.currency || 'USD' }).format(availableCash)}`}
              subValue={`${availableCashPercentage.toFixed(1)}% ${getText('available', 'זמין')}`}
              icon={DollarSign}
              color={"emerald"}
            />
            <MetricCard
              title={getText('Open Trades Risk', 'סיכון בעסקאות פתוחות')}
              value={`-${new Intl.NumberFormat('en-US', { style: 'currency', currency: currentAccount?.currency || 'USD' }).format(totalRisk)}`}
              valueAnnotation={`${riskPercentageOfPositions.toFixed(1)}%`}
              subValue={`${riskPercentageOfAccount.toFixed(1)}% ${getText('of account', 'מהחשבון')}`}
              icon={Shield}
              color="red"
            />
          </div>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5" />{getText('Open Trades', 'עסקאות פתוחות')}</CardTitle></CardHeader>
            <CardContent>
              <OpenTradesTable
                trades={openTrades}
                isLoading={isLoading}
                account={currentAccount}
                onCloseClick={(trade) => setTradeToClose(trade)}
                onEditClick={handleEditClick}
                onAddQuantityClick={(trade) => setTradeToAddQuantity(trade)}
                onViewClick={handleViewClick}
                onDeleteClick={handleDeleteTrade}
                deletingTradeId={deletingTradeId}
                totalPositionValue={totalPositionValue}
                totalRiskValue={totalRisk}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><TrendingDown className="w-5 h-5" />{getText('Closed Trades', 'עסקאות סגורות')}</CardTitle></CardHeader>
            <CardContent>
              <ClosedTradesTable
                trades={closedTrades}
                isLoading={isLoading}
                account={currentAccount}
                onViewClick={handleViewClick}
                onEditClick={handleEditClick}
                onDeleteClick={handleDeleteTrade}
                deletingTradeId={deletingTradeId}
                totalRealizedPL={totalRealizedPL}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><CalendarDays className="w-5 h-5" />{getText('Trading Calendar', 'לוח שנה מסחר')}</CardTitle></CardHeader>
            <CardContent className="p-4">
              <TradingCalendar trades={validTrades} onTradeClick={handleViewClick} />
            </CardContent>
          </Card>

          <WinRateStats trades={closedTrades} />
        </>
      )}

      <NewTradeModal isOpen={showNewTradeModal} onClose={() => { setShowNewTradeModal(false); setTradeToEdit(null); }} onSubmit={handleNewOrUpdateTrade} settings={currentAccount} trade={tradeToEdit} accountId={currentAccount?.id} />
      <CloseTradeModal isOpen={!!tradeToClose} onClose={() => setTradeToClose(null)} trade={tradeToClose} onSubmit={handleCloseTrade} settings={currentAccount} />
      <AddQuantityModal isOpen={!!tradeToAddQuantity} onClose={() => setTradeToAddQuantity(null)} trade={tradeToAddQuantity} onSubmit={handleAddQuantity} settings={currentAccount} />
      <TradeDetailModal isOpen={!!tradeToView} onClose={() => setTradeToView(null)} trade={tradeToView} onEditEvent={handleEditEvent} />
    </div>
  );
}