'use client';

import { useEffect, useState } from 'react';

interface TicketIdProps {
  prefix: string;
}

export default function TicketId({ prefix }: TicketIdProps) {
  const [ticketId, setTicketId] = useState('');

  useEffect(() => {
    // Generate ticket ID only on client side
    const id = Math.random().toString(36).substr(2, 6).toUpperCase();
    setTicketId(`${prefix}-${id}`);
  }, [prefix]);

  if (!ticketId) {
    return <span>#{prefix}-XXXXXX</span>;
  }

  return <span>#{ticketId}</span>;
} 