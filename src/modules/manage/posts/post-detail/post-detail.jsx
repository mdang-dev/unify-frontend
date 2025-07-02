'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import avatar from '@/public/images/testreel.jpg';
import avatar2 from '@/public/images/testAvt.jpg';
import { useParams, useRouter } from 'next/navigation';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  Card,
  CardHeader,
  CardBody,
  User,
  addToast,
  Spinner,
} from '@heroui/react';
import clsx from 'clsx';
import ReportedPostLoading from './_components/reported-post-loading';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reportsQueryApi } from '@/src/apis/reports/query/report.query.api';
import { reportsCommandApi } from '@/src/apis/reports/command/report.command.api';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';
import AdminReasonModal from '../../_components/admin-reason-modal';

const MyHeading2 = ({ content = 'Heading 2' }) => {
  return <h2 className="my-4 text-2xl font-bold">{content}</h2>;
};

const PostDetail = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [post, setPost] = useState(null);
  const { postId } = useParams();
  const [isButtonLoading, setButtonLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    isOpen: isAdminReasonOpen,
    onOpen: onOpenAdminReason,
    onOpenChange: onAdminReasonOpenChange,
  } = useDisclosure();

  const [adminReasonAction, setAdminReasonAction] = useState(null);

  const { data: report, isLoading: loading } = useQuery({
    queryKey: [QUERY_KEYS.REPORTS_BY_POST, postId],
    queryFn: () => reportsQueryApi.getReportsByPost(postId),
    enabled: !!postId,
  });

  console.log('id', postId);

  const { mutate: updateReport } = useMutation({
    mutationFn: ({ reportId, status, adminReason }) =>
      reportsCommandApi.updateReportWithAdminReason(reportId, status, adminReason),
  });

  const handleApprove = async () => {
    setButtonLoading(true);
    updateReport(
      { reportId: report?.id, status: 1 },
      {
        onError: () => {
          queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.REPORTS_BY_POST, postId] });
          addToast({
            title: 'Fail',
            description: 'Encounter an error. Cannot process this report.',
            timeout: 3000,
            shouldShowTimeoutProgess: true,
            color: 'danger',
          });
        },
        onSettled: () => setButtonLoading(false),
      }
    );
  };

  const handleReject = () => {
    setButtonLoading(true);
    updateReport(
      { reportId: report?.id, status: 2 },
      {
        onError: () => {
          queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.REPORTS_BY_POST, postId] });
          addToast({
            title: 'Fail',
            description: 'Encounter an error. Cannot process this report.',
            timeout: 3000,
            shouldShowTimeoutProgess: true,
            color: 'danger',
          });
        },
        onSettled: () => setButtonLoading(false),
      }
    );
  };

  const openAdminReasonModal = (action) => {
    setAdminReasonAction(action);
    onOpenAdminReason();
  };

  const handleAdminReasonConfirm = (reason) => {
    if (adminReasonAction === 'approve') {
      handleApprove(reason);
    } else if (adminReasonAction === 'reject') {
      handleReject(reason);
    }
    onAdminReasonOpenChange();
  };

  useEffect(() => {
    if (report) {
      setPost(report.reportedEntity);
    }
  }, [report]);

  return (
    <div className="h-screen p-6">
      <div className="mb-4">
        <h1 className="text-3xl font-bold uppercase">Reported Post Details</h1>
        <p className="text-gray-500">Show all the details about the reported post.</p>
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => router.back()}
          className="rounded-md border border-blue-500 px-4 py-2 text-blue-500 hover:bg-blue-500 hover:text-white"
        >
          ← Return to List
        </button>
        {report?.status === 0 && (
          <div className="">
            <button
              onClick={() => openAdminReasonModal('approve')}
              disabled={isButtonLoading}
              className="rounded-md border bg-green-500 p-3 font-bold text-white"
            >
              {isButtonLoading && (
                <>
                  <Spinner size="sm" /> Loading
                </>
              )}
              {!isButtonLoading && (
                <>
                  <i className="fa-solid fa-thumbs-up"></i> Approve
                </>
              )}
            </button>
            <button
              onClick={() => openAdminReasonModal('reject')}
              disabled={isButtonLoading}
              className="ml-3 rounded-md border bg-red-500 p-3 font-bold text-white"
            >
              {isButtonLoading && (
                <>
                  <Spinner size="sm" /> Loading
                </>
              )}
              {!isButtonLoading && (
                <>
                  <i className="fa-solid fa-circle-minus"></i> Reject
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <ReportedPostLoading />
      ) : (
        <>
          <div className="my-3 rounded-md border bg-gray-200 p-3">
            <MyHeading2 content="Basic Info" />
            <div className="w-3/4 pl-5">
              <ul>
                <li>
                  <p className="font-bold">
                    Report ID: <span className="font-normal">{report?.id}</span>
                  </p>
                </li>
                <li>
                  <p className="font-bold">
                    Reported Date:{' '}
                    <span className="font-normal">
                      {new Date(report?.reportedAt).toLocaleString('en-US', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </p>
                </li>
                <li>
                  <p className="font-bold">
                    Status:{' '}
                    <span
                      className={clsx('rounded p-1 font-normal italic', {
                        'bg-primary-200': report?.status === 0,
                        'bg-success-200': report?.status === 1,
                        'bg-red-200': report?.status === 2,
                        'bg-warning-200': report?.status === 3,
                        'bg-zinc-300': report?.status === 4,
                      })}
                    >
                      {report?.status === 0
                        ? 'Pending'
                        : report?.status === 1
                          ? 'Approved'
                          : report?.status === 2
                            ? 'Rejected'
                            : report?.status === 3
                              ? 'Resolved'
                              : 'Canceled'}
                    </span>
                  </p>
                </li>
                <li>
                  <p className="font-bold">
                    Reporter&apos;s ID: <span className="font-normal">{report?.userId}</span>
                  </p>
                </li>
                <li>
                  <p className="font-bold">
                    Reported Post&apos;s ID:{' '}
                    <span className="font-normal">{report?.reportedId}</span>
                  </p>
                </li>
                {report?.adminReason && (
                  <li>
                    <p className="font-bold">
                      Admin Reason: <span className="font-normal">{report?.adminReason}</span>
                    </p>
                  </li>
                )}
              </ul>
            </div>
            <div className="my-4 flex w-3/4 pl-5">
              {/* <Card className="py-2 shadow-none border rounded-md w-1/3">
                <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
                  <h4 className="font-bold text-large">Reporter</h4>
                </CardHeader>
                <CardBody className="overflow-visible">
                  <User
                    avatarProps={{
                      src: `${""}`,
                    }}
                    description={`mattle1@gmail.com`}
                    name={`Matt Le`}
                    className="my-3 justify-start"
                  />
                </CardBody>
              </Card> */}
              <div className="mx-5 flex">
                <i className="fa-regular fa-circle-right my-auto text-4xl"></i>
              </div>
              <Card className="w-1/3 rounded-md border py-2 shadow-none">
                <CardHeader className="flex-col items-start px-4 pb-0 pt-2">
                  <h4 className="text-large font-bold text-red-500">Reported Post Owner</h4>
                </CardHeader>
                <CardBody className="overflow-visible">
                  <User
                    avatarProps={{
                      src: `${post?.user?.avatar?.url}`,
                    }}
                    description={`${post?.user?.email}`}
                    name={`${post?.user?.firstName} ${post?.user?.lastName}`}
                    className="my-3 justify-start"
                  />
                </CardBody>
              </Card>
            </div>
          </div>
          <div className="my-3 rounded-md border bg-gray-200 p-3">
            <MyHeading2 content="Reported Reason" />
            <div className="mb-5 max-h-52 w-full overflow-y-auto pl-5">
              <p className="rounded-md bg-white p-3">{report?.reason}</p>
            </div>
          </div>
          <div className="my-3 rounded-md border bg-gray-200 p-3">
            <MyHeading2 content="Post Details" />
            <div className="w-full pb-5 pl-5">
              <div className="flex flex-col md:flex-row">
                <div className="mb-6 w-1/3 md:mb-0 md:mr-6 md:w-1/2">
                  <div
                    className="flex h-32 cursor-pointer select-none rounded-md border bg-white"
                    onClick={onOpen}
                  >
                    <i className="fa-solid fa-photo-film fa-2xl m-auto"> Media</i>
                  </div>
                </div>

                <div className="w-full rounded-lg bg-white p-2 md:w-2/3">
                  {post?.captions ? (
                    post.captions
                  ) : (
                    <p className="italic">This post contains no captions.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <Modal isOpen={isOpen} size="5xl" onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Post Media</ModalHeader>
              <ModalBody className="mt-4 grid grid-cols-4 items-stretch gap-2">
                {post?.media?.map((file) => {
                  const isVideo = file.mediaType.includes('VIDEO');

                  return (
                    <div key={file.url} className="relative h-full w-full">
                      {isVideo ? (
                        <video
                          src={file.url}
                          controls
                          className="aspect-square h-full w-full rounded-md border object-cover"
                        />
                      ) : (
                        <Image
                          src={file.url}
                          alt="Preview"
                          width={100}
                          height={100}
                          className="aspect-square h-full w-full rounded-md border object-cover"
                        />
                      )}
                    </div>
                  );
                })}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
                {/* <Button color="primary" onPress={onClose}>
                  Action
                </Button> */}
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <AdminReasonModal
        isOpen={isAdminReasonOpen}
        onClose={onAdminReasonOpenChange}
        onConfirm={handleAdminReasonConfirm}
        action={adminReasonAction}
        isLoading={isButtonLoading}
      />
    </div>
  );
};

export default PostDetail;
