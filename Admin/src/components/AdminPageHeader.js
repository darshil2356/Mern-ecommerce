import React from "react";

const AdminPageHeader = ({ title, description, actionButton }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-6">
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">{title}</h2>
            {description && <p className="text-indigo-200 text-sm mt-1">{description}</p>}
          </div>
          {actionButton && <div>{actionButton}</div>}
        </div>
      </div>
    </div>
  );
};

export default AdminPageHeader;
