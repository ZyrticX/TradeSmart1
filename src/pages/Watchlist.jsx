
import React, { useState, useEffect } from "react";
import { WatchlistNote, Account } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Eye, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import NewWatchlistModal from "../components/watchlist/NewWatchlistModal";
import WatchlistTable from "../components/watchlist/WatchlistTable";

export default function Watchlist() {
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [showNewNoteModal, setShowNewNoteModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentAccount, setCurrentAccount] = useState(null);
  const isRTL = true; // Hardcoded

  const currentAccountId = localStorage.getItem('currentAccountId');

  useEffect(() => {
    if (currentAccountId) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [currentAccountId]);

  useEffect(() => {
    filterNotes();
  }, [notes, searchTerm]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [accountData, notesData] = await Promise.all([
        Account.get(currentAccountId),
        WatchlistNote.filter({ account_id: currentAccountId }, '-date')
      ]);
      setCurrentAccount(accountData);
      setNotes(notesData);
    } catch (error) { 
      console.error('Error loading watchlist notes:', error); 
    }
    setIsLoading(false);
  };

  const filterNotes = () => {
    let filtered = notes;
    if (searchTerm) {
      filtered = filtered.filter(note => 
        note.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredNotes(filtered);
  };

  const handleNewNote = async (noteData) => {
    const dataWithAccount = { ...noteData, account_id: currentAccountId };
    await WatchlistNote.create(dataWithAccount);
    setShowNewNoteModal(false);
    loadData();
  };
  
  const handleDeleteNote = async (id) => {
      if (window.confirm("האם למחוק הערה זו?")) { // isRTL is true, so directly use Hebrew
          await WatchlistNote.delete(id);
          loadData();
      }
  }

  if (!currentAccountId) {
    return (
        <div className="p-6 text-center text-gray-600">
            <h2 className="text-xl font-semibold">בחר חשבון</h2>
            <p className="mt-2">אנא בחר חשבון בעמוד ה<Link to={createPageUrl("Settings")} className="text-blue-600 underline">הגדרות</Link> כדי לצפות ברשימת המעקב.</p>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">רשימת מעקב ומחקר</h1>
          <p className="text-gray-600 mt-1">מעקב אחר סימבולים והערות מחקר עבור {currentAccount?.name}</p>
        </div>
        <Button onClick={() => setShowNewNoteModal(true)} className="bg-purple-600 hover:bg-purple-700 text-white"><Plus className="w-4 h-4 me-2" />הוסף הערה</Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input placeholder="חפש לפי סימבול או הערות..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="ps-10"/>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Eye className="w-5 h-5" />הערות מחקר</CardTitle></CardHeader>
        <CardContent><WatchlistTable notes={filteredNotes} isLoading={isLoading} onDelete={handleDeleteNote} /></CardContent>
      </Card>

      <NewWatchlistModal isOpen={showNewNoteModal} onClose={() => setShowNewNoteModal(false)} onSubmit={handleNewNote} settings={currentAccount} />
    </div>
  );
}
