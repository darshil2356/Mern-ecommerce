import React, { useState, useEffect } from "react";
import { Modal, Table, Tag, Button, Empty, Spin, message, Popconfirm } from "antd";
import { FiShield, FiUser, FiAlertCircle, FiCheckCircle } from "react-icons/fi";
import productService from "../features/product/productService";

const ProductStockLogsModal = ({ open, onClose, product = null }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    if (!product?._id) return;
    setLoading(true);
    try {
      const data = await productService.getProductStockLogs(product._id);
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching product stock logs:", err);
      message.error("Failed to load stock audit history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && product?._id) {
      fetchLogs();
    } else {
      setLogs([]);
    }
  }, [open, product?._id]);

  const handleUpdateAudit = async (logId, status) => {
    try {
      await productService.updateStockLogAudit({
        logId,
        data: {
          auditStatus: status,
          investigationNotes: status === "VERIFIED_GENUINE" ? "Verified as genuine by admin" : "Flagged as suspicious manual reduction",
        },
      });
      message.success(`Audit status updated to ${status === "VERIFIED_GENUINE" ? "Verified" : "Suspicious"}`);
      fetchLogs();
      window.dispatchEvent(new CustomEvent("stock_alerts_changed"));
    } catch (err) {
      message.error("Failed to update status");
    }
  };

  const columns = [
    {
      title: "Date & Time",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 140,
      render: (date) => {
        if (!date) return "—";
        const d = new Date(date);
        return (
          <div className="flex flex-col text-xs">
            <span className="font-semibold text-gray-800">
              {d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
            <span className="text-gray-400">
              {d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
            </span>
          </div>
        );
      },
    },
    {
      title: "Change",
      key: "change",
      width: 130,
      render: (_, r) => {
        const isReduce = r.changeType === "MANUAL_REDUCE" || r.diffQuantity < 0;
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="text-gray-400">{r.previousStock}</span>
              <span>➔</span>
              <span className="font-bold text-gray-900">{r.newStock}</span>
            </div>
            <Tag
              color={isReduce ? "error" : "success"}
              className="font-bold text-xs m-0 w-fit rounded-full px-2 py-0.5"
            >
              {isReduce ? "🔻 " : "🔺 +"}
              {Math.abs(r.diffQuantity)} {Math.abs(r.diffQuantity) === 1 ? "unit" : "units"}
            </Tag>
          </div>
        );
      },
    },
    {
      title: "Color / Size",
      key: "variantBreakdown",
      width: 170,
      render: (_, r) => {
        if (r.itemsBreakdown && r.itemsBreakdown.length > 0) {
          return (
            <div className="flex flex-col gap-1 max-w-[200px]">
              {r.itemsBreakdown.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5 flex-wrap text-xs">
                  {item.color && (
                    <span className="font-semibold text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded text-[11px] border border-gray-200">
                      🎨 {item.color}
                    </span>
                  )}
                  {item.size && (
                    <span className="font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded text-[11px] border border-indigo-100">
                      {item.size}
                    </span>
                  )}
                  <span className="text-[11px] font-bold text-red-600">
                    (-{item.reducedUnits || Math.abs(r.diffQuantity)})
                  </span>
                </div>
              ))}
            </div>
          );
        }
        if (r.variantDetails?.color || r.variantDetails?.size) {
          return (
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              {r.variantDetails.color && (
                <span className="font-semibold text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded text-[11px] border border-gray-200">
                  🎨 {r.variantDetails.color}
                </span>
              )}
              {r.variantDetails.size && (
                <span className="font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded text-[11px] border border-indigo-100">
                  {r.variantDetails.size}
                </span>
              )}
            </div>
          );
        }
        return <span className="text-gray-400 text-xs italic">Standard</span>;
      },
    },
    {
      title: "Reason & Notes",
      key: "reason",
      render: (_, r) => (
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-gray-900 text-xs">{r.reason}</span>
          {r.notes && (
            <span className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded px-1.5 py-0.5 w-fit max-w-[280px] truncate" title={r.notes}>
              "{r.notes}"
            </span>
          )}
          {r.potentialLossAmount > 0 && (
            <span className="text-[11px] font-semibold text-red-600">
              Cash Risk: ₹{r.potentialLossAmount.toLocaleString()}
            </span>
          )}
        </div>
      ),
    },
    {
      title: "Handled By",
      key: "staff",
      width: 150,
      render: (_, r) => (
        <div className="flex flex-col text-xs">
          <div className="flex items-center gap-1 text-gray-800 font-semibold">
            <FiUser size={12} className="text-gray-400" />
            <span>{r.staffName || r.performedBy?.name || "Admin"}</span>
          </div>
          {r.performedBy?.role && (
            <span className="text-[11px] text-gray-400 capitalize">Role: {r.performedBy.role}</span>
          )}
        </div>
      ),
    },
    {
      title: "Audit Status",
      dataIndex: "auditStatus",
      key: "auditStatus",
      width: 140,
      render: (status, r) => {
        if (r.changeType === "MANUAL_ADD") {
          return <Tag color="blue" className="rounded-full text-xs">Stock Added</Tag>;
        }
        if (status === "VERIFIED_GENUINE") {
          return <Tag color="success" className="rounded-full text-xs font-semibold">✓ Verified Genuine</Tag>;
        }
        if (status === "SUSPECTED_FRAUD") {
          return <Tag color="error" className="rounded-full text-xs font-bold animate-pulse">🚨 Suspected Fraud</Tag>;
        }
        return <Tag color="warning" className="rounded-full text-xs font-semibold">⏳ Pending Review</Tag>;
      },
    },
    {
      title: "Action",
      key: "action",
      width: 110,
      render: (_, r) => {
        if (r.changeType === "MANUAL_ADD") return null;
        return (
          <div className="flex items-center gap-1">
            {r.auditStatus !== "VERIFIED_GENUINE" && (
              <Popconfirm
                title="Verify as Genuine?"
                description="Confirm this stock reduction is legitimate."
                onConfirm={() => handleUpdateAudit(r._id, "VERIFIED_GENUINE")}
                okText="Verify"
                cancelText="Cancel"
              >
                <Button size="small" type="text" className="text-green-600 hover:text-green-700 p-1" title="Mark Verified">
                  <FiCheckCircle size={14} />
                </Button>
              </Popconfirm>
            )}
            {r.auditStatus !== "SUSPECTED_FRAUD" && (
              <Popconfirm
                title="Flag as Suspicious?"
                description="Flag this manual reduction for fraud investigation."
                onConfirm={() => handleUpdateAudit(r._id, "SUSPECTED_FRAUD")}
                okText="Flag Suspicious"
                okButtonProps={{ danger: true }}
                cancelText="Cancel"
              >
                <Button size="small" type="text" danger className="p-1" title="Flag Suspicious">
                  <FiAlertCircle size={14} />
                </Button>
              </Popconfirm>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={950}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FiShield size={16} />
          </div>
          <div>
            <span className="font-bold text-gray-900 text-sm block">
              Stock Audit History & Fraud Logs
            </span>
            <span className="text-xs text-gray-500 font-normal">
              {product?.title ? `Product: ${product.title}` : ""}
            </span>
          </div>
        </div>
      }
    >
      <div className="py-2">
        {loading ? (
          <div className="py-12 flex justify-center items-center">
            <Spin tip="Loading stock audit logs..." />
          </div>
        ) : logs.length === 0 ? (
          <Empty
            description={
              <div className="text-xs text-gray-500">
                No manual stock reductions or adjustments recorded for this product yet.
              </div>
            }
            className="py-8"
          />
        ) : (
          <Table
            dataSource={logs.map((l) => ({ ...l, key: l._id }))}
            columns={columns}
            pagination={{ pageSize: 5 }}
            size="small"
            className="rounded-lg overflow-hidden border border-gray-100"
          />
        )}
      </div>
    </Modal>
  );
};

export default ProductStockLogsModal;
