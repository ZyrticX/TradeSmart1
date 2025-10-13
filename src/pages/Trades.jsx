
import React, { useState, useEffect } from "react";
import { Trade, Account, TradeEvent, normalizeAccount } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, TrendingUp, TrendingDown, Eye, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import NewTradeModal from "../components/trades/NewTradeModal";
import CloseTradeModal from "../components/trades/CloseTradeModal";
import AddQuantityModal from "../components/trades/AddQuantityModal";
import TradeDetailModal from "../components/trades/TradeDetailModal";
import OpenTradesTable from "../components/dashboard/OpenTradesTable";
import DateFilterButtons from "../components/trades/DateFilterButtons";
import ClosedTradesTable from "../components/dashboard/ClosedTradesTable";

export default function Trades() {
  const [trades, setTrades] = useState([]);
  const [filteredTrades, setFilteredTrades] = useState([]);
  const [showNewTradeModal, setShowNewTradeModal] = useState(false);
  const [tradeToEdit, setTradeToEdit] = useState(null);
  const [tradeToClose, setTradeToClose] = useState(null);
  const [tradeToAddQuantity, setTradeToAddQuantity] = useState(null);
  const [tradeToView, setTradeToView] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [deletingTradeId, setDeletingTradeId] = useState(null);
  const [dateFilter, setDateFilter] = useState({ from: null, to: null });
  
  const language = localStorage.getItem('language') || 'en';
  const isRTL = language === 'he';

  const currentAccountId = localStorage.getItem('currentAccountId');

  const getText = (en, he) => {
    switch(language) {
        case 'he': return he;
        default: return en;
    }
  };

  useEffect(() => {
    if (currentAccountId) {
        loadData();
    } else {
        setIsLoading(false);
    }
  }, [currentAccountId]);

  useEffect(() => {
    filterTrades();
  }, [trades, searchTerm, dateFilter]);

  const loadData = async () => {
    setIsLoading(true);
    setTrades([]); 
    setFilteredTrades([]);
    try {
      const [tradesData, accountData] = await Promise.all([
        Trade.filter({ account_id: currentAccountId }, '-date_time'),
        Account.get(currentAccountId)
      ]);
      
      if (!accountData) {
        console.warn('⚠️ Account not found:', currentAccountId);
        localStorage.removeItem('currentAccountId');
        setCurrentAccount(null);
        setTrades([]);
      } else {
        setTrades(tradesData);
        setCurrentAccount(normalizeAccount(accountData));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setIsLoading(false);
  };

  const filterTrades = () => {
    let filtered = trades;
    if (searchTerm) {
      filtered = filtered.filter(trade => 
        trade.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.strategy?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (dateFilter.from && dateFilter.to) {
        filtered = filtered.filter(trade => {
            const tradeDate = new Date(trade.date_time);
            return tradeDate.getTime() >= dateFilter.from.getTime() && tradeDate.getTime() <= dateFilter.to.getTime();
        });
    }

    setFilteredTrades(filtered);
  };

  const handleNewOrUpdateTrade = async (tradeData, eventData) => {
    if (tradeToEdit) {
      await Trade.update(tradeToEdit.id, tradeData);
    } else {
      const newTrade = await Trade.create(tradeData);
      if(eventData) await TradeEvent.create({ ...eventData, trade_id: newTrade.id });
    }
    setShowNewTradeModal(false);
    setTradeToEdit(null);
    loadData();
  };

  const handleEditClick = (trade) => {
    setTradeToEdit(trade);
    setShowNewTradeModal(true);
  };
  
  const handleViewClick = (trade) => {
    setTradeToView(trade);
  };

  const handleCloseTrade = async (tradeId, closeData, eventData) => {
    await Trade.update(tradeId, closeData);
    if(eventData) await TradeEvent.create({ ...eventData, trade_id: tradeId });
    setTradeToClose(null);
    loadData();
  };

  const handleDeleteTrade = async (tradeId) => {
    if (deletingTradeId) return;

    if (window.confirm(getText("Are you sure you want to delete this trade permanently? This will delete all associated events.", "האם אתה בטוח שברצונך למחוק עסקה זו לצמיתות? פעולה זו תמחק את כל האירועים הקשורים."))) {
      setDeletingTradeId(tradeId);
      
      try {
        const events = await TradeEvent.filter({ trade_id: tradeId });
        for (const event of events) {
          await TradeEvent.delete(event.id);
        }
        await Trade.delete(tradeId);
        loadData();
      } catch (error) {
        console.error('Error deleting trade:', error);
        alert(getText("Failed to delete trade. Please try again.", "נכשל במחיקת העסקה. אנא נסה שוב."));
      }
      setDeletingTradeId(null);
    }
  };

  const handleAddQuantity = async (tradeId, updateData, eventData) => {
    await Trade.update(tradeId, updateData);
    if(eventData) await TradeEvent.create({ ...eventData, trade_id: tradeId });
    setTradeToAddQuantity(null);
    loadData();
  };

  const openTrades = filteredTrades.filter(trade => trade.status === 'open');
  const closedTrades = filteredTrades.filter(trade => trade.status === 'closed');
  const totalPositionValue = openTrades.reduce((sum, trade) => sum + (trade.position_size || 0), 0);
  const totalRisk = openTrades.reduce((sum, trade) => sum + (trade.risk_amount || 0), 0);
  const totalRealizedPL = closedTrades.reduce((sum, trade) => sum + (trade.profit_loss || 0), 0);

  if (!currentAccountId) {
      return <div className="p-6 text-center text-gray-600">{getText('Please select an account from the settings to view trades.', 'אנא בחר חשבון מההגדרות כדי להציג עסקאות.')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{getText('Trades Management', 'ניהול עסקאות')}</h1>
          <p className="text-gray-600 mt-1">{getText('Managing trades for account:', 'ניהול פוזיציות מסחר עבור חשבון:')} <span className="font-semibold">{currentAccount?.name}</span></p>
        </div>
        <Button 
          onClick={() => {
            setTradeToEdit(null);
            setShowNewTradeModal(true);
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Plus className="w-4 h-4 mx-2" />
          {getText('New Trade', 'עסקה חדשה')}
        </Button>
      </div>

      {currentAccount && (
        <>
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder={getText('Search trades by symbol, strategy...', 'חפש עסקאות לפי סימבול, אסטרטגיה...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="ps-10"
                />
              </div>
              <DateFilterButtons onFilterChange={setDateFilter} language={language} />
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                {getText('Open Trades', 'עסקאות פתוחות')} ({openTrades.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
               <OpenTradesTable
                trades={openTrades}
                isLoading={isLoading}
                account={currentAccount}
                onCloseClick={(trade) => setTradeToClose(trade)}
                onAddQuantityClick={(trade) => setTradeToAddQuantity(trade)}
                onEditClick={handleEditClick}
                onDeleteClick={handleDeleteTrade}
                onViewClick={handleViewClick}
                deletingTradeId={deletingTradeId}
                totalPositionValue={totalPositionValue}
                totalRiskValue={totalRisk}
              />
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5" />
                {getText('Closed Trades', 'עסקאות סגורות')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ClosedTradesTable
                trades={filteredTrades.filter(t => t.status === 'closed')}
                isLoading={isLoading}
                account={currentAccount}
                onViewClick={handleViewClick}
                onEditClick={handleEditClick}
                onDeleteClick={handleDeleteTrade}
                deletingTradeId={deletingTradeId}
                totalRealizedPL={filteredTrades.filter(t => t.status === 'closed').reduce((sum, trade) => sum + (trade.profit_loss || 0), 0)}
              />
            </CardContent>
          </Card>
        </>
      )}

      <NewTradeModal 
        isOpen={showNewTradeModal}
        onClose={() => {
          setShowNewTradeModal(false);
          setTradeToEdit(null);
        }}
        onSubmit={handleNewOrUpdateTrade}
        settings={currentAccount}
        trade={tradeToEdit}
        accountId={currentAccountId}
      />
      
      <CloseTradeModal
        isOpen={!!tradeToClose}
        onClose={() => setTradeToClose(null)}
        trade={tradeToClose}
        onSubmit={handleCloseTrade}
        settings={currentAccount}
      />

      <AddQuantityModal
        isOpen={!!tradeToAddQuantity}
        onClose={() => setTradeToAddQuantity(null)}
        trade={tradeToAddQuantity}
        onSubmit={handleAddQuantity}
        settings={currentAccount}
      />

      <TradeDetailModal
        isOpen={!!tradeToView}
        onClose={() => setTradeToView(null)}
        trade={tradeToView}
        onEditEvent={(event) => console.log("Edit event:", event)}
      />
    </div>
  );
}
