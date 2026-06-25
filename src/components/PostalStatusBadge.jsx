import React from 'react';

const PostalStatusBadge = ({ status }) => {
  const getBadgeStyles = () => {
    switch (status) {
      case 'DOCUMENT_PENDING':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'SUBMITTED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'EXPIRED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'DOCUMENT_PENDING':
        return 'Document Pending';
      case 'SUBMITTED':
        return 'Submitted';
      case 'EXPIRED':
        return 'Expired';
      default:
        return status || 'Unknown';
    }
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold uppercase border tracking-wider ${getBadgeStyles()}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-ping"></span>
      {getStatusText()}
    </span>
  );
};

export default PostalStatusBadge;
