import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, Trash2, Star, FileText, Eye } from "lucide-react";
import { format } from "date-fns";

export default function MaterialCard({ material, onDelete, getTypeIcon, language }) {
  const getText = (en, he) => {
    switch(language) {
      case 'he': return he;
      default: return en;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'bg-purple-100 text-purple-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'completed': return getText('Completed', 'הושלם');
      case 'in_progress': return getText('In Progress', 'בתהליך');
      default: return getText('Not Started', 'לא החל');
    }
  };

  const renderRating = (rating) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <Star 
            key={i} 
            className={`w-3 h-3 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
          />
        ))}
      </div>
    );
  };

  const handleViewFile = () => {
    if (material.file_url) {
      window.open(material.file_url, '_blank');
    }
  };

  const handleDownloadFile = () => {
    if (material.file_url) {
      const link = document.createElement('a');
      link.href = material.file_url;
      link.download = material.title || 'learning-material';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              {getTypeIcon(material.type)}
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg line-clamp-2">{material.title}</CardTitle>
              {material.author && (
                <p className="text-sm text-gray-600 mt-1">
                  {getText('by', 'מאת')} {material.author}
                </p>
              )}
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onDelete(material.id)}
            className="text-gray-400 hover:text-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {material.description && (
          <p className="text-gray-700 text-sm line-clamp-3">{material.description}</p>
        )}
        
        <div className="flex flex-wrap gap-2">
          {material.topic && (
            <Badge variant="outline">{material.topic}</Badge>
          )}
          <Badge className={getStatusColor(material.completion_status)}>
            {getStatusText(material.completion_status)}
          </Badge>
          {material.type && (
            <Badge variant="secondary" className="capitalize">
              {getText(material.type, material.type, material.type)}
            </Badge>
          )}
        </div>

        {material.rating && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {getText('Rating:', 'דירוג:')}
            </span>
            {renderRating(material.rating)}
          </div>
        )}

        {material.tags && material.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {material.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                #{tag}
              </Badge>
            ))}
            {material.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{material.tags.length - 3} {getText('more', 'נוספים')}
              </Badge>
            )}
          </div>
        )}

        {material.notes && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-700 line-clamp-2">{material.notes}</p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {material.file_url && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleViewFile}
                className="flex-1"
              >
                <Eye className="w-3 h-3 me-1" />
                {getText('View', 'צפה')}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownloadFile}
                className="flex-1"
              >
                <Download className="w-3 h-3 me-1" />
                {getText('Download', 'הורד')}
              </Button>
            </>
          )}
          {material.external_url && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.open(material.external_url, '_blank')}
              className="flex-1"
            >
              <ExternalLink className="w-3 h-3 me-1" />
              {getText('Open Link', 'פתח קישור')}
            </Button>
          )}
        </div>

        <div className="text-xs text-gray-500 mt-2">
          {getText('Added', 'נוסף')} {format(new Date(material.created_date), 'MMM dd, yyyy')}
        </div>
      </CardContent>
    </Card>
  );
}