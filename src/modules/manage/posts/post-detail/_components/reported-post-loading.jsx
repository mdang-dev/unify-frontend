'use client';
import { Card, CardBody, CardHeader, Skeleton, User } from '@heroui/react';
import React from 'react';

const MyHeading2 = ({ content = 'Heading 2' }) => {
  return <h2 className="my-4 text-2xl font-bold">{content}</h2>;
};

const ReportedPostLoading = () => {
  return (
    <>
      <div className="my-3 rounded-md border bg-gray-100 p-3">
        <MyHeading2 content="Basic Info" />
        <div className="w-3/4 pl-5">
          <ul>
            <li>
              <div className="flex font-bold">
                Reported Date:{' '}
                <Skeleton className="ml-2 h-5 rounded-md">Mar 28, 2025, 12:00 PM</Skeleton>
              </div>
            </li>
            <li>
              <div className="flex font-bold">
                Status: <Skeleton className="ml-2 h-5 rounded-md p-1">Pending</Skeleton>
              </div>
            </li>
            <li>
              <div className="flex font-bold">
                Reporter&apos;s ID:{' '}
                <Skeleton className="ml-2 h-5 rounded-md p-1">
                  6092c189-e24a-451f-9da7-b25d8e2605f1
                </Skeleton>
              </div>
            </li>
            <li>
              <div className="flex font-bold">
                Reported Post&apos;s ID:{' '}
                <Skeleton className="ml-2 h-5 rounded-md p-1">
                  6092c189-e24a-451f-9da7-b25d8e2605f1
                </Skeleton>
              </div>
            </li>
          </ul>
        </div>
        <div className="my-4 flex w-3/4 pl-5">
          <Card className="w-1/3 rounded-md border py-2 shadow-none">
            <CardHeader className="flex-col items-start px-4 pb-0 pt-2">
              <h4 className="text-large font-bold">Reporter</h4>
            </CardHeader>
            <Skeleton className="mx-3 rounded-md">
              <CardBody className="overflow-visible">
                <User
                  avatarProps={{
                    src: `${''}`,
                  }}
                  description={`mattle1@gmail.com`}
                  name={`Matt Le`}
                  className="my-3 justify-start"
                />
              </CardBody>
            </Skeleton>
          </Card>
          <div className="mx-5 flex">
            <i className="fa-regular fa-circle-right my-auto text-4xl"></i>
          </div>

          <Card className="w-1/3 rounded-md border py-2 shadow-none">
            <CardHeader className="flex-col items-start px-4 pb-0 pt-2">
              <h4 className="text-large font-bold text-red-500">Reported Post Owner</h4>
            </CardHeader>
            <Skeleton className="mx-3 rounded-md">
              <CardBody className="overflow-visible">
                <User
                  avatarProps={{
                    src: `${''}`,
                  }}
                  description={`mattle1@gmail.com`}
                  name={`Matt Le`}
                  className="my-3 justify-start"
                />
              </CardBody>
            </Skeleton>
          </Card>
        </div>
      </div>
      <div className="my-3 rounded-md border bg-gray-100 p-3">
        <MyHeading2 content="Reported Reason" />
        <Skeleton className="ml-5 rounded-md">
          <div className="max-h-52 w-full overflow-y-auto pl-5">
            Lorem ipsum, dolor sit amet consectetur adipisicing elit. Numquam totam cupiditate
            recusandae similique officia explicabo possimus perferendis sunt, quam quibusdam
            accusantium expedita est odit magni fugiat iste fuga quas atque.
          </div>
        </Skeleton>
      </div>
      <div className="my-3 rounded-md border bg-gray-100 p-3">
        <MyHeading2 content="Post Details" />
        <div className="w-full pb-5 pl-5">
          <div className="flex flex-col md:flex-row">
            <Skeleton className="w-1/3 rounded-md">
              <div className="mb-6 w-1/3 md:mb-0 md:mr-6 md:w-1/2">
                <div className="flex h-32 cursor-pointer select-none rounded-md border">
                  <i className="fa-solid fa-photo-film fa-2xl m-auto"> Media</i>
                </div>
              </div>
            </Skeleton>

            <Skeleton className="ml-5 w-2/3 rounded-md">
              <div className="w-full rounded-lg bg-zinc-100 p-2 md:w-2/3">
                Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aliquam iusto mollitia
                fugit. Officia facilis accusantium maxime repudiandae, praesentium, animi id
                doloremque illo cum adipisci illum tempore impedit officiis necessitatibus vel.
              </div>
            </Skeleton>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReportedPostLoading;
