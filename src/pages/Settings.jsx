
import React, { useState, useEffect } from "react";
import { Account } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Settings as SettingsIcon, DollarSign, Shield, Target, Plus, X, Banknote, Edit, Trash2 } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newStrategy, setNewStrategy] = useState('');
  const [newSentiment, setNewSentiment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const language = localStorage.getItem('language') || 'en';
  const isRTL = language === 'he';

  const getText = (en, he) => {
    switch(language) {
      case 'he': return he;
      default: return en;
    }
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat('en-US').format(number);
  };

  // Helper: Convert DB string/array to array
  const ensureArray = (value) => {
    if (Array.isArray(value)) return value;
    if (!value) return [];
    if (typeof value === 'string') {
      try {
        // Try to parse as JSON
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        // If not JSON, split by comma or return empty
        return value.includes(',') ? value.split(',').map(s => s.trim()) : [];
      }
    }
    return [];
  };

  const currentAccountId = localStorage.getItem('currentAccountId');

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setIsLoading(true);
    try {
        const accountsData = await Account.list();
        setAccounts(accountsData);
        if (accountsData.length > 0) {
          const currentId = localStorage.getItem('currentAccountId');
          const accountExists = currentId && accountsData.some(acc => acc.id === currentId);
          
          const accountToSelect = accountExists 
            ? accountsData.find(acc => acc.id === currentId)
            : accountsData[0];

          setSelectedAccount(accountToSelect);
        } else {
            setSelectedAccount(null);
        }
    } catch (error) {
        console.error('Error loading accounts:', error);
    }
    setIsLoading(false);
  };

  const handleSelectAccount = (accountId) => {
    const account = accounts.find(acc => acc.id === accountId);
    setSelectedAccount(account);
    setIsEditing(false);
  };

  const handleNewAccount = () => {
    if (!user) {
      console.error('❌ Cannot create account - user not authenticated');
      alert(getText('Please log in to create an account', 'אנא התחבר כדי ליצור חשבון'));
      return;
    }

    console.log('✅ Creating new account for user:', user.email);
    setSelectedAccount({
      name: '',
      user_id: user.id, // ✅ Add user_id
      currency: 'USD',
      account_size: 100000,
      default_risk_percentage: 2,
      max_account_risk_percentage: 6,
      max_position_size_percentage: 25,
      commission_fee: 8,
      strategies: [getText("Breakout", "פריצה"), getText("Pullback", "תיקון")],
      sentiments: [getText("Bullish", "שורי"), getText("Bearish", "דובי"), getText("Neutral", "ניטרלי")]
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!selectedAccount) return;
    setIsSaving(true);
    try {
      let savedAccount;
      if (selectedAccount.id) {
        // For updates, don't send user_id (it shouldn't change)
        const { user_id, ...updateData } = selectedAccount;
        await Account.update(selectedAccount.id, updateData);
        savedAccount = { ...selectedAccount, ...updateData }; // Preserve all data
      } else {
        // For new accounts, ensure user_id is included
        if (!user?.id) {
          console.error('❌ Cannot create account - user not authenticated');
          throw new Error('User not authenticated');
        }
        const accountData = { ...selectedAccount, user_id: user.id };
        savedAccount = await Account.create(accountData);
        localStorage.setItem('currentAccountId', savedAccount.id);
      }
      setIsEditing(false);
      await loadAccounts();
      
      if (!selectedAccount.id) {
        // Instead of reload, update localStorage and state
        console.log('✅ New account created, updating state...');
        localStorage.setItem('currentAccountId', savedAccount.id);

        // Update the currentAccount context if available
        if (window.currentAccountUpdater) {
          window.currentAccountUpdater(savedAccount);
        }

        // Refresh accounts list
        await loadAccounts();

        // Set as selected account
        setSelectedAccount(savedAccount);
      }
    } catch (error) {
      console.error('❌ Error saving account:', error);

      // Show more specific error messages
      let errorMessage = getText("Error saving account. Please try again.", "שגיאה בשמירת החשבון. אנא נסה שוב.");

      if (error.message?.includes('duplicate key')) {
        errorMessage = getText("Account name already exists. Please choose a different name.", "שם החשבון כבר קיים. אנא בחר שם אחר.");
      } else if (error.message?.includes('permission denied') || error.message?.includes('unauthorized')) {
        errorMessage = getText("You don't have permission to save this account.", "אין לך הרשאה לשמור חשבון זה.");
      } else if (error.message?.includes('foreign key')) {
        errorMessage = getText("Database error. Please contact support.", "שגיאת מסד נתונים. אנא פנה לתמיכה.");
      }

      alert(errorMessage);
    }
    setIsSaving(false);
  };
  
  const handleDelete = async (accountId) => {
      if (window.confirm(getText("Are you sure you want to delete this account? This action cannot be undone.", "האם אתה בטוח שברצונך למחוק חשבון זה? לא ניתן לשחזר פעולה זו."))) {
          try {
              await Account.delete(accountId);
              
              if (currentAccountId === accountId) {
                  localStorage.removeItem('currentAccountId');
              }
              
              await loadAccounts();
              
              if (currentAccountId === accountId) {
                  window.location.reload();
              }
          } catch(e) {
              console.error("Failed to delete account", e);
              alert(getText("Cannot delete account. Make sure all associated trades are deleted first.", "לא ניתן למחוק את החשבון. ודא שכל העסקאות המשויכות נמחקו תחילה."));
          }
      }
  }

  const handleInputChange = (field, value) => {
    setSelectedAccount(prev => ({
      ...prev,
      [field]: ['account_size', 'default_risk_percentage', 'max_account_risk_percentage', 'max_position_size_percentage', 'commission_fee'].includes(field) ? parseFloat(value) : value
    }));
  };

  const addToList = (listName, newItem, setNewItem) => {
      if (newItem.trim() && !selectedAccount[listName].includes(newItem.trim())) {
          setSelectedAccount(prev => ({
              ...prev,
              [listName]: [...prev[listName], newItem.trim()]
          }));
          setNewItem('');
      }
  };

  const removeFromList = (listName, itemToRemove) => {
      setSelectedAccount(prev => ({
          ...prev,
          [listName]: prev[listName].filter(item => item !== itemToRemove)
      }));
  };

  if (isLoading) {
    return <div className="p-6">{getText('Loading settings...', 'טוען הגדרות...')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{getText('Account Management & Settings', 'ניהול חשבונות והגדרות')}</h1>
          <p className="text-gray-600 mt-1">{selectedAccount ? `${getText('Displaying settings for:', 'מציג הגדרות עבור:')} ${selectedAccount.name}` : getText('Select or create a new account', 'בחר או צור חשבון חדש')}</p>
        </div>
        <Button onClick={handleNewAccount}>
          <Plus className="w-4 h-4 me-2" />
          {getText('New Account', 'חשבון חדש')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{getText('Your Accounts', 'החשבונות שלך')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {accounts.map(acc => (
            <div key={acc.id} className="flex items-center">
                <Button 
                    variant={selectedAccount?.id === acc.id ? 'default' : 'outline'}
                    onClick={() => handleSelectAccount(acc.id)}
                    className={currentAccountId === acc.id ? 'ring-2 ring-purple-500' : ''}
                >
                    {acc.name} ({acc.currency})
                    {currentAccountId === acc.id && <span className="ms-2 text-xs">• {getText('Active', 'פעיל')}</span>}
                </Button>
                <Button variant="ghost" size="icon" className="me-1" onClick={() => handleDelete(acc.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
            </div>
          ))}
        </CardContent>
      </Card>
      
      {selectedAccount && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5" />
              {isEditing ? getText('Edit Account', 'עריכת חשבון') : `${getText('Settings for', 'הגדרות עבור')} ${selectedAccount.name}`}
            </CardTitle>
            {!isEditing && (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit className="w-4 h-4 me-2" />
                {getText('Edit', 'ערוך')}
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {isEditing ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <Label htmlFor="account_name">{getText('Account Name', 'שם חשבון')}</Label>
                      <Input id="account_name" value={selectedAccount.name} onChange={(e) => handleInputChange('name', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="account_currency">{getText('Currency', 'מטבע')}</Label>
                      <Input id="account_currency" value={selectedAccount.currency} onChange={(e) => handleInputChange('currency', e.target.value)} />
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="account_size">{getText('Account Size', 'גודל חשבון')}</Label>
                    <Input id="account_size" type="number" value={selectedAccount.account_size} onChange={(e) => handleInputChange('account_size', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="default_risk">{getText('Risk per Trade (%)', 'סיכון לטרייד (%)')}</Label>
                    <Input id="default_risk" type="number" value={selectedAccount.default_risk_percentage} onChange={(e) => handleInputChange('default_risk_percentage', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_risk">{getText('Max Account Risk (%)', 'סיכון מירבי לחשבון (%)')}</Label>
                    <Input id="max_risk" type="number" value={selectedAccount.max_account_risk_percentage} onChange={(e) => handleInputChange('max_account_risk_percentage', e.target.value)} />
                  </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="max_position_size">{getText('Max Position Size (%)', 'גודל פוזיציה מירבי (%)')}</Label>
                        <Input id="max_position_size" type="number" value={selectedAccount.max_position_size_percentage} onChange={(e) => handleInputChange('max_position_size_percentage', e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="commission_fee">{getText('Commission Fee', 'עמלת ק/מ')}</Label>
                        <Input id="commission_fee" type="number" value={selectedAccount.commission_fee} onChange={(e) => handleInputChange('commission_fee', e.target.value)} />
                    </div>
                </div>
                <div>
                  <Label>{getText('Trading Strategies', 'אסטרטגיות מסחר')}</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {ensureArray(selectedAccount.strategies).map((strategy, index) => (
                      <Badge key={index} variant="secondary" className="px-3 py-1 flex items-center gap-2">
                        {strategy}
                        <button onClick={() => removeFromList('strategies', strategy)} className="text-gray-500 hover:text-red-500 ms-1">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Input value={newStrategy} onChange={(e) => setNewStrategy(e.target.value)} placeholder={getText('Add new strategy...', 'הוסף אסטרטגיה חדשה...')} onKeyPress={(e) => e.key === 'Enter' && addToList('strategies', newStrategy, setNewStrategy)} />
                    <Button onClick={() => addToList('strategies', newStrategy, setNewStrategy)} variant="outline" disabled={!newStrategy.trim()}><Plus className="w-4 h-4" /></Button>
                  </div>
                </div>
                 <div>
                  <Label>{getText('Sentiments for Tracking', 'סנטימנטים למעקב')}</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {ensureArray(selectedAccount.sentiments).map((sentiment, index) => (
                      <Badge key={index} variant="secondary" className="px-3 py-1 flex items-center gap-2">
                        {sentiment}
                        <button onClick={() => removeFromList('sentiments', sentiment)} className="text-gray-500 hover:text-red-500 ms-1">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Input value={newSentiment} onChange={(e) => setNewSentiment(e.target.value)} placeholder={getText('Add new sentiment...', 'הוסף סנטימנט חדש...')} onKeyPress={(e) => e.key === 'Enter' && addToList('sentiments', newSentiment, setNewSentiment)} />
                    <Button onClick={() => addToList('sentiments', newSentiment, setNewSentiment)} variant="outline" disabled={!newSentiment.trim()}><Plus className="w-4 h-4" /></Button>
                  </div>
                </div>
                
                {/* Password Change Section */}
                <div className="border-t pt-6">
                  <Label className="text-base font-semibold">{getText('Security Settings', 'הגדרות אבטחה')}</Label>
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">{getText('Change Password', 'שינוי סיסמה')}</p>
                    <Button variant="outline" size="sm" onClick={() => alert(getText('Password change functionality coming soon', 'פונקציית שינוי סיסמה תגיע בקרוב'))}>
                      {getText('Change Password', 'שנה סיסמה')}
                    </Button>
                  </div>
                </div>

                {/* Theme Settings */}
                <div className="border-t pt-6">
                  <Label className="text-base font-semibold">{getText('Appearance Settings', 'הגדרות מראה')}</Label>
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-1">{getText('Dark Mode', 'מצב כהה')}</p>
                        <p className="text-xs text-gray-600">{getText('Switch to dark theme for better viewing in low light', 'עבור לערכת נושא כהה לתצוגה טובה יותר באור חלש')}</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          const isDark = document.documentElement.classList.contains('dark');
                          if (isDark) {
                            document.documentElement.classList.remove('dark');
                            localStorage.setItem('theme', 'light');
                          } else {
                            document.documentElement.classList.add('dark');
                            localStorage.setItem('theme', 'dark');
                          }
                        }}
                      >
                        {document.documentElement.classList.contains('dark') ? 
                          getText('Disable Dark Mode', 'השבת מצב כהה') : 
                          getText('Enable Dark Mode', 'הפעל מצב כהה')
                        }
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Save/Cancel buttons moved to bottom */}
                <div className="flex justify-end gap-2 pt-6 border-t">
                  <Button variant="outline" onClick={() => { setIsEditing(false); loadAccounts(); }}>
                    {getText('Cancel', 'ביטול')}
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? getText('Saving...', 'שומר...') : getText('Save', 'שמור')}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <Banknote className="w-6 h-6 mx-auto mb-2 text-gray-500" />
                    <p className="text-sm text-gray-600">{getText('Account Size', 'גודל חשבון')}</p>
                    <p className="text-lg font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: selectedAccount.currency || 'USD' }).format(selectedAccount.account_size || 0)}</p>
                  </div>
                  <div className="text-center">
                    <Shield className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                    <p className="text-sm text-gray-600">{getText('Risk per Trade', 'סיכון לטרייד')}</p>
                    <p className="text-lg font-bold">{selectedAccount.default_risk_percentage}%</p>
                  </div>
                  <div className="text-center">
                    <Target className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                    <p className="text-sm text-gray-600">{getText('Max Position Size', 'גודל פוזיציה מירבי')}</p>
                    <p className="text-lg font-bold">{selectedAccount.max_position_size_percentage}%</p>
                  </div>
                  <div className="text-center">
                    <DollarSign className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                    <p className="text-sm text-gray-600">{getText('Commission', 'עמלה')}</p>
                    <p className="text-lg font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: selectedAccount.currency || 'USD' }).format(selectedAccount.commission_fee || 0)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div>
                        <h4 className="font-medium">{getText('Available Strategies', 'אסטרטגיות זמינות')}</h4>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {ensureArray(selectedAccount.strategies).map((s, i) => <Badge key={i} variant="outline">{s}</Badge>)}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-medium">{getText('Available Sentiments', 'סנטימנטים זמינים')}</h4>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {ensureArray(selectedAccount.sentiments).map((s, i) => <Badge key={i} variant="outline">{s}</Badge>)}
                        </div>
                    </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
