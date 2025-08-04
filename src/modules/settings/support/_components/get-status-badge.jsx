import { Badge } from '@/src/components/ui/badge';

const getStatusBadge = (status) => {
  switch (status) {
    case 0:
      return (
        <>
          <Badge className="bg-yellow-100 text-xs text-yellow-800">Under Review</Badge>
          <span className="mt-1 block text-xs text-gray-500">
            Someone has reported your post, and we are currently reviewing it. Please take a moment
            to review your own post before we make a decision to approve or remove it from the
            platform.
          </span>
        </>
      );
    case 1:
      return (
        <>
          <Badge className="bg-green-100 text-xs text-green-800">Approved</Badge>
          <span className="mt-1 block text-xs text-gray-500">
            {/* Your post has violated our community guidelines and has been removed from feeds and your
            personal page. You can review the post here, and we encourage you to revisit our
            policies to ensure proper use of the platform. */}
          </span>
        </>
      );
    case 2:
      return (
        <>
          <Badge className="bg-red-100 text-xs text-red-800">Rejected</Badge>
          {/* <span className="mt-1 block text-xs text-gray-500">This report has been rejected.</span> */}
        </>
      );
    default:
      return (
        <>
          <Badge className="bg-gray-100 text-xs text-gray-800">Unknown</Badge>
          <span className="mt-1 block text-xs text-gray-500">Status unknown.</span>
        </>
      );
  }
};

export default getStatusBadge;
