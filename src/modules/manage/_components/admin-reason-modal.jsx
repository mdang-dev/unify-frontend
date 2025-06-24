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
