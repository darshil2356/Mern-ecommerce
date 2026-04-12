import React from "react";
import { Table } from "antd";

const AdminDataTable = ({ columns, dataSource, loading, rowKey = "_id", paginationOptions }) => {
  const defaultPagination = {
    pageSize: 10,
    showSizeChanger: true,
    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <Table
          columns={columns}
          dataSource={dataSource}
          loading={loading}
          rowKey={rowKey}
          pagination={{ ...defaultPagination, ...paginationOptions }}
          className="admin-data-table"
          rowClassName="hover:bg-gray-50 transition-colors"
        />
      </div>
    </div>
  );
};

export default AdminDataTable;
