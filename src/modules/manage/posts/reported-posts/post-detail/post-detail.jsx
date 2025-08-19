'use client';
import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Button, Modal, ModalBody, ModalContent, ModalHeader, Spinner } from '@heroui/react';
import { useQuery } from '@tanstack/react-query';
import AdminReasonModal from '../../../_components/admin-reason-modal';
import { addToast } from '@heroui/toast';
import { adminReportsQueryApi } from '@/src/apis/reports/query/admin-reports.query.api';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';

const PostDetail = () => {
  const params = useParams();
  const reportedId = params.reportedId;

  const [showAllReporters, setShowAllReporters] = useState(false);
  const [showAllProofs, setShowAllProofs] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [isAdminReasonOpen, setIsAdminReasonOpen] = useState(false);
  const [adminReasonAction, setAdminReasonAction] = useState(null);
  const [isButtonLoading, setIsButtonLoading] = useState(false);

  // Fetch report details from backend
  const { data: reportDetailResponse, isLoading, error } = useQuery({
    queryKey: [QUERY_KEYS.REPORT_DETAIL, reportedId],
    queryFn: () => adminReportsQueryApi.getReportDetailByTarget(reportedId),
    enabled: !!reportedId,
  });

  // Extract the first (and only) report from the array response
  const reportDetail = Array.isArray(reportDetailResponse) && reportDetailResponse.length > 0 
    ? reportDetailResponse[0] 
    : reportDetailResponse;

  console.log('reportDetail', reportDetail);

  const openAdminReasonModal = (action) => {
    setAdminReasonAction(action);
    setIsAdminReasonOpen(true);
  };

  const handleAdminReasonConfirm = async (reason) => {
    setIsButtonLoading(true);
    // UI-only flow for now
    setTimeout(() => {
      addToast({
        title: 'Success',
        description: `Report ${adminReasonAction === 'approve' ? 'approved' : 'rejected'} with note: ${reason}`,
        timeout: 3000,
        color: 'success',
      });
      setIsButtonLoading(false);
      setIsAdminReasonOpen(false);
    }, 600);
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 0: return 'Pending';
      case 1: return 'Approved';
      case 2: return 'Rejected';
      case 3: return 'Resolved';
      case 4: return 'Canceled';
      default: return 'Unknown';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full px-6 pb-10">
        <div className="mx-auto mb-6 flex max-w-7xl flex-col gap-6">
          <div className="flex items-center justify-center h-64">
            <Spinner size="lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-full px-6 pb-10">
        <div className="mx-auto mb-6 flex max-w-7xl flex-col gap-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-red-600">Error Loading Report</h3>
              <p className="text-sm text-muted-foreground">
                {error.message || 'An error occurred while loading report details'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!reportDetail) {
    return (
      <div className="h-screen w-full px-6 pb-10">
        <div className="mx-auto mb-6 flex max-w-7xl flex-col gap-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-muted-foreground">No Report Found</h3>
              <p className="text-sm text-muted-foreground">
                Report details not found for this post
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { reportedEntity, reporters, images, status, reason, reportedAt } = reportDetail;

  // Add default values to prevent undefined errors
  const safeReporters = reporters || [];
  const safeImages = images || [];
  const safeStatus = status ?? 0;
  const safeReason = reason || 'No reason provided';
  const safeReportedAt = reportedAt || null;
  const safeReportedEntity = reportedEntity || {};

  return (
    <div className="h-screen w-full px-6 pb-10">
      <div className="mx-auto mb-6 flex max-w-7xl flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-4xl font-bold">Post Report Detail</h1>
          <div className="flex items-center gap-2">
            <Button 
              color="success" 
              onClick={() => openAdminReasonModal('approve')}
              disabled={safeStatus !== 0}
            >
              Approve
            </Button>
            <Button 
              color="danger" 
              variant="flat" 
              onClick={() => openAdminReasonModal('reject')}
              disabled={safeStatus !== 0}
            >
              Reject
            </Button>
          </div>
        </div>
        <p className="-mt-4 text-gray-500">Reported Post ID: {reportedId}</p>

        {/* Reporters Section */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Reporters ({safeReporters.length})</h2>
          <div className="max-h-[360px] overflow-y-auto rounded-md">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(showAllReporters ? safeReporters : safeReporters.slice(0, 6)).map((reporter, idx) => (
                <div key={reporter.id} className="rounded-md border p-4">
                  <div className="flex items-center gap-3">
                    {reporter.avatar?.url && (
                      <img 
                        src={reporter.avatar.url} 
                        alt={reporter.username}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <div className="font-medium">{reporter.firstName} {reporter.lastName}</div>
                      <div className="text-sm text-muted-foreground">@{reporter.username}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {safeReporters.length > 6 && (
            <div className="mt-4">
              <Button size="sm" variant="bordered" onClick={() => setShowAllReporters((s) => !s)}>
                {showAllReporters ? 'Show less' : `Show all (${safeReporters.length})`}
              </Button>
            </div>
          )}
        </div>

        {/* Proofs Section */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Proofs ({safeImages.length})</h2>
          {safeImages.length > 0 ? (
            <>
              <div className="max-h-[420px] overflow-y-auto rounded-md">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {(showAllProofs ? safeImages : safeImages.slice(0, 8)).map((image, idx) => (
                    <button
                      key={`${image.url || image}-${idx}`}
                      type="button"
                      className="group aspect-square overflow-hidden rounded-md border"
                      onClick={() => setImagePreviewUrl(image.url || image)}
                    >
                      <img 
                        src={image.url || image} 
                        alt={`Proof ${idx + 1}`} 
                        className="h-full w-full object-cover transition-transform group-hover:scale-105" 
                      />
                    </button>
                  ))}
                </div>
              </div>
              {safeImages.length > 8 && (
                <div className="mt-4">
                  <Button size="sm" variant="bordered" onClick={() => setShowAllProofs((s) => !s)}>
                    {showAllProofs ? 'Show less' : `Show all (${safeImages.length})`}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No proof images provided
            </div>
          )}
        </div>

        {/* Reported Post Details */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Reported Post</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="text-sm text-muted-foreground">Post ID</div>
              <div className="font-medium">{safeReportedEntity?.id}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Caption</div>
              <div className="font-medium">{safeReportedEntity?.captions || 'No caption'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <div className="font-medium">{getStatusLabel(safeReportedEntity?.status)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Audience</div>
              <div className="font-medium">{safeReportedEntity?.audience || 'Not specified'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Posted At</div>
              <div className="font-medium">{formatDate(safeReportedEntity?.postedAt)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Comments Visible</div>
              <div className="font-medium">{safeReportedEntity?.isCommentVisible ? 'Yes' : 'No'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Likes Visible</div>
              <div className="font-medium">{safeReportedEntity?.isLikeVisible ? 'Yes' : 'No'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Media Count</div>
              <div className="font-medium">{safeReportedEntity?.media?.length || 0}</div>
            </div>
          </div>
        </div>

        {/* Post Author Details */}
        {safeReportedEntity?.user && (
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Post Author</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <div className="text-sm text-muted-foreground">User ID</div>
                <div className="font-medium">{safeReportedEntity.user?.id}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Username</div>
                <div className="font-medium">@{safeReportedEntity.user?.username}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Full Name</div>
                <div className="font-medium">{safeReportedEntity.user?.firstName} {safeReportedEntity.user?.lastName}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div className="font-medium">{safeReportedEntity.user?.email}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Phone</div>
                <div className="font-medium">{safeReportedEntity.user?.phone || 'Not provided'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Location</div>
                <div className="font-medium">{safeReportedEntity.user?.location || 'Not provided'}</div>
              </div>
            </div>
          </div>
        )}

        {/* Post Media */}
        {safeReportedEntity?.media && safeReportedEntity.media.length > 0 && (
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Post Media ({safeReportedEntity.media.length})</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {safeReportedEntity.media.map((media, idx) => (
                <div key={media.id} className="aspect-square overflow-hidden rounded-md border">
                  {media.mediaType === 'VIDEO' ? (
                    <video 
                      src={media.url} 
                      className="h-full w-full object-cover"
                      controls
                    />
                  ) : (
                    <img 
                      src={media.url} 
                      alt={`Media ${idx + 1}`} 
                      className="h-full w-full object-cover" 
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Report Status and Date */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Report Information</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="text-sm text-muted-foreground">Report Status</div>
              <div className="font-medium">{getStatusLabel(safeStatus)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Reported At</div>
              <div className="font-medium">{formatDate(safeReportedAt)}</div>
            </div>
          </div>
        </div>

        {/* Report Reason */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Report Reason</h2>
          <p className="text-gray-700">{safeReason}</p>
        </div>
      </div>

      {/* Image Preview Modal */}
      <Modal isOpen={!!imagePreviewUrl} onOpenChange={() => setImagePreviewUrl(null)} size="5xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Proof Preview</ModalHeader>
              <ModalBody>
                {imagePreviewUrl && (
                  <div className="flex items-center justify-center">
                    <img src={imagePreviewUrl} alt="Proof" className="max-h-[70vh] w-auto rounded-md" />
                  </div>
                )}
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Admin Reason Modal */}
      <AdminReasonModal
        isOpen={isAdminReasonOpen}
        onClose={() => setIsAdminReasonOpen(false)}
        onConfirm={handleAdminReasonConfirm}
        action={adminReasonAction}
        isLoading={isButtonLoading}
      />
    </div>
  );
};

export default PostDetail;
