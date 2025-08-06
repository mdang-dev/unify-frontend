'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  CardHeader,
  CardBody,
  User,
  Spinner,
  Chip,
  Button,
  Tooltip,
} from '@heroui/react';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';
import { postsQueryApi } from '@/src/apis/posts/query/posts.query.api';
import { ScrollArea } from '@/src/components/ui/scroll-area';
import { Badge } from '@/src/components/ui/badge';
import { Separator } from '@/src/components/ui/separator';

// Post status options
const POST_STATUSES = [
  { key: 0, value: 'Hidden', color: 'danger' },
  { key: 1, value: 'Visible', color: 'success' },
  { key: 2, value: 'Sensitive/Violent', color: 'warning' },
];

// Audience options
const AUDIENCE_OPTIONS = [
  { key: 'PUBLIC', value: 'Public' },
  { key: 'PRIVATE', value: 'Private' },
];

const PostDetailAdmin = () => {
  const { postId } = useParams();
  const router = useRouter();

  const { data: post, isLoading, error } = useQuery({
    queryKey: [QUERY_KEYS.POST_DETAIL, postId],
    queryFn: () => postsQueryApi.getPostsById(postId),
    enabled: !!postId,
  });

  const getStatusInfo = (status) => {
    const statusInfo = POST_STATUSES.find(s => s.key === status);
    return statusInfo || { value: 'Unknown', color: 'default' };
  };

  const getAudienceInfo = (audience) => {
    const audienceInfo = AUDIENCE_OPTIONS.find(a => a.key === audience);
    return audienceInfo || { value: audience };
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

  const handleBackToList = () => {
    router.push('/manage/posts/list');
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
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <i className="fa-solid fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
              <h3 className="text-lg font-semibold text-red-600">Error Loading Post</h3>
              <p className="text-sm text-muted-foreground">
                {error.message || 'An error occurred while loading post data'}
              </p>
              <Button
                variant="bordered"
                onClick={handleBackToList}
                className="mt-4"
              >
                <i className="fa-solid fa-arrow-left mr-2"></i>
                Back to Post List
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="h-screen w-full px-6 pb-10">
        <div className="mx-auto mb-6 flex max-w-7xl flex-col gap-6">
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <i className="fa-solid fa-search text-4xl text-muted-foreground mb-4"></i>
              <h3 className="text-lg font-semibold text-muted-foreground">Post Not Found</h3>
              <p className="text-sm text-muted-foreground">
                The requested post could not be found
              </p>
              <Button
                variant="bordered"
                onClick={handleBackToList}
                className="mt-4"
              >
                <i className="fa-solid fa-arrow-left mr-2"></i>
                Back to Post List
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(post.status);
  const audienceInfo = getAudienceInfo(post.audience);

  return (
    <div className="h-screen w-full px-6 pb-10">
      <div className="mx-auto mb-6 flex max-w-7xl flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="w-1/2">
            <h1 className="text-4xl font-bold">Post Details</h1>
            <p className="text-gray-500">
              View detailed information about this post.
            </p>
          </div>
          <Button
            variant="bordered"
            onClick={handleBackToList}
            className="flex items-center gap-2"
          >
            <i className="fa-solid fa-arrow-left"></i>
            Back to Post List
          </Button>
        </div>

        {/* Post Information */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="w-full">
              <CardHeader>
                <h2 className="text-2xl font-semibold">Basic Information</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Post ID</label>
                    <p className="text-lg font-semibold">{post.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Posted At</label>
                    <p className="text-lg">{formatDate(post.postedAt)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status: </label>
                    <Chip color={statusInfo.color} variant="flat" size="sm">
                      {statusInfo.value}
                    </Chip>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Audience: </label>
                    <Chip 
                      color={audienceInfo.key === 'PUBLIC' ? 'success' : 'warning'} 
                      variant="flat" 
                      size="sm"
                    >
                      {audienceInfo.value}
                    </Chip>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Comment Visibility: </label>
                    <Chip 
                      color={post.isCommentVisible ? 'success' : 'danger'} 
                      variant="flat" 
                      size="sm"
                    >
                      {post.isCommentVisible ? 'Visible' : 'Hidden'}
                    </Chip>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Like Visibility: </label>
                    <Chip 
                      color={post.isLikeVisible ? 'success' : 'danger'} 
                      variant="flat" 
                      size="sm"
                    >
                      {post.isLikeVisible ? 'Visible' : 'Hidden'}
                    </Chip>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Comment Count</label>
                    <p className="text-lg font-semibold">{post.commentCount || 0}</p>
                  </div>
                </div>
              </CardBody>
            </Card>

                         {/* Captions */}
             <Card className="w-full">
               <CardHeader>
                 <h2 className="text-2xl font-semibold">Captions</h2>
               </CardHeader>
               <CardBody>
                 {post.captions ? (
                   <p className="text-lg leading-relaxed whitespace-pre-wrap">{post.captions}</p>
                 ) : (
                   <p className="text-muted-foreground italic">No captions provided</p>
                 )}
               </CardBody>
             </Card>

             {/* Media Gallery */}
             {post.media && post.media.length > 0 && (
               <Card className="w-full">
                 <CardHeader>
                   <h2 className="text-2xl font-semibold">Media Gallery ({post.media.length} items)</h2>
                 </CardHeader>
                 <CardBody>
                   <div className="w-full overflow-x-auto">
                     <div className="flex gap-4 pb-4 min-w-max">
                       {post.media.map((file, index) => {
                         const isVideo = file.mediaType?.includes('VIDEO');
                         
                         return (
                           <div key={index} className="flex-shrink-0">
                             <div className="relative w-64 h-64 rounded-lg overflow-hidden border shadow-md hover:shadow-lg transition-shadow">
                               {isVideo ? (
                                 <video
                                   src={file.url}
                                   controls
                                   className="w-full h-full object-cover"
                                   preload="metadata"
                                 />
                               ) : (
                                 <Image
                                   src={file.url}
                                   alt={`Media ${index + 1}`}
                                   width={256}
                                   height={256}
                                   className="w-full h-full object-cover"
                                 />
                               )}
                               <div className="absolute top-2 right-2">
                                 <Badge variant="secondary" className="text-xs">
                                   {isVideo ? 'Video' : 'Image'}
                                 </Badge>
                               </div>
                               <div className="absolute bottom-2 left-2">
                                 <Badge variant="outline" className="text-xs bg-black/50 text-white">
                                   {index + 1} of {post.media.length}
                                 </Badge>
                               </div>
                             </div>
                           </div>
                         );
                       })}
                     </div>
                   </div>
                 </CardBody>
               </Card>
             )}

             {/* Hashtags */}
             {post.hashtags && post.hashtags.length > 0 && (
               <Card className="w-full">
                 <CardHeader>
                   <h2 className="text-2xl font-semibold">Hashtags</h2>
                 </CardHeader>
                 <CardBody>
                   <div className="flex flex-wrap gap-2">
                     {post.hashtags.map((hashtag, index) => (
                       <Badge key={index} variant="secondary">
                         #{hashtag.name}
                       </Badge>
                     ))}
                   </div>
                 </CardBody>
               </Card>
             )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* User Information */}
            <Card className="w-full">
              <CardHeader>
                <h2 className="text-xl font-semibold">Post Owner</h2>
              </CardHeader>
              <CardBody>
                <User
                  avatarProps={{
                    src: post.user?.avatar?.url || '/images/unify_icon_2.svg',
                    size: 'lg',
                  }}
                  description={post.user?.email || 'No email provided'}
                  name={`${post.user?.firstName || ''} ${post.user?.lastName || ''}`.trim() || 'Unknown User'}
                  className="justify-start"
                />
                <div className="mt-4 space-y-2">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">User ID</label>
                    <p className="text-sm font-semibold">{post.user?.id || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Username</label>
                    <p className="text-sm font-semibold">{post.user?.username || 'N/A'}</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Quick Actions */}
            <Card className="w-full">
              <CardHeader>
                <h2 className="text-xl font-semibold">Quick Actions</h2>
              </CardHeader>
              <CardBody className="space-y-3">
                <Tooltip content="View post in detail" placement="top">
                  <Button
                    color="primary"
                    variant="bordered"
                    className="w-full justify-start"
                    onClick={() => window.open(`/post/${post.id}`, '_blank')}
                  >
                    <i className="fa-solid fa-eye mr-2"></i>
                    View Post
                  </Button>
                </Tooltip>
                
                <Tooltip content="Hide this post" placement="top">
                  <Button
                    color="warning"
                    variant="bordered"
                    className="w-full justify-start"
                  >
                    <i className="fa-solid fa-eye-slash mr-2"></i>
                    Hide Post
                  </Button>
                </Tooltip>
                
                <Tooltip content="Delete this post" placement="top">
                  <Button
                    color="danger"
                    variant="bordered"
                    className="w-full justify-start"
                  >
                    <i className="fa-solid fa-trash mr-2"></i>
                    Delete Post
                  </Button>
                </Tooltip>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetailAdmin; 