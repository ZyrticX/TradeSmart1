import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

const colorVariants = {
    blue: "border-blue-200 bg-blue-50",
    purple: "border-purple-200 bg-purple-50",
    orange: "border-orange-200 bg-orange-50",
    emerald: "border-emerald-200 bg-emerald-50",
    red: "border-red-500 bg-red-50",
};

const iconColors = {
    blue: "text-blue-600",
    purple: "text-purple-600",
    orange: "text-orange-600",
    emerald: "text-emerald-600",
    red: "text-red-600",
};

export default function MetricCard({ title, value, valueAnnotation, subValue, icon: Icon, color, trend }) {
  const isRedCard = color === 'red';

  return (
    <Card className={`border-2 ${colorVariants[color]} transition-all duration-200 hover:shadow-lg`}>
      <CardContent className={`p-4 flex flex-col justify-between h-full`}>
        <div>
            <div className="flex items-start justify-between mb-1">
              <div className={`p-1.5 rounded-lg ${isRedCard ? 'bg-white/90' : 'bg-white bg-opacity-60'}`}>
                <Icon className={`w-5 h-5 ${iconColors[color]}`} />
              </div>
              {trend && (
                <div className="flex items-center gap-1">
                  {trend === "positive" ? (
                    <TrendingUp className={`w-4 h-4 ${isRedCard ? 'text-black' : 'text-emerald-500'}`} />
                  ) : (
                    <TrendingDown className={`w-4 h-4 ${isRedCard ? 'text-black' : 'text-red-500'}`} />
                  )}
                </div>
              )}
            </div>
            <p className={`text-sm font-medium ${isRedCard ? 'text-black' : 'text-gray-600'} leading-tight`}>{title || ''}</p>
            <div className="flex items-baseline gap-1.5">
              <p className={`text-2xl font-bold ${isRedCard ? 'text-black' : 'text-gray-900'} leading-tight`}>{value || '$0.00'}</p>
              {valueAnnotation && <p className={`text-slate-800 text-base font-semibold`}>{valueAnnotation}</p>}
            </div>
        </div>
        {subValue && (
            <p className={`text-sm font-medium mt-1 leading-tight ${isRedCard ? 'text-black' : 'text-gray-500'}`}>{subValue}</p>
        )}
      </CardContent>
    </Card>
  );
}