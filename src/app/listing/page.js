"use client";

import { useSearchParams } from 'next/navigation';
import ListingClient from './ListingClient';
import { Suspense } from 'react';

function ListingPageContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  
  if (!id) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Loading listing details...</h2>
        <p>Please wait while we retrieve the item information.</p>
      </div>
    );
  }
  
  return <ListingClient id={id} />;
}

export default function ListingPage() {
  return (
    <Suspense fallback={<div>Loading listing...</div>}>
      <ListingPageContent />
    </Suspense>
  );
}
