
import React, { useState, useEffect } from "react";
import { LearningMaterial, Account } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Book, FileText, Video, Download, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import NewMaterialModal from "../components/learning/NewMaterialModal";
import MaterialCard from "../components/learning/MaterialCard";

export default function Learning() {
  const [materials, setMaterials] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [showNewMaterialModal, setShowNewMaterialModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [currentAccount, setCurrentAccount] = useState(null);
  
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
    filterMaterials();
  }, [materials, searchTerm, selectedTopic]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [accountData, materialsData] = await Promise.all([
        Account.get(currentAccountId),
        LearningMaterial.filter({ account_id: currentAccountId }, '-created_date')
      ]);
      
      if (!accountData) {
        console.warn('⚠️ Account not found:', currentAccountId);
        localStorage.removeItem('currentAccountId');
        setCurrentAccount(null);
        setMaterials([]);
      } else {
        setCurrentAccount(accountData);
        setMaterials(materialsData);
      }
    } catch (error) {
      console.error('Error loading learning materials:', error);
    }
    setIsLoading(false);
  };

  const filterMaterials = () => {
    let filtered = materials;
    
    if (searchTerm) {
      filtered = filtered.filter(material => 
        material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.topic?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedTopic !== 'all') {
      filtered = filtered.filter(material => material.topic === selectedTopic);
    }
    
    setFilteredMaterials(filtered);
  };

  const handleNewMaterial = async (materialData) => {
    const dataWithAccount = { ...materialData, account_id: currentAccountId };
    await LearningMaterial.create(dataWithAccount);
    setShowNewMaterialModal(false);
    loadData();
  };

  const handleDeleteMaterial = async (id) => {
    if (window.confirm(getText("Are you sure you want to delete this learning material?", "האם אתה בטוח שברצונך למחוק חומר למידה זה?"))) {
      await LearningMaterial.delete(id);
      loadData();
    }
  };

  const getUniqueTopics = () => {
    const topics = [...new Set(materials.map(m => m.topic).filter(Boolean))];
    return topics.sort();
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'book': return <Book className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'document': return <FileText className="w-4 h-4" />;
      default: return <GraduationCap className="w-4 h-4" />;
    }
  };

  if (!currentAccountId) {
    return (
      <div className="p-6 text-center text-gray-600">
        <h2 className="text-xl font-semibold">
          {getText('Select Account', 'בחר חשבון')}
        </h2>
        <p className="mt-2">
          {getText('Please select an account in ', 'אנא בחר חשבון בעמוד ה')}
          <Link to={createPageUrl("Settings")} className="text-blue-600 underline">
            {getText('Settings', 'הגדרות')}
          </Link>
          {getText(' to view learning materials.', ' כדי לצפות בחומרי למידה.')}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Account Header */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              {getText('Active Account', 'חשבון פעיל')}
            </h2>
            <p className="text-purple-100">{currentAccount?.name}</p>
          </div>
          <GraduationCap className="w-8 h-8 text-purple-200" />
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {getText('Learning Center', 'מרכז למידה')} - {currentAccount?.name}
          </h1>
          <p className="text-gray-600 mt-1">
            {getText('Organize and access your trading education materials', 'ארגן וגש לחומרי החינוך למסחר שלך')}
          </p>
        </div>
        <Button 
          onClick={() => setShowNewMaterialModal(true)} 
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Plus className="w-4 h-4 me-2" />
          {getText('Add Material', 'הוסף חומר')}
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder={getText('Search materials by title, description, or topic...', 'חפש חומרים לפי כותרת, תיאור או נושא...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ps-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedTopic === 'all' ? 'default' : 'outline'}
                onClick={() => setSelectedTopic('all')}
                size="sm"
              >
                {getText('All Topics', 'כל הנושאים')}
              </Button>
              {getUniqueTopics().map(topic => (
                <Button
                  key={topic}
                  variant={selectedTopic === topic ? 'default' : 'outline'}
                  onClick={() => setSelectedTopic(topic)}
                  size="sm"
                >
                  {topic}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Materials Grid */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredMaterials.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <GraduationCap className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {getText('No Learning Materials Yet', 'אין עדיין חומרי למידה')}
              </h3>
              <p className="text-gray-600 mb-4">
                {getText('Start building your trading knowledge library.', 'התחל לבנות את ספריית הידע למסחר שלך.')}
              </p>
              <Button 
                onClick={() => setShowNewMaterialModal(true)} 
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-4 h-4 me-2" />
                {getText('Add Your First Material', 'הוסף את החומר הראשון שלך')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMaterials.map((material) => (
              <MaterialCard 
                key={material.id} 
                material={material} 
                onDelete={handleDeleteMaterial}
                getTypeIcon={getTypeIcon}
                language={language}
              />
            ))}
          </div>
        )}
      </div>

      <NewMaterialModal 
        isOpen={showNewMaterialModal} 
        onClose={() => setShowNewMaterialModal(false)} 
        onSubmit={handleNewMaterial}
        language={language}
      />
    </div>
  );
}
