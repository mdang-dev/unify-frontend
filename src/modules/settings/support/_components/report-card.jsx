import { ButtonCommon } from '@/src/components/button';
import { Badge } from '@/src/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { MessageCircle } from 'lucide-react';
import { Heart } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import { ChevronLeft } from 'lucide-react';
// import { format } from 'node:util';
import { format } from 'date-fns';
import React, { useState } from 'react';
import getStatusBadge from "@/src/modules/settings/support/_components/get-status-badge";
const ReportCard = ({ report, type, sentReports, receivedReports }) => {
  const [activeImageIndex, setActiveImageIndex] = useState({});


  const handleImageChange = (reportId, direction) => {
    setActiveImageIndex((prev) => {
      const currentIndex = prev[reportId] || 0;
      const report = [...sentReports, ...receivedReports].find((r) => r.id === reportId);
      const mediaArr = report?.reportedEntity?.media || [];
      const maxIndex = mediaArr.length - 1;

      let newIndex;
      if (direction === 'next') {
        newIndex = currentIndex === maxIndex ? 0 : currentIndex + 1;
      } else {
        newIndex = currentIndex === 0 ? maxIndex : currentIndex - 1;
      }

      return { ...prev, [reportId]: newIndex };
    });
  };

  if (!report || !report.reportedEntity) return null;

  return (
    <Card className="mb-4 w-full">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Image Carousel */}
          <div className="relative w-1/2">
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-gray-100 dark:bg-neutral-800">
              {report.reportedEntity.media?.[activeImageIndex[report.id] || 0]?.url ? (
                <>
                  {report.reportedEntity.media[activeImageIndex[report.id] || 0].mediaType ===
                  'IMAGE' ? (
                    <img
                      key={report.reportedEntity.media[activeImageIndex[report.id] || 0].url}
                      src={report.reportedEntity.media[activeImageIndex[report.id] || 0].url}
                      alt={report.reportedEntity.captions || 'Reported content'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <video
                      key={report.reportedEntity.media[activeImageIndex[report.id] || 0].url}
                      src={report.reportedEntity.media[activeImageIndex[report.id] || 0].url}
                      controls
                      className="h-full w-full object-cover"
                    />
                  )}
                </>
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-400">
                  No media available
                </div>
              )}
              {report.reportedEntity.media?.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => handleImageChange(report.id, 'prev')}
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleImageChange(report.id, 'next')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white"
                  >
                    <ChevronRight size={16} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="w-1/2 space-y-2">
            <div>
              <h3 className="mb-1 text-lg font-semibold">
                {report.reportedEntity.captions || 'No title'}
              </h3>
              <div className="flex items-center gap-3 text-gray-500">
                <span className="flex items-center gap-1">
                  <Heart size={14} />
                  {report.reportedEntity.likes || 0}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle size={14} />
                  {report.reportedEntity.comments || 0}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-gray-600 dark:text-gray-300">
                Reported on {format(new Date(report?.reportedAt), 'PPP')}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                <span className="font-medium">Author:</span> {report.reportedEntity?.user?.username}
              </p>
              <p className="text-sm">
                <span className="font-medium">Reason:</span> {report.reason}
              </p>

              {type === 'received' && (
                <>
                  {getStatusBadge(report.status)}
                  {report.adminReason && (
                    <p className="text-xs text-gray-600">
                      <span className="font-bold">Admin Notes:</span> {report.adminReason}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* <div className="pt-2">
                {type === "sent" ? (
                  <Button variant="outline" size="sm" className="w-full">
                    Cancel Report
                  </Button>
                ) : (
                  report.status === 2 && (
                    <Button variant="outline" size="sm" className="w-full">
                      Request Another Review
                    </Button>
                  )
                )}
              </div> */}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportCard;
