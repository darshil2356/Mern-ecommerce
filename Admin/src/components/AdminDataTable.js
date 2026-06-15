import React, { useState, useEffect } from "react";
import { Table, Pagination } from "antd";

/* ─── helpers ─────────────────────────────────────────────── */
const useIsMobile = () => {
  const [mobile, setMobile] = React.useState(() => window.innerWidth < 768);
  React.useEffect(() => {
    const handler = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return mobile;
};

/* ─── Mobile Card List ────────────────────────────────────── */
const MobileCardList = ({ columns, dataSource, rowKey, paginationOptions }) => {
  const pageSize = paginationOptions?.pageSize || 10;
  const [page, setPage] = useState(1);

  const total = dataSource?.length || 0;

  // Reset to page 1 whenever the dataset size changes (filter / delete / search)
  useEffect(() => { setPage(1); }, [total]);
  const start = (page - 1) * pageSize;
  const pageData = (dataSource || []).slice(start, start + pageSize);

  /* columns to show: skip pure-index "#" / "S.No" / "SNo" columns in the label row */
  const labelCols = columns.filter(
    (c) =>
      !["#", "s.no", "sno", "key"].includes(
        String(c.title?.props?.children || c.title || "").toLowerCase().trim()
      )
  );

  /* find the "primary" column (first non-index text column) for the card title */
  const primaryCol = labelCols[0];
  const restCols = labelCols.slice(1);

  const getKey = (record, idx) =>
    record?.[rowKey] ?? record?.key ?? record?._id ?? idx;

  const renderCell = (col, record) => {
    const raw = col.dataIndex ? record[col.dataIndex] : record;
    return col.render ? col.render(raw, record) : raw ?? "—";
  };

  return (
    <div style={{ padding: "0 0 8px" }}>
      {pageData.map((record, idx) => (
        <div
          key={getKey(record, idx)}
          style={{
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #f0f0f0",
            marginBottom: 10,
            overflow: "hidden",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          {/* Card header — primary column */}
          {primaryCol && (
            <div
              style={{
                padding: "10px 14px",
                borderBottom: "1px solid #f5f5f5",
                background: "#fafafa",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>
                {renderCell(primaryCol, record)}
              </div>
            </div>
          )}

          {/* Card body — rest of columns as label: value rows */}
          <div style={{ padding: "8px 14px" }}>
            {restCols.map((col, ci) => {
              const label =
                col.title?.props?.children ?? col.title ?? "";
              const value = renderCell(col, record);
              return (
                <div
                  key={ci}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 8,
                    padding: "5px 0",
                    borderBottom:
                      ci < restCols.length - 1
                        ? "1px solid #f9f9f9"
                        : "none",
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      color: "#9ca3af",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.3px",
                      flexShrink: 0,
                      minWidth: 70,
                    }}
                  >
                    {label}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      color: "#374151",
                      textAlign: "right",
                      wordBreak: "break-word",
                    }}
                  >
                    {value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Pagination */}
      {total > pageSize && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
          <Pagination
            current={page}
            pageSize={pageSize}
            total={total}
            onChange={setPage}
            size="small"
            showSizeChanger={false}
          />
        </div>
      )}

      {total === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "40px 0",
            color: "#9ca3af",
            fontSize: 14,
          }}
        >
          No data
        </div>
      )}
    </div>
  );
};

/* ─── Main Component ──────────────────────────────────────── */
const AdminDataTable = ({
  columns,
  dataSource,
  loading,
  rowKey = "_id",
  paginationOptions,
}) => {
  const isMobile = useIsMobile();

  const defaultPagination = {
    pageSize: 10,
    showSizeChanger: true,
    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
  };

  // Use data length as a key so Table remounts when dataset size changes
  const tableKey = (dataSource || []).length;

  if (isMobile) {
    return (
      <MobileCardList
        columns={columns}
        dataSource={dataSource}
        rowKey={rowKey}
        paginationOptions={{ ...defaultPagination, ...paginationOptions }}
      />
    );
  }

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <Table
        key={tableKey}
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        rowKey={rowKey}
        pagination={{ ...defaultPagination, ...paginationOptions, defaultCurrent: 1 }}
        className="admin-data-table"
        rowClassName="hover:bg-gray-50 transition-colors"
        scroll={{ x: "max-content" }}
      />
    </div>
  );
};

export default AdminDataTable;
