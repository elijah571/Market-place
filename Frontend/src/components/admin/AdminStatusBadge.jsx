import React from 'react';

export const AdminStatusBadge = ({ children, tone = 'neutral' }) => {
  return <span className={`admin-badge admin-badge--${tone}`}>{children}</span>;
};
