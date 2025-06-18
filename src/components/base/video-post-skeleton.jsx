import Skeleton from './skeleton';

const VideoPostSkeleton = () => (
  <>
    <div className="relative m-5 mx-auto h-[680px] w-[450px] flex-shrink-0 snap-start overflow-hidden rounded-b-xl">
      <Skeleton className="h-full w-full" rounded />
      <div className="absolute bottom-4 left-4 flex flex-col text-white">
        <div className="flex items-center">
          <Skeleton variant="circle" width={40} height={40} />
          <div className="flex items-center space-x-2 pl-2">
            <Skeleton width={80} height={16} rounded />
            <Skeleton width={60} height={24} rounded />
          </div>
        </div>
        <div className="mt-2 w-[350px]">
          <Skeleton width="75%" height={16} rounded />
          <Skeleton width="50%" height={16} rounded />
        </div>
      </div>

      <div className="absolute right-4 top-2/3 flex -translate-y-1/2 transform flex-col items-center space-y-7">
        <Skeleton variant="circle" width={24} height={24} />
        <Skeleton variant="circle" width={24} height={24} />
        <Skeleton variant="circle" width={24} height={24} />
        <Skeleton variant="circle" width={24} height={24} />
        <Skeleton variant="circle" width={24} height={24} />
      </div>
    </div>
  </>
);

export default VideoPostSkeleton;
