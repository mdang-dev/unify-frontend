'use client';
import React, { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button, Modal, ModalBody, ModalContent, ModalHeader } from '@heroui/react';
import AdminReasonModal from '../../_components/admin-reason-modal';
import { addToast } from '@heroui/toast';

const ReportDetail = () => {
  const { reportId } = useParams();

  // Placeholder data for UI demonstration
  const reporters = useMemo(
    () => Array.from({ length: 18 }, (_, i) => ({ name: `Reporter ${i + 1}`, username: `user_${i + 1}` })),
    []
  );
  const proofImages = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) =>
        `/images/${['avatar.png', 'avt-exp.jpg', 'A_black_image.jpg'][i % 3]}`
      ),
    []
  );

  const [showAllReporters, setShowAllReporters] = useState(false);
  const [showAllProofs, setShowAllProofs] = useState(false);

  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

  const [isAdminReasonOpen, setIsAdminReasonOpen] = useState(false);
  const [adminReasonAction, setAdminReasonAction] = useState(null);
  const [isButtonLoading, setIsButtonLoading] = useState(false);

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

  return (
    <div className="h-screen w-full px-6 pb-10">
      <div className="mx-auto mb-6 flex max-w-7xl flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-4xl font-bold">Report Detail</h1>
          <div className="flex items-center gap-2">
            <Button color="success" onClick={() => openAdminReasonModal('approve')}>
              Approve
            </Button>
            <Button color="danger" variant="flat" onClick={() => openAdminReasonModal('reject')}>
              Reject
            </Button>
          </div>
        </div>
        <p className="-mt-4 text-gray-500">Reported User ID: {reportId}</p>

        {/* Reporters Section */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Reporters</h2>
          <div className="max-h-[360px] overflow-y-auto rounded-md">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(showAllReporters ? reporters : reporters.slice(0, 6)).map((r, idx) => (
                <div key={idx} className="rounded-md border p-4">
                  <div className="font-medium">{r.name}</div>
                  <div className="text-sm text-muted-foreground">@{r.username}</div>
                </div>
              ))}
            </div>
          </div>
          {reporters.length > 6 && (
            <div className="mt-4">
              <button className="rounded-md border px-3 py-1 text-sm" onClick={() => setShowAllReporters((s) => !s)}>
                {showAllReporters ? 'Show less' : `Show all (${reporters.length})`}
              </button>
            </div>
          )}
        </div>

        {/* Proofs Section */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Proofs</h2>
          <div className="max-h-[420px] overflow-y-auto rounded-md">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {(showAllProofs ? proofImages : proofImages.slice(0, 8)).map((src, idx) => (
                <button
                  key={`${src}-${idx}`}
                  type="button"
                  className="group aspect-square overflow-hidden rounded-md border"
                  onClick={() => setImagePreviewUrl(src)}
                >
                  <img src={src} alt={`Proof ${idx + 1}`} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                </button>
              ))}
            </div>
          </div>
          {proofImages.length > 8 && (
            <div className="mt-4">
              <button className="rounded-md border px-3 py-1 text-sm" onClick={() => setShowAllProofs((s) => !s)}>
                {showAllProofs ? 'Show less' : `Show all (${proofImages.length})`}
              </button>
            </div>
          )}
        </div>

        {/* Reported Entity Details */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Reported User</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="text-sm text-muted-foreground">User ID</div>
              <div className="font-medium">{reportId}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Username</div>
              <div className="font-medium">@username</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <div className="font-medium">Pending</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Last Updated</div>
              <div className="font-medium">-</div>
            </div>
          </div>
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

export default ReportDetail;


