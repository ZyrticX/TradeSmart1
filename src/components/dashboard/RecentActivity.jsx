
import React from "react";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, BookOpen, Clock } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function RecentActivity({ activities, isLoading }) {
  const isRTL = true;
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>אין פעילות אחרונה.</p>
      </div>
    );
  }

  const getActivityLink = (activity) => {
    if (activity.type === 'trade') {
      return createPageUrl(`Trades?highlight=${activity.data.id}`);
    }
    if (activity.type === 'journal') {
      return createPageUrl(`Journal?highlight=${activity.data.id}`);
    }
    return '#';
  };

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <Link to={getActivityLink(activity)} key={index} className="block hover:bg-gray-50 rounded-lg">
          <div className="flex items-center gap-4 p-3 border rounded-lg">
            <div className="flex-shrink-0">
              {activity.type === 'trade' ? (
                <div className={`p-2 rounded-full ${
                  activity.data.direction === 'long' 
                    ? 'bg-emerald-100 text-emerald-600' 
                    : 'bg-red-100 text-red-600'
                }`}>
                  {activity.data.direction === 'long' ? (
                    <TrendingUp className="w-5 h-5" />
                  ) : (
                    <TrendingDown className="w-5 h-5" />
                  )}
                </div>
              ) : (
                <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                  <BookOpen className="w-5 h-5" />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-900">
                  {activity.type === 'trade' ? `עסקה: ${activity.data.symbol}` : `יומן: ${activity.data.title || 'רישום יומי'}`}
                </p>
                <Badge variant="outline" className="text-xs">
                  {activity.type === 'trade' ? 'עסקה' : 'יומן'}
                </Badge>
              </div>
              
              <p className="text-sm text-gray-500">
                {activity.type === 'trade' ? `${activity.data.quantity} מניות במחיר $${activity.data.entry_price?.toFixed(2)}` : `${activity.data.content?.substring(0, 100)}...`}
              </p>
              
              <p className="text-xs text-gray-400 mt-1">
                {format(new Date(activity.timestamp), 'MMM dd, yyyy HH:mm')}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
