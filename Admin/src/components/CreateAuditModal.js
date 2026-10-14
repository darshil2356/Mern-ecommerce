import React, { useState } from "react";
import { Modal, Input, Select, Radio, Alert, message } from "antd";
import { FiCalendar, FiPackage, FiUser, FiInfo, FiCheckCircle } from "react-icons/fi";
import stockAuditService from "../features/stockAudit/stockAuditService";

const { TextArea } = Input;

const PERIOD_OPTIONS = [
  { value: "HALF_YEARLY_H1", label: "🗓️ H1 Half-Yearly Audit (April - September)" },
  { value: "HALF_YEARLY_H2", label: "🗓️ H2 Half-Yearly Audit (October - March)" },
  { value: "ANNUAL", label: "🏆 Annual Full Store Stock Count (Year-End)" },
  { value: "QUARTERLY", label: "📊 Quarterly Review (Every 3 Months)" },
  { value: "SURPRISE_AUDIT", label: "🚨 Surprise Anti-Theft Stock Check" },
  { value: "CUSTOM", label: "✏️ Custom Date Range Audit" },
];

const CreateAuditModal = ({ open, onCancel, onSuccess, categories = [], brands = [] }) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const defaultPeriod = currentMonth >= 4 && currentMonth <= 9 ? "HALF_YEARLY_H1" : "HALF_YEARLY_H2";
  const defaultTitle = `${defaultPeriod === "HALF_YEARLY_H1" ? "H1" : "H2"} ${currentYear} Store Stock Calculation & Audit`;

  const [title, setTitle] = useState(defaultTitle);
  const [periodType, setPeriodType] = useState(defaultPeriod);
  const [fiscalYear, setFiscalYear] = useState(`${currentYear}-${currentYear + 1}`);
  const [scope, setScope] = useState("ALL_PRODUCTS");
  const [scopeTarget, setScopeTarget] = useState("");
  const [supervisorStaff, setSupervisorStaff] = useState("");
  const [ownerSummaryNotes, setOwnerSummaryNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePeriodChange = (val) => {
    setPeriodType(val);
    const label = PERIOD_OPTIONS.find((p) => p.value === val)?.label.split(" ")[1] || "Audit";
    setTitle(`${label} ${currentYear} Store Stock Calculation`);
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      message.error("Please enter an audit title.");
      return;
    }
    if (scope !== "ALL_PRODUCTS" && !scopeTarget.trim()) {
      message.error("Please select or enter the specific category or brand.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        periodType,
        fiscalYear,
        scope,
        scopeTarget: scope === "ALL_PRODUCTS" ? "All Store Products" : scopeTarget,
        supervisorStaff: supervisorStaff.trim(),
        ownerSummaryNotes: ownerSummaryNotes.trim(),
      };

      const res = await stockAuditService.createAudit(payload);
      message.success("Stock calculation session initiated successfully!");
      if (onSuccess) onSuccess(res.audit);
      onCancel();
    } catch (err) {
      console.error("Failed to start stock audit", err);
      message.error(err?.response?.data?.message || "Failed to start stock calculation session.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-lg font-bold text-gray-800">
          <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">🧮</span>
          <span>Start New Store Stock Calculation & Audit</span>
        </div>
      }
      open={open}
      onCancel={onCancel}
      onOk={handleCreate}
      okText={loading ? "Initializing..." : "Start Calculation Session"}
      okButtonProps={{ loading, className: "bg-indigo-600 hover:bg-indigo-700" }}
      cancelButtonProps={{ disabled: loading }}
      width={680}
      centered
      destroyOnClose
    >
      <div className="py-2 space-y-4 text-sm text-gray-700">
        <Alert
          message="6-Month / Periodic Stock Audit Purpose"
          description="This module freezes a snapshot of your computer's expected stock. You will count the physical stock in your store. Any shortage highlights unbilled sales (staff pocketing customer cash) or shoplifting loss."
          type="info"
          showIcon
          className="rounded-xl border-indigo-100 bg-indigo-50/70 text-xs"
        />

        {/* Audit Title */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
            Audit Title *
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. H1 2026 Store Stock Calculation"
            size="large"
            className="rounded-lg"
          />
        </div>

        {/* Period & Fiscal Year */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
              Audit Period / Cycle *
            </label>
            <Select
              value={periodType}
              onChange={handlePeriodChange}
              options={PERIOD_OPTIONS}
              size="large"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
              Fiscal Year
            </label>
            <Input
              value={fiscalYear}
              onChange={(e) => setFiscalYear(e.target.value)}
              placeholder="e.g. 2026-2027"
              size="large"
              className="rounded-lg"
            />
          </div>
        </div>

        {/* Audit Scope */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
            Audit Scope (Which products to calculate)
          </label>
          <Radio.Group
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            className="flex flex-wrap gap-4"
          >
            <Radio value="ALL_PRODUCTS" className="font-medium text-gray-800">
              Entire Store (All Products)
            </Radio>
            <Radio value="CATEGORY" className="font-medium text-gray-800">
              By Category
            </Radio>
            <Radio value="BRAND" className="font-medium text-gray-800">
              By Brand
            </Radio>
          </Radio.Group>

          {scope === "CATEGORY" && (
            <div className="mt-2">
              <Select
                placeholder="Select category to audit"
                value={scopeTarget || undefined}
                onChange={(val) => setScopeTarget(val)}
                className="w-full"
                size="large"
                showSearch
                options={categories.map((c) => ({
                  value: c.title || c.name || c,
                  label: c.title || c.name || c,
                }))}
              />
            </div>
          )}

          {scope === "BRAND" && (
            <div className="mt-2">
              <Select
                placeholder="Select brand to audit"
                value={scopeTarget || undefined}
                onChange={(val) => setScopeTarget(val)}
                className="w-full"
                size="large"
                showSearch
                options={brands.map((b) => ({
                  value: b.title || b.name || b,
                  label: b.title || b.name || b,
                }))}
              />
            </div>
          )}
        </div>

        {/* Staff In Charge */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
            Staff / Supervisor Assisting in Store Counting (Accountability)
          </label>
          <Input
            prefix={<FiUser className="text-gray-400" />}
            value={supervisorStaff}
            onChange={(e) => setSupervisorStaff(e.target.value)}
            placeholder="Staff name(s) responsible for physical counting"
            size="large"
            className="rounded-lg"
          />
        </div>

        {/* Owner Notes */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
            Owner Notes & Specific Instructions
          </label>
          <TextArea
            rows={2}
            value={ownerSummaryNotes}
            onChange={(e) => setOwnerSummaryNotes(e.target.value)}
            placeholder="e.g. Check front counter display, warehouse racks, and cash counter drawer."
            className="rounded-lg"
          />
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-start gap-2">
          <FiInfo className="text-amber-600 mt-0.5 flex-shrink-0 text-base" />
          <div>
            <span className="font-bold">Owner Clarity Guarantee:</span> Starting this session will not disrupt your regular sales. You can save counts as drafts, scan barcodes continuously, pause and resume anytime across multiple days.
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CreateAuditModal;
