import React, { useState, useEffect } from "react";
import { JournalEntry, Account } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import NewJournalModal from "../components/journal/NewJournalModal";
import JournalCard from "../components/journal/JournalCard";

export default function Journal() {
  const [entries, setEntries] = useState([]);
  const [showNewEntryModal, setShowNewEntryModal] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentAccount, setCurrentAccount] = useState(null);
  
  const language = localStorage.getItem('language') || 'en';

  const getText = (en, he) => {
    switch(language) {
      case 'he': return he;
      default: return en;
    }
  };

  const currentAccountId = localStorage.getItem('currentAccountId');

  useEffect(() => {
    if (currentAccountId) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [currentAccountId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [accountData, entriesData] = await Promise.all([
        Account.get(currentAccountId),
        JournalEntry.filter({ account_id: currentAccountId }, '-date')
      ]);
      setCurrentAccount(accountData);
      setEntries(entriesData);
    } catch (error) {
      console.error('Error loading journal entries:', error);
    }
    setIsLoading(false);
  };

  const handleSubmitEntry = async (entryData) => {
    if (entryToEdit) {
      await JournalEntry.update(entryToEdit.id, entryData);
    } else {
      const dataWithAccount = { ...entryData, account_id: currentAccountId };
      await JournalEntry.create(dataWithAccount);
    }
    setShowNewEntryModal(false);
    setEntryToEdit(null);
    loadData();
  };
  
  const handleEditEntry = (entry) => {
      if(entry.id) { // Quick edit on card
          JournalEntry.update(entry.id, { content: entry.content });
          loadData();
      } else { // Full edit in modal
          setEntryToEdit(entry);
          setShowNewEntryModal(true);
      }
  }

  const handleDeleteEntry = async (id) => {
      if (window.confirm(getText("Are you sure you want to delete this journal entry?", "האם אתה בטוח שברצונך למחוק רישום זה ביומן?"))) {
          await JournalEntry.delete(id);
          loadData();
      }
  }

  if (!currentAccountId) {
    return (
        <div className="p-6 text-center text-gray-600">
            <h2 className="text-xl font-semibold">{getText('Select Account', 'בחר חשבון')}</h2>
            <p className="mt-2">{getText('Please select an account in ', 'אנא בחר חשבון בעמוד ה')}<Link to={createPageUrl("Settings")} className="text-blue-600 underline">{getText('Settings', 'הגדרות')}</Link>{getText(' to view the trading journal.', ' כדי לצפות ביומן המסחר.')}</p>
        </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{getText('Trading Journal', 'יומן מסחר')}</h1>
          <p className="text-gray-600 mt-1">{getText('Track your thoughts, lessons, and trading insights', 'עקוב אחר המחשבות, השיעורים והתובנות שלך במסחר')}</p>
        </div>
        <Button onClick={() => { setEntryToEdit(null); setShowNewEntryModal(true); }} className="bg-purple-600 hover:bg-purple-700 text-white">
          <Plus className="w-4 h-4 me-2" />
          {getText('New Entry', 'רישום חדש')}
        </Button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">{Array(3).fill(0).map((_, i) => <Card key={i} className="animate-pulse"><CardContent className="p-6"><div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div><div className="space-y-2"><div className="h-4 bg-gray-200 rounded"></div><div className="h-4 bg-gray-200 rounded w-3/4"></div></div></CardContent></Card>)}</div>
        ) : entries.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{getText('No journal entries yet', 'אין עדיין רישומים ביומן')}</h3>
              <p className="text-gray-600 mb-4">{getText('Start documenting your trading journey and insights.', 'התחל לתעד את מסע המסחר והתובנות שלך.')}</p>
              <Button onClick={() => { setEntryToEdit(null); setShowNewEntryModal(true); }} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 me-2" />
                {getText('Write your first entry', 'כתוב את הרישום הראשון שלך')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          entries.map((entry) => (<JournalCard key={entry.id} entry={entry} onDelete={handleDeleteEntry} onEdit={handleEditEntry} />))
        )}
      </div>

      <NewJournalModal isOpen={showNewEntryModal} onClose={() => { setShowNewEntryModal(false); setEntryToEdit(null); }} onSubmit={handleSubmitEntry} entry={entryToEdit} />
    </div>
  );
}