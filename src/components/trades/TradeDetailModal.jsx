import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, Calendar, DollarSign, Target, Shield, Star, BarChart3, RefreshCw, Edit, X, Check, Trash2, Image } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Trade, TradeEvent } from "@/api/entities";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ImageGallery from "./ImageGallery";

// Helper to parse event notes for commission
const parseEventNotes = (notes) => {
  const commissionMatch = notes?.match(/Commission: \$([\d.,]+)/);
  const commission = commissionMatch ? parseFloat(commissionMatch[1].replace(/,/g, '')) : 0;
  const notesWithoutCommission = notes?.replace(/(\r\n|\n|\r)?Commission: \$[\d.,]+/, '').trim();
  return { commission, notesWithoutCommission };
};

// Color coding for event types
const getEventTypeColor = (eventType) => {
  if (eventType === 'buy' || eventType === 'add') return 'bg-blue-100 text-blue-800';
  if (eventType === 'sell') return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-800';
};

const EventRow = ({ event, isEditing, onEdit, onCancel, onSave, onDelete, isRTL, getText, formatCurrency, formatNumber }) => {
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    if (isEditing && event) {
      const { commission, notesWithoutCommission } = parseEventNotes(event.notes);
      
      let formattedDate = '';
      if (event.date) {
        try {
          const dateObj = new Date(event.date);
          if (!isNaN(dateObj.getTime())) {
            formattedDate = format(dateObj, "yyyy-MM-dd'T'HH:mm");
          }
        } catch (error) {
          console.error('Error formatting date for edit:', error);
        }
      }
      
      setEditData({
        ...event,
        notes: notesWithoutCommission,
        commission: commission,
        date: formattedDate,
      });
    } else {
      setEditData(null);
    }
  }, [isEditing, event]);

  const handleInputChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  if (!event) {
    return null;
  }

  const safeDate = event.date ? (() => {
    try {
      const date = new Date(event.date);
      return isNaN(date.getTime()) ? 'N/A' : format(date, 'dd/MM HH:mm'); 
    } catch (error) {
      console.error('Error formatting display date:', error);
      return 'Invalid Date';
    }
  })() : 'N/A';
  
  const { commission, notesWithoutCommission } = parseEventNotes(event.notes);
  
  const rowClass = (event.type === 'buy' || event.type === 'add') ? 'bg-green-50/50' : (event.type === 'sell' ? 'bg-red-50/50' : '');

  if (isEditing && editData) {
    return (
      <TableRow className={`bg-gray-100 ${rowClass}`}>
        <TableCell className="p-2"><Input type="datetime-local" value={editData.date || ''} onChange={e => handleInputChange('date', e.target.value)} className="h-8 text-sm w-full" /></TableCell>
        <TableCell className="p-2">
          <div className={`px-2 py-1 rounded text-sm font-medium ${getEventTypeColor(event.type)}`}>
            {getText(event.type || 'unknown', event.type || 'unknown', event.type || 'unknown')}
          </div>
        </TableCell>
        <TableCell className="p-2"><Input type="number" value={editData.quantity || 0} onChange={e => handleInputChange('quantity', e.target.value)} className="h-8 w-full text-sm" /></TableCell>
        <TableCell className="p-2"><Input type="number" step="0.01" value={editData.price || 0} onChange={e => handleInputChange('price', e.target.value)} className="h-8 w-full text-sm" /></TableCell>
        <TableCell className="p-2 text-sm">{formatCurrency((parseFloat(editData.quantity) || 0) * (parseFloat(editData.price) || 0))}</TableCell>
        <TableCell className="p-2"><Input type="number" step="0.01" value={editData.stop_loss_at_event || 0} onChange={e => handleInputChange('stop_loss_at_event', e.target.value)} className="h-8 w-full text-sm" /></TableCell>
        <TableCell className="p-2"><Input value={editData.notes || ''} onChange={e => handleInputChange('notes', e.target.value)} className="h-8 text-sm w-full" /></TableCell>
        <TableCell className="p-2"><Input type="number" step="0.01" value={editData.commission || 0} onChange={e => handleInputChange('commission', e.target.value)} className="h-8 w-full text-sm" /></TableCell>
        <TableCell className="p-2 text-center">
          {editData.screenshot_url && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(editData.screenshot_url, '_blank')}
              className="h-8 w-8 p-0"
              title={getText('View screenshot', 'צפה בצילום מסך')}
            >
              <Image className="w-4 h-4" />
            </Button>
          )}
        </TableCell>
        <TableCell className="p-2">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => onSave(editData)} className="text-purple-500 hover:text-purple-700 h-8 w-8 p-0"><Check className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" onClick={onCancel} className="text-red-500 hover:text-red-700 h-8 w-8 p-0"><X className="w-4 h-4" /></Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow className={`${isRTL ? 'text-right' : 'text-left'} ${rowClass} hover:bg-gray-50`}>
      <TableCell className="p-2 text-sm font-medium">{safeDate}</TableCell>
      <TableCell className="p-2">
        <div className={`inline-flex px-2 py-1 rounded text-sm font-medium ${getEventTypeColor(event.type)}`}>
          {getText(event.type || 'unknown', event.type || 'unknown', event.type || 'unknown')}
        </div>
      </TableCell>
      <TableCell className="p-2 text-sm text-center font-semibold">{formatNumber(event.quantity || 0)}</TableCell>
      <TableCell className="p-2 text-sm font-semibold">{formatCurrency(event.price || 0)}</TableCell>
      <TableCell className="p-2 text-sm font-bold">{formatCurrency((event.quantity || 0) * (event.price || 0))}</TableCell>
      <TableCell className="p-2 text-sm">{formatCurrency(event.stop_loss_at_event || 0)}</TableCell>
      <TableCell className="p-2 text-sm">
        <div className="max-w-[150px] break-words whitespace-pre-wrap" title={notesWithoutCommission}>
          {notesWithoutCommission || getText('No notes', 'אין הערות')}
        </div>
      </TableCell>
      <TableCell className="p-2 text-sm text-red-600 font-medium">{formatCurrency(commission)}</TableCell>
      <TableCell className="p-2 text-center">
        {event.screenshot_url && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(event.screenshot_url, '_blank')}
            className="h-8 w-8 p-0"
            title={getText('View screenshot', 'צפה בצילום מסך')}
          >
            <Image className="w-4 h-4" />
          </Button>
        )}
      </TableCell>
      <TableCell className="p-2">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => onEdit(event)} className="h-8 w-8 p-0"><Edit className="w-4 h-4" /></Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(event.id)} className="text-red-500 hover:text-red-700 h-8 w-8 p-0"><Trash2 className="w-4 h-4" /></Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

