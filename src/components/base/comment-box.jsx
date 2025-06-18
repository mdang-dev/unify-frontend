import React, { useState } from 'react';
import { Form, Input, Button, Textarea } from '@heroui/react';
import Image from 'next/image';
import SendButton from '@/public/images/send.png';

export default function CommentBox({ action = '', placeholder = 'Write your comment here' }) {
  const [submitted, setSubmitted] = React.useState(null);
  const [isTyping, setIsTyping] = useState(false);

  const onSubmit = (e) => {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(e.currentTarget));

    setSubmitted(data);
  };

  return (
    <Form
      className="flex w-full flex-row"
      validationBehavior="native"
      action={action}
      onSubmit={onSubmit}
    >
      <Textarea
        className="flex-grow"
        onValueChange={(s) => {
          setIsTyping(s !== '');
        }}
        placeholder={placeholder}
        minRows={1}
        variant="underlined"
      />
      <Button
        type="submit"
        size="sm"
        color="success"
        disabled={!isTyping}
        className={`${isTyping ? '' : 'pointer-events-none opacity-35'} my-auto bg-transparent`}
      >
        <Image src={SendButton} className="h-auto w-6" alt="Send" />
      </Button>
    </Form>
  );
}
