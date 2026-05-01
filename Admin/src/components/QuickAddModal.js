import React, { useState } from "react";
import { Modal, Input, Button } from "antd";
import { useDispatch } from "react-redux";
import { createColor, getColors } from "../features/color/colorSlice";
import { createBrand, getBrands } from "../features/brand/brandSlice";
import { createCategory, getCategories } from "../features/pcategory/pcategorySlice";
import { createSize, getSizes } from "../features/size/sizeSlice";
import { createVendor, getVendors } from "../features/vendor/vendorSlice";
import { toast } from "react-toastify";

/**
 * QuickAddModal
 * Props:
 *  - type: "color" | "brand" | "category"
 *  - open: boolean
 *  - onClose: () => void
 *  - onCreated: (newItem) => void  — called with the created item so parent can auto-select it
 */
const QuickAddModal = ({ type, open, onClose, onCreated }) => {
  const dispatch = useDispatch();
  const [name, setName] = useState("");
  const [hex, setHex] = useState("#000000");
  const [loading, setLoading] = useState(false);

  const titles = { color: "Add New Color", brand: "Add New Brand", category: "Add New Category", size: "Add New Size", vendor: "Add New Vendor" };

  const handleSave = async () => {
    if (!name.trim()) return toast.error("Name is required");
    setLoading(true);
    try {
      let result;
      if (type === "color") {
        result = await dispatch(createColor({ name: name.trim(), hex })).unwrap();
        await dispatch(getColors());
      } else if (type === "brand") {
        result = await dispatch(createBrand({ title: name.trim() })).unwrap();
        await dispatch(getBrands());
      } else if (type === "size") {
        result = await dispatch(createSize({ title: name.trim() })).unwrap();
        await dispatch(getSizes());
      } else if (type === "vendor") {
        result = await dispatch(createVendor({ title: name.trim() })).unwrap();
        await dispatch(getVendors());
      } else {
        result = await dispatch(createCategory({ title: name.trim() })).unwrap();
        await dispatch(getCategories());
      }
      toast.success(`${titles[type]} created!`);
      onCreated(result);
      setName("");
      setHex("#000000");
      onClose();
    } catch {
      toast.error("Failed to create. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={titles[type]}
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>Cancel</Button>,
        <Button key="save" type="primary" loading={loading} onClick={handleSave}>Save</Button>,
      ]}
      width="min(360px, 95vw)"
    >
      <div className="mb-3">
        <label className="fw-medium mb-1 d-block">
          {type === "color" ? "Color Name" : type === "brand" ? "Brand Name" : type === "size" ? "Size" : type === "vendor" ? "Vendor Name" : "Category Name"}
        </label>
        <Input
          placeholder={type === "color" ? "e.g. Forest Green" : type === "brand" ? "e.g. Nike" : type === "size" ? "e.g. M, XL, 32, Free Size" : type === "vendor" ? "e.g. Supplier Co." : "e.g. T-Shirts"}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onPressEnter={handleSave}
          autoFocus
        />
      </div>
      {type === "color" && (
        <div>
          <label className="fw-medium mb-1 d-block">Color Hex</label>
          <div className="d-flex align-items-center gap-2">
            <input
              type="color"
              value={hex}
              onChange={(e) => setHex(e.target.value)}
              style={{ width: 48, height: 36, border: "none", cursor: "pointer", borderRadius: 6 }}
            />
            <Input value={hex} onChange={(e) => setHex(e.target.value)} style={{ width: 120 }} />
          </div>
        </div>
      )}
    </Modal>
  );
};

export default QuickAddModal;
