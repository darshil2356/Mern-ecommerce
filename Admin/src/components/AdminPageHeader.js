import React from "react";

const AdminPageHeader = ({ title, description, icon, actionButton, gradient = "from-indigo-600 to-indigo-700" }) => (
  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-6">
    <div className={`bg-gradient-to-r ${gradient} px-6 py-5`}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white text-xl">
              {icon}
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold text-white">{title}</h2>
            {description && <p className="text-white/70 text-sm mt-0.5">{description}</p>}
          </div>
        </div>
        {actionButton && <div>{actionButton}</div>}
      </div>
    </div>
  </div>
);

export default AdminPageHeader;
