'use client';

import React from 'react';

type Props = {
  testName: string;
  testId: string;
};

export default function CounselorRecipientExpandTestName({ testName, testId }: Props) {
  return <span>{testName || testId}</span>;
}
