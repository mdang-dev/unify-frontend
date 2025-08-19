'use client';
import React, { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Textarea,
} from '@heroui/react';

const AdminReasonModal = ({ isOpen, onClose, onConfirm, action, isLoading = false }) => {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (reason.trim()) {
      onConfirm(reason.trim());
      setReason('');
    }
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={handleClose}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>{action === 'approve' ? 'Approve Report' : 'Reject Report'}</ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                {action === 'reject' && (
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <i className="fa-solid fa-info-circle text-orange-500 text-lg"></i>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-orange-800">Report Rejection</h4>
                        <p className="text-sm text-orange-700 mt-1">
                          Rejecting this report will update its status to REJECTED. All reports for the same target will be marked as rejected for consistency.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <p className="text-sm text-gray-600">
                  Please provide a reason for {action === 'approve' ? 'approving' : 'rejecting'}{' '}
                  this report. This reason will be recorded and may be used for future reference.
                </p>
                <Textarea
                  label="Admin Reason"
                  placeholder={`Enter your reason for ${action === 'approve' ? 'approving' : 'rejecting'} this report...`}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  minRows={3}
                  maxRows={6}
                  isRequired
                  isInvalid={reason.trim() === ''}
                  errorMessage="Reason is required"
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                color={action === 'approve' ? 'success' : 'danger'}
                onPress={handleConfirm}
                isLoading={isLoading}
                isDisabled={reason.trim() === ''}
              >
                {action === 'approve' ? 'Approve' : 'Reject'}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default AdminReasonModal;