const MobileEventCard = ({ event, getText, formatNumber, formatCurrency, onEdit, onDelete }) => {
  const { commission, notesWithoutCommission } = parseEventNotes(event.notes);

  const displayDate = event.date ? (() => {
    try {
      const date = new Date(event.date);
      return isNaN(date.getTime()) ? 'N/A' : format(date, 'dd MMM yyyy, HH:mm');
    } catch (error) {
      console.error('Error formatting display date for mobile card:', error);
      return 'Invalid Date';
    }
  })() : 'N/A';

  return (
    <Card className="mb-4 border-l-4" style={{borderLeftColor: event.type === 'sell' ? '#ef4444' : '#3b82f6'}}>
      <CardHeader className="p-4 flex flex-row items-center justify-between">
        <div>
          <div className={`inline-flex px-3 py-1 rounded text-sm font-medium mb-2 ${getEventTypeColor(event.type)}`}>
            {getText(event.type || 'unknown', event.type || 'unknown', event.type || 'unknown')}
          </div>
          <p className="text-sm text-gray-600 font-medium">{displayDate}</p>
        </div>
        <div className="flex items-center gap-2">
          {event.screenshot_url && (
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => window.open(event.screenshot_url, '_blank')} title={getText('View screenshot', 'צפה בצילום מסך')}>
              <Image className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(event)} title={getText('Edit event', 'ערוך אירוע')}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => onDelete(event.id)} title={getText('Delete event', 'מחק אירוע')}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="grid grid-cols-3 gap-4 text-center mb-4 bg-gray-50 rounded-lg p-3">
          <div>
            <p className="text-sm text-gray-500 font-medium">{getText('Quantity', 'כמות')}</p>
            <p className="font-bold text-lg">{formatNumber(event.quantity || 0)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">{getText('Price', 'מחיר')}</p>
            <p className="font-bold text-lg">{formatCurrency(event.price || 0)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">{getText('Total Value', 'ערך כולל')}</p>
            <p className="font-bold text-lg">{formatCurrency((event.quantity || 0) * (parseFloat(event.price) || 0))}</p>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 font-medium">{getText('Stop Loss', 'סטופ לוס')}:</span>
            <span className="font-semibold">{formatCurrency(event.stop_loss_at_event || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 font-medium">{getText('Commission', 'עמלה')}:</span>
            <span className="text-red-600 font-semibold">{formatCurrency(commission)}</span>
          </div>
          {notesWithoutCommission && (
            <div className="pt-2 border-t">
              <p className="text-gray-600 font-medium mb-1">{getText('Notes', 'הערות')}:</p>
              <p className="text-sm italic whitespace-pre-wrap break-words bg-gray-50 p-2 rounded">{notesWithoutCommission}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const EventEditCard = ({ event, onSave, onCancel, getText }) => {
    const [editData, setEditData] = useState(null);

    useEffect(() => {
        if (event) {
            const { commission, notesWithoutCommission } = parseEventNotes(event.notes);
            let formattedDate = '';
            if (event.date) {
                try {
                    const dateObj = new Date(event.date);
                    if (!isNaN(dateObj.getTime())) {
                        formattedDate = format(dateObj, "yyyy-MM-dd'T'HH:mm");
                    }
                } catch (error) { console.error('Error formatting date:', error); }
            }
            setEditData({
                ...event,
                notes: notesWithoutCommission,
                commission: commission,
                date: formattedDate,
            });
        }
    }, [event]);

    const handleInputChange = (field, value) => {
        setEditData(prev => ({ ...prev, [field]: value }));
    };

    if (!editData) return null;

    return (
        <Card className="mb-4 bg-blue-50 border-2 border-blue-300 p-4">
            <CardHeader className="p-0 pb-3">
                <CardTitle className="text-lg font-semibold">{getText('Edit Event', 'ערוך אירוע')}</CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor={`edit-date-${event.id}`} className="text-sm font-medium">{getText('Date', 'תאריך')}</Label>
                    <Input id={`edit-date-${event.id}`} type="datetime-local" value={editData.date || ''} onChange={e => handleInputChange('date', e.target.value)} className="h-10" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor={`edit-quantity-${event.id}`} className="text-sm font-medium">{getText('Quantity', 'כמות')}</Label>
                        <Input id={`edit-quantity-${event.id}`} type="number" value={editData.quantity || ''} onChange={e => handleInputChange('quantity', e.target.value)} className="h-10" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`edit-price-${event.id}`} className="text-sm font-medium">{getText('Price', 'מחיר')}</Label>
                        <Input id={`edit-price-${event.id}`} type="number" step="0.01" value={editData.price || ''} onChange={e => handleInputChange('price', e.target.value)} className="h-10" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor={`edit-stoploss-${event.id}`} className="text-sm font-medium">{getText('Stop Loss', 'סטופ לוס')}</Label>
                    <Input id={`edit-stoploss-${event.id}`} type="number" step="0.01" value={editData.stop_loss_at_event || ''} onChange={e => handleInputChange('stop_loss_at_event', e.target.value)} className="h-10" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor={`edit-notes-${event.id}`} className="text-sm font-medium">{getText('Notes', 'הערות')}</Label>
                    <Input id={`edit-notes-${event.id}`} value={editData.notes || ''} onChange={e => handleInputChange('notes', e.target.value)} className="h-10" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor={`edit-commission-${event.id}`} className="text-sm font-medium">{getText('Commission', 'עמלה')}</Label>
                    <Input id={`edit-commission-${event.id}`} type="number" step="0.01" value={editData.commission || ''} onChange={e => handleInputChange('commission', e.target.value)} className="h-10" />
                </div>
                <div className="flex justify-end gap-3 pt-3">
                    <Button variant="ghost" onClick={onCancel}>
                        {getText('Cancel', 'ביטול')}
                    </Button>
                    <Button onClick={() => onSave(editData)} className="bg-purple-600 hover:bg-purple-700">
                        {getText('Save Changes', 'שמור שינויים')}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default function TradeDetailModal({ isOpen, onClose, trade, onEditEvent }) {
  const [currentTrade, setCurrentTrade] = useState(null);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  
  const language = localStorage.getItem('language') || 'en';
  const isRTL = language === 'he';

  const getText = (en, he) => {
    switch(language) {
      case 'he': return he;
      default: return en;
    }
  };

  const formatNumber = (value) => {
    if (typeof value === 'string') value = parseFloat(value);
    if (typeof value !== 'number' || isNaN(value)) return '0';
    return new Intl.NumberFormat('en-US').format(value);
  };

  const formatCurrency = (value) => {
    if (typeof value === 'string') value = parseFloat(value);
    if (typeof value !== 'number' || isNaN(value)) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const handleClose = () => onClose();

  // Reset state when modal opens/closes or trade changes
  useEffect(() => {
    if (isOpen && trade) {
      if (!trade.id) {
        setFetchError(getText('Invalid trade data received.', 'התקבלו נתוני עסקה לא תקינים.'));
        setCurrentTrade(null);
        setEvents([]);
        setIsLoading(false);
        return;
      }
      
      setCurrentTrade(trade);
      setFetchError(null);
      setEditingEventId(null);
      fetchData(trade);
    } else if (!isOpen) {
      setCurrentTrade(null);
      setEvents([]);
      setFetchError(null);
      setEditingEventId(null);
      setIsLoading(false);
    }
  }, [isOpen, trade]);

  const fetchData = async (tradeToFetch) => {
    if (!tradeToFetch?.id) {
      setFetchError(getText('No trade selected.', 'לא נבחרה עסקה.'));
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setFetchError(null);
    
    try {
      let tradeData = tradeToFetch;
      try {
        const freshTradeData = await Trade.get(tradeToFetch.id);
        tradeData = freshTradeData;
      } catch (tradeError) {
        console.warn('Could not fetch fresh trade data, using cached data:', tradeError);
      }

      let tradeEvents = [];
      try {
        tradeEvents = await TradeEvent.filter({ trade_id: tradeToFetch.id }, 'date');
      } catch (eventsError) {
        console.warn('Could not fetch trade events:', eventsError);
      }

      // Recalculate trade data using fetched events
      const recalculatedTrade = recalculateTradeFromEvents(tradeData, tradeEvents);

      setCurrentTrade(recalculatedTrade);
      setEvents(tradeEvents);
    } catch (error) {
      console.error('Error in fetchData:', error);
      setFetchError(getText('Error loading trade details. The trade may have been deleted.', 'שגיאה בטעינת פרטי העסקה. ייתכן שהעסקה נמחקה.'));
      setCurrentTrade(tradeToFetch);
      setEvents([]);
    }
    setIsLoading(false);
  };

  const recalculateTradeFromEvents = (tradeData, eventList) => {
    let totalQuantity = 0; 
    let totalInvestment = 0; 
    let realizedPL = 0;
    let totalCommission = 0;
    let currentQuantity = 0; 
    let positionSize = 0; 
    let latestStopLoss = 0;

    const sortedEventList = [...eventList].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const buys = sortedEventList.filter(e => e.type === 'buy' || e.type === 'add');
    const sells = sortedEventList.filter(e => e.type === 'sell' || e.type === 'remove'); 

    let totalBuyQty = 0;
    let totalBuyValue = 0;
    buys.forEach(e => {
        totalBuyQty += parseFloat(e.quantity) || 0;
        totalBuyValue += (parseFloat(e.quantity) || 0) * (parseFloat(e.price) || 0);
        const { commission } = parseEventNotes(e.notes);
        totalCommission += commission;
        if (e.stop_loss_at_event && parseFloat(e.stop_loss_at_event) > 0) {
          latestStopLoss = parseFloat(e.stop_loss_at_event);
        }
    });

    let totalSellQty = 0;
    let totalSellValue = 0;
    sells.forEach(e => {
        totalSellQty += parseFloat(e.quantity) || 0;
        totalSellValue += (parseFloat(e.quantity) || 0) * (parseFloat(e.price) || 0);
        const { commission } = parseEventNotes(e.notes);
        totalCommission += commission;
        if (e.stop_loss_at_event && parseFloat(e.stop_loss_at_event) > 0) {
          latestStopLoss = parseFloat(e.stop_loss_at_event);
        }
    });
    
    const avgBuyPrice = totalBuyQty > 0 ? totalBuyValue / totalBuyQty : 0;
    const avgSellPrice = totalSellQty > 0 ? totalSellValue / totalSellQty : 0;
    
    realizedPL = (totalSellValue - (avgBuyPrice * totalSellQty));
    
    totalQuantity = totalBuyQty; 
    totalInvestment = totalBuyValue; 
    currentQuantity = totalBuyQty - totalSellQty; 
    positionSize = currentQuantity * avgBuyPrice; 

    const isClosed = currentQuantity <= 0;
    
    const finalStopPrice = latestStopLoss > 0 ? latestStopLoss : (tradeData.stop_price || 0);
    
    let riskAmount = 0;
    if (!isClosed && currentQuantity > 0 && avgBuyPrice > 0 && finalStopPrice > 0) {
      if (tradeData.direction === 'long') {
        riskAmount = Math.max(0, avgBuyPrice - finalStopPrice) * currentQuantity;
      } else {
        riskAmount = Math.max(0, finalStopPrice - avgBuyPrice) * currentQuantity;
      }
    }

    return {
        ...tradeData,
        entry_price: avgBuyPrice,
        quantity: currentQuantity,
        total_quantity: totalQuantity,
        position_size: positionSize,
        total_investment: totalInvestment,
        profit_loss: realizedPL - totalCommission,
        total_commission: totalCommission,
        status: isClosed ? 'closed' : 'open',
        stop_price: finalStopPrice,
        risk_amount: riskAmount,
        is_partially_closed: sells.length > 0 && !isClosed,
    };
  };

  const handleSaveEvent = async (updatedEventData) => {
    if (!currentTrade?.id) {
      alert(getText('Cannot save event: Trade not found', 'לא ניתן לשמור אירוע: עסקה לא נמצאה'));
      return;
    }

    try {
      const commissionAmount = parseFloat(updatedEventData.commission) || 0;
      const finalNotes = commissionAmount > 0 
        ? `${updatedEventData.notes ? updatedEventData.notes + '\n' : ''}Commission: $${commissionAmount}`
        : updatedEventData.notes;

      const eventToUpdate = {
        date: updatedEventData.date,
        quantity: parseFloat(updatedEventData.quantity) || 0,
        price: parseFloat(updatedEventData.price) || 0,
        stop_loss_at_event: parseFloat(updatedEventData.stop_loss_at_event) || 0,
        notes: finalNotes
      };
      
      await TradeEvent.update(updatedEventData.id, eventToUpdate);
      
      const updatedEvents = await TradeEvent.filter({ trade_id: currentTrade.id }, 'date');
      const recalculatedTrade = recalculateTradeFromEvents(currentTrade, updatedEvents);
      
      try {
        await Trade.update(currentTrade.id, recalculatedTrade);
      } catch (updateError) {
        console.warn('Could not update trade, but event was saved:', updateError);
      }

      setCurrentTrade(recalculatedTrade);
      setEvents(updatedEvents);
      setEditingEventId(null);
    } catch(error) {
      console.error("Failed to save event:", error);
      alert(getText('Failed to save event. Please try again.', 'נכשל בשמירת האירוע. אנא נסה שוב.'));
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!currentTrade?.id) {
      alert(getText('Cannot delete event: Trade not found', 'לא ניתן למחוק אירוע: עסקה לא נמצאה'));
      return;
    }

    if (window.confirm(getText('Are you sure you want to delete this event?', 'האם למחוק אירוע זה?'))) {
      try {
        await TradeEvent.delete(eventId);
        
        const updatedEvents = await TradeEvent.filter({ trade_id: currentTrade.id }, 'date');
        
        if (updatedEvents.length === 0) {
          try {
            await Trade.delete(currentTrade.id);
          } catch (deleteTradeError) {
            console.warn('Could not delete trade:', deleteTradeError);
          }
          onClose();
          return;
        }
        
        const recalculatedTrade = recalculateTradeFromEvents(currentTrade, updatedEvents);
        try {
          await Trade.update(currentTrade.id, recalculatedTrade);
        } catch (updateError) {
          console.warn('Could not update trade after event deletion:', updateError);
        }
        
        setCurrentTrade(recalculatedTrade);
        setEvents(updatedEvents);
      } catch (error) {
        console.error("Failed to delete event:", error);
        alert(getText('Failed to delete event. Please try again.', 'נכשל במחיקת האירוע. אנא נסה שוב.'));
      }
    }
  };

  const renderStars = (count) => {
    if (!count) return <span className="text-gray-400 text-sm">{getText('Not rated', 'לא דורג')}</span>;
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className={`w-4 h-4 ${i < count ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
        ))}
      </div>
    );
  };

  // Calculate exit summary for closed trades
  const getExitSummary = () => {
    if (!currentTrade || currentTrade.status !== 'closed' || events.length === 0) return null;
    
    const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const firstBuyEvent = sortedEvents.find(e => e.type === 'buy' || e.type === 'add');
    const lastSellEvent = [...sortedEvents].reverse().find(e => e.type === 'sell');
    
    if (!firstBuyEvent || !lastSellEvent) return null;
    
    return {
      entryDate: firstBuyEvent.date,
      entryPrice: firstBuyEvent.price,
      entryQuantity: currentTrade.total_quantity,
      exitDate: lastSellEvent.date,
      exitPrice: lastSellEvent.price,
      exitQuantity: currentTrade.total_quantity,
      totalPL: currentTrade.profit_loss
    };
  };

  if (!currentTrade && !isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{getText('Trade Not Available', 'עסקה לא זמינה')}</DialogTitle>
            <DialogDescription>
              {fetchError || getText('This trade is no longer available.', 'עסקה זו כבר לא זמינה.')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={handleClose}>{getText('Close', 'סגור')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!currentTrade) return null;

  const pnl = currentTrade.profit_loss || 0;
  const totalQuantity = currentTrade.total_quantity || currentTrade.quantity || 0;
  const currentQuantity = currentTrade.quantity || 0; 
  const avgEntryPrice = currentTrade.entry_price || 0;
  const totalInvestment = currentTrade.total_investment || (totalQuantity * avgEntryPrice); 
  const currentPositionValue = currentTrade.position_size || (currentQuantity * avgEntryPrice);
  const totalCommissions = currentTrade.total_commission || 0;
  const riskAmount = currentTrade.risk_amount || 0;
  const exitSummary = getExitSummary();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0 border-b pb-4">
          <DialogTitle className="text-xl font-bold flex items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
              {currentTrade.direction === 'long' ? 
                <div className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  {getText('Long Position', 'פוזיציה לונג')}
                </div> : 
                <div className="bg-red-100 text-red-800 px-3 py-1 rounded-lg font-semibold flex items-center gap-2">
                  <TrendingDown className="w-5 h-5" />
                  {getText('Short Position', 'פוזיציה שורט')}
                </div>
              }
              <span className="text-2xl font-bold">{currentTrade.symbol}</span>
              <Badge variant={currentTrade.status === 'open' ? 'default' : 'secondary'} className="text-sm px-3 py-1">
                {currentTrade.status === 'open' ? getText('Open', 'פתוח') : getText('Closed', 'סגור')}
              </Badge>
            </div>
          </DialogTitle>
          <DialogDescription className="text-base text-gray-600 flex items-center gap-4 flex-wrap">
            <span>{getText('Complete trade analysis and transaction history', 'ניתוח מלא של העסקה והיסטוריית העסקאות')}</span>
            <Button variant="outline" onClick={() => fetchData(currentTrade)} size="sm" disabled={isLoading} className="ml-auto">
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {getText('Refresh', 'רענן')}
            </Button>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto p-6 space-y-6">
          {/* Performance Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4 text-center">
                <DollarSign className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <p className="text-sm text-blue-700 font-medium">{getText('Total Investment', 'השקעה כוללת')}</p>
                <p className="text-xl font-bold text-blue-900">{formatCurrency(totalInvestment)}</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4 text-center">
                <BarChart3 className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <p className="text-sm text-purple-700 font-medium">{getText('Current Position', 'פוזיציה נוכחית')}</p>
                <p className="text-xl font-bold text-purple-900">{formatCurrency(currentPositionValue)}</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-4 text-center">
                <Shield className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                <p className="text-sm text-orange-700 font-medium">{getText('Risk Amount', 'סכום סיכון')}</p>
                <p className="text-xl font-bold text-red-700">-{formatCurrency(riskAmount)}</p>
              </CardContent>
            </Card>

            <Card className={`bg-gradient-to-br ${pnl >= 0 ? 'from-emerald-50 to-emerald-100 border-emerald-200' : 'from-red-50 to-red-100 border-red-200'}`}>
              <CardContent className="p-4 text-center">
                <Target className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
                <p className="text-sm font-medium">{getText('Realized P/L', 'רווח/הפסד ממומש')}</p>
                <p className={`text-xl font-bold ${pnl >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  {formatCurrency(pnl)}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Basic Information */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    {getText('Trade Information', 'מידע על העסקה')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-base text-gray-700 border-b pb-1">{getText('Basic Details', 'פרטים בסיסיים')}</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">{getText('Symbol:', 'סימבול:')}</span>
                          <span className="font-bold text-lg">{currentTrade.symbol}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">{getText('Strategy:', 'אסטרטגיה:')}</span>
                          <span className="font-semibold">{currentTrade.strategy || getText('N/A', 'לא זמין')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">{getText('Confidence:', 'רמת ביטחון:')}</span>
                          <div>{renderStars(currentTrade.confidence_level)}</div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">{getText('Entry Date:', 'תאריך כניסה:')}</span>
                          <span className="font-semibold">
                            {currentTrade.date_time ? format(new Date(currentTrade.date_time), 'dd MMM yyyy, HH:mm') : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-base text-gray-700 border-b pb-1">{getText('Position Details', 'פרטי פוזיציה')}</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">{getText('Total Shares:', 'מניות כוללות:')}</span>
                          <span className="font-bold">{formatNumber(totalQuantity)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">{getText('Current Shares:', 'מניות נוכחיות:')}</span>
                          <span className="font-bold">{formatNumber(currentQuantity)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">{getText('Avg Entry Price:', 'מחיר כניסה ממוצע:')}</span>
                          <span className="font-bold">{formatCurrency(avgEntryPrice)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">{getText('Stop Price:', 'מחיר סטופ:')}</span>
                          <span className="font-bold">{formatCurrency(currentTrade.stop_price || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">{getText('Target Price:', 'מחיר יעד:')}</span>
                          <span className="font-bold">{formatCurrency(currentTrade.target_price || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">{getText('Total Commissions:', 'עמלות כוללות:')}</span>
                          <span className="font-bold text-red-600">{formatCurrency(totalCommissions)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Exit Summary for Closed Trades */}
                  {exitSummary && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                      <h4 className="font-semibold text-base text-gray-700 mb-3 flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        {getText('Exit Summary', 'סיכום יציאה')}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600 font-medium">{getText('Entry Date:', 'תאריך כניסה:')}</span>
                            <span className="font-semibold">{format(new Date(exitSummary.entryDate), 'dd MMM yyyy')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 font-medium">{getText('Entry Price:', 'מחיר כניסה:')}</span>
                            <span className="font-semibold">{formatCurrency(exitSummary.entryPrice)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 font-medium">{getText('Entry Quantity:', 'כמות כניסה:')}</span>
                            <span className="font-semibold">{formatNumber(exitSummary.entryQuantity)}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600 font-medium">{getText('Exit Date:', 'תאריך יציאה:')}</span>
                            <span className="font-semibold">{format(new Date(exitSummary.exitDate), 'dd MMM yyyy')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 font-medium">{getText('Exit Price:', 'מחיר יציאה:')}</span>
                            <span className="font-semibold">{formatCurrency(exitSummary.exitPrice)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 font-medium">{getText('Total P/L:', 'רווח/הפסד כולל:')}</span>
                            <span className={`font-bold text-lg ${exitSummary.totalPL >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {formatCurrency(exitSummary.totalPL)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Image Gallery */}
            <div className="lg:col-span-1">
              <ImageGallery trade={currentTrade} events={events} onUpdate={() => fetchData(currentTrade)} getText={getText} />
            </div>
          </div>

          {/* Trade Events History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {getText('Trade Events History', 'היסטוריית אירועי עסקה')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-lg">{getText('Loading events...', 'טוען אירועים...')}</p>
                </div>
              ) : fetchError && events.length === 0 ? (
                <div className="text-center py-8 text-amber-600">
                  <p>{getText('Could not load events, but showing available trade data.', 'לא ניתן לטעון אירועים, אך מוצגים נתוני עסקה זמינים.')}</p>
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">{getText('No events recorded for this trade yet', 'עדיין לא נרשמו אירועים לעסקה זו')}</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden lg:block">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="font-semibold p-3">{getText('Date & Time', 'תאריך ושעה')}</TableHead>
                            <TableHead className="font-semibold p-3">{getText('Action', 'פעולה')}</TableHead>
                            <TableHead className="font-semibold p-3">{getText('Quantity', 'כמות')}</TableHead>
                            <TableHead className="font-semibold p-3">{getText('Price', 'מחיר')}</TableHead>
                            <TableHead className="font-semibold p-3">{getText('Total Value', 'ערך כולל')}</TableHead>
                            <TableHead className="font-semibold p-3">{getText('Stop Loss', 'סטופ לוס')}</TableHead>
                            <TableHead className="font-semibold p-3">{getText('Notes', 'הערות')}</TableHead>
                            <TableHead className="font-semibold p-3">{getText('Commission', 'עמלה')}</TableHead>
                            <TableHead className="font-semibold p-3">{getText('Image', 'תמונה')}</TableHead>
                            <TableHead className="font-semibold p-3">{getText('Actions', 'פעולות')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {events.map((event) => (
                            <EventRow
                              key={event.id}
                              event={event}
                              isEditing={editingEventId === event.id}
                              onEdit={(e) => setEditingEventId(e.id)}
                              onCancel={() => setEditingEventId(null)}
                              onSave={handleSaveEvent}
                              onDelete={handleDeleteEvent}
                              isRTL={isRTL}
                              getText={getText}
                              formatCurrency={formatCurrency}
                              formatNumber={formatNumber}
                            />
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                  
                  {/* Mobile Card List */}
                  <div className="lg:hidden space-y-4">
                     {events.map((event) => (
                         editingEventId === event.id ? (
                            <EventEditCard
                                key={`edit-${event.id}`}
                                event={event}
                                onSave={handleSaveEvent}
                                onCancel={() => setEditingEventId(null)}
                                getText={getText}
                            />
                         ) : (
                             <MobileEventCard
                                key={event.id}
                                event={event}
                                getText={getText}
                                formatNumber={formatNumber}
                                formatCurrency={formatCurrency}
                                onEdit={(e) => setEditingEventId(e.id)}
                                onDelete={handleDeleteEvent}
                             />
                         )
                     ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="flex-shrink-0 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={handleClose} className="px-6 py-2">
            {getText('Close', 'סגור')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}