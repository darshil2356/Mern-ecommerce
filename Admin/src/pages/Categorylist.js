import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createCategory, deleteAProductCategory, getCategories, getCategoryTree,
  updateAProductCategory, resetState,
} from "../features/pcategory/pcategorySlice";
import { Modal, Input, Select, Button, Tooltip, Tag, Badge } from "antd";
import { toast } from "react-toastify";
import { FaPlus, FaTags, FaChevronDown, FaChevronRight, FaFolder, FaFolderOpen } from "react-icons/fa";
import { BiEdit } from "react-icons/bi";
import { AiFillDelete, AiOutlinePlus } from "react-icons/ai";
import { MdDragIndicator } from "react-icons/md";
import CustomModal from "../components/CustomModal";

// ── Tree Node Component ───────────────────────────────────────────────────────
const TreeNode = ({ node, depth = 0, allFlat, onAddChild, onEdit, onDelete, expandedIds, toggleExpand }) => {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedIds.has(node._id);
  const isRoot = depth === 0;

  const depthColors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
  const color = depthColors[depth % depthColors.length];
  const bgColor = depth === 0 ? "#f8f7ff" : depth === 1 ? "#f0fdf9" : "#fffbf0";

  return (
    <div style={{ marginLeft: depth === 0 ? 0 : 20 }}>
      {/* Connecting line */}
      {depth > 0 && (
        <div style={{
          position: "absolute",
          left: depth * 20 - 12,
          top: 0,
          bottom: 0,
          width: 1,
          background: "#e5e7eb",
          pointerEvents: "none",
        }} />
      )}

      {/* Node row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 14px",
          background: bgColor,
          borderRadius: 12,
          marginBottom: 6,
          border: `1.5px solid ${color}22`,
          transition: "all 0.2s ease",
          position: "relative",
          cursor: "default",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 4px 16px ${color}22`; e.currentTarget.style.borderColor = `${color}55`; }}
        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = `${color}22`; }}
      >
        {/* Drag handle */}
        <MdDragIndicator style={{ color: "#d1d5db", fontSize: 18, flexShrink: 0, cursor: "grab" }} />

        {/* Expand/Collapse */}
        <button
          onClick={() => hasChildren && toggleExpand(node._id)}
          style={{
            background: "none", border: "none", cursor: hasChildren ? "pointer" : "default",
            padding: 2, color: hasChildren ? color : "#d1d5db", flexShrink: 0,
            width: 20, display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {hasChildren
            ? (isExpanded ? <FaChevronDown size={11} /> : <FaChevronRight size={11} />)
            : <span style={{ width: 11 }} />}
        </button>

        {/* Folder icon */}
        {isExpanded || !hasChildren
          ? <FaFolderOpen style={{ color, fontSize: 16, flexShrink: 0 }} />
          : <FaFolder style={{ color, fontSize: 16, flexShrink: 0 }} />
        }

        {/* Title */}
        <span style={{ flex: 1, fontWeight: depth === 0 ? 700 : 500, fontSize: 14, color: "#1a1a1a" }}>
          {node.title}
        </span>

        {/* Badges */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <Tag color={depth === 0 ? "purple" : depth === 1 ? "green" : "gold"} style={{ margin: 0, borderRadius: 20, fontSize: 11 }}>
            {depth === 0 ? "Level 1" : depth === 1 ? "Level 2" : "Level 3"}
          </Tag>
          {hasChildren && (
            <Badge count={node.children.length} style={{ backgroundColor: color, fontSize: 10 }} />
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          {depth < 2 && (
            <Tooltip title="Add subcategory">
              <button
                onClick={() => onAddChild(node)}
                style={{
                  width: 30, height: 30, borderRadius: 8, border: `1.5px solid ${color}44`,
                  background: `${color}11`, color, cursor: "pointer", display: "flex",
                  alignItems: "center", justifyContent: "center",
                }}
              >
                <AiOutlinePlus size={14} />
              </button>
            </Tooltip>
          )}
          <Tooltip title="Edit">
            <button
              onClick={() => onEdit(node)}
              style={{
                width: 30, height: 30, borderRadius: 8, border: "1.5px solid #6366f122",
                background: "#6366f111", color: "#6366f1", cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center",
              }}
            >
              <BiEdit size={14} />
            </button>
          </Tooltip>
          <Tooltip title={hasChildren ? "Remove children first" : "Delete"}>
            <button
              onClick={() => !hasChildren && onDelete(node._id)}
              disabled={hasChildren}
              style={{
                width: 30, height: 30, borderRadius: 8, border: "1.5px solid #ef444422",
                background: "#ef444411", color: hasChildren ? "#d1d5db" : "#ef4444",
                cursor: hasChildren ? "not-allowed" : "pointer", display: "flex",
                alignItems: "center", justifyContent: "center", opacity: hasChildren ? 0.5 : 1,
              }}
            >
              <AiFillDelete size={14} />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Children */}
      {hasChildren && (
        <div
          style={{
            overflow: "hidden",
            maxHeight: isExpanded ? "9999px" : 0,
            transition: "max-height 0.3s ease",
            paddingLeft: 18,
            borderLeft: `2px solid ${color}33`,
            marginLeft: 18,
            marginBottom: isExpanded ? 4 : 0,
          }}
        >
          {isExpanded && node.children.map((child) => (
            <TreeNode
              key={child._id}
              node={child}
              depth={depth + 1}
              allFlat={allFlat}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const Categorylist = () => {
  const dispatch = useDispatch();
  const pCatStat = useSelector((state) => state.pCategory.pCategories);
  const categoryTree = useSelector((state) => state.pCategory.categoryTree);
  const isLoading = useSelector((state) => state.pCategory.isLoading);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pCatId, setPCatId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editNode, setEditNode] = useState(null);
  const [parentNode, setParentNode] = useState(null); // for "add child"
  const [title, setTitle] = useState("");
  const [parentId, setParentId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [viewMode, setViewMode] = useState("tree"); // "tree" | "flat"

  useEffect(() => {
    dispatch(getCategories());
    dispatch(getCategoryTree());
  }, [dispatch]);

  // Auto-expand all root nodes
  useEffect(() => {
    if (categoryTree.length > 0) {
      setExpandedIds(new Set(categoryTree.map((n) => n._id)));
    }
  }, [categoryTree]);

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpandedIds(new Set(pCatStat.map((c) => c._id)));
  const collapseAll = () => setExpandedIds(new Set());

  const openAdd = () => {
    setEditNode(null); setParentNode(null);
    setTitle(""); setParentId(null);
    setModalOpen(true);
  };

  const openAddChild = (node) => {
    setEditNode(null); setParentNode(node);
    setTitle(""); setParentId(node._id);
    setModalOpen(true);
  };

  const openEdit = (node) => {
    setEditNode(node); setParentNode(null);
    setTitle(node.title); setParentId(node.parent?._id || node.parent || null);
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setTitle(""); setEditNode(null); setParentNode(null); setParentId(null); };

  const handleSave = async () => {
    if (!title.trim()) return toast.error("Category name is required");
    setSaving(true);
    try {
      if (editNode) {
        await dispatch(updateAProductCategory({
          id: editNode._id,
          pCatData: { title: title.trim(), parent: parentId || null },
        })).unwrap();
        toast.success("Category updated!");
      } else {
        await dispatch(createCategory({ title: title.trim(), parent: parentId || null })).unwrap();
        toast.success("Category added!");
      }
      await dispatch(getCategories());
      await dispatch(getCategoryTree());
      closeModal();
    } catch (err) {
      toast.error(err?.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteAProductCategory(pCatId)).unwrap();
      toast.success("Category deleted!");
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Cannot delete: has subcategories");
    }
    setDeleteOpen(false);
    dispatch(getCategories());
    dispatch(getCategoryTree());
  };

  // Stats
  const rootCount = pCatStat.filter((c) => !c.parent).length;
  const childCount = pCatStat.filter((c) => c.parent).length;
  const totalCount = pCatStat.length;

  // Parent options for the modal (can't set self as parent)
  const parentOptions = pCatStat
    .filter((c) => !editNode || c._id !== editNode._id)
    .filter((c) => !c.parent) // only allow root as parent (2 levels max displayed, but 3 supported)
    .map((c) => ({ label: c.title, value: c._id }));

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f8f7ff 0%, #f0fdf9 100%)", padding: "clamp(8px, 2vw, 24px)" }}>

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
        borderRadius: 20, padding: "24px 28px", marginBottom: 24,
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16,
        boxShadow: "0 8px 32px #6366f133",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 14, padding: "10px 12px", display: "flex" }}>
            <FaTags style={{ fontSize: 24, color: "#fff" }} />
          </div>
          <div>
            <h2 style={{ margin: 0, color: "#fff", fontWeight: 800, fontSize: 22 }}>Category Manager</h2>
            <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.8)", fontSize: 13 }}>
              Amazon/Flipkart-style nested categories
            </p>
          </div>
        </div>
        <button
          onClick={openAdd}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "#fff", color: "#6366f1", border: "none",
            padding: "10px 20px", borderRadius: 12, fontWeight: 700, fontSize: 14,
            cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", transition: "all 0.2s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "none"}
        >
          <FaPlus /> Add Root Category
        </button>
      </div>

      {/* Stats cards */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { label: "Total Categories", value: totalCount, color: "#6366f1", bg: "#f8f7ff" },
          { label: "Main Categories", value: rootCount, color: "#10b981", bg: "#f0fdf9" },
          { label: "Subcategories", value: childCount, color: "#f59e0b", bg: "#fffbf0" },
        ].map((s) => (
          <div key={s.label} style={{
            flex: "1 1 140px", background: s.bg, borderRadius: 16, padding: "18px 20px",
            border: `1.5px solid ${s.color}22`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}>
            <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</p>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{
        background: "#fff", borderRadius: 16, padding: "12px 16px", marginBottom: 16,
        display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}>
        <div style={{ display: "flex", gap: 4 }}>
          {["tree", "flat"].map((m) => (
            <button key={m} onClick={() => setViewMode(m)} style={{
              padding: "6px 16px", borderRadius: 8, border: "1.5px solid #e5e7eb",
              background: viewMode === m ? "#6366f1" : "#fff",
              color: viewMode === m ? "#fff" : "#6b7280",
              fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "all 0.2s",
            }}>
              {m === "tree" ? "🌳 Tree View" : "📋 Flat List"}
            </button>
          ))}
        </div>
        {viewMode === "tree" && (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={expandAll} style={{ padding: "6px 14px", borderRadius: 8, border: "1.5px solid #e5e7eb", background: "#fff", color: "#6b7280", fontSize: 12, cursor: "pointer" }}>
              Expand All
            </button>
            <button onClick={collapseAll} style={{ padding: "6px 14px", borderRadius: 8, border: "1.5px solid #e5e7eb", background: "#fff", color: "#6b7280", fontSize: 12, cursor: "pointer" }}>
              Collapse All
            </button>
          </div>
        )}
        <span style={{ marginLeft: "auto", fontSize: 13, color: "#9ca3af" }}>{totalCount} categories</span>
      </div>

      {/* Tree / Flat view */}
      <div style={{ background: "#fff", borderRadius: 20, padding: 20, boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ width: 40, height: 40, border: "3px solid #f0f0f0", borderTop: "3px solid #6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
            <p style={{ color: "#9ca3af" }}>Loading categories...</p>
          </div>
        ) : viewMode === "tree" ? (
          categoryTree.length > 0 ? (
            <div>
              {categoryTree.map((node) => (
                <TreeNode
                  key={node._id}
                  node={node}
                  depth={0}
                  allFlat={pCatStat}
                  onAddChild={openAddChild}
                  onEdit={openEdit}
                  onDelete={(id) => { setPCatId(id); setDeleteOpen(true); }}
                  expandedIds={expandedIds}
                  toggleExpand={toggleExpand}
                />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <p style={{ fontSize: 48, marginBottom: 8 }}>🗂️</p>
              <p style={{ color: "#9ca3af", fontSize: 16 }}>No categories yet. Add your first root category!</p>
              <button onClick={openAdd} style={{ marginTop: 16, padding: "10px 24px", borderRadius: 10, border: "none", background: "#6366f1", color: "#fff", fontWeight: 600, cursor: "pointer" }}>
                + Add Category
              </button>
            </div>
          )
        ) : (
          /* Flat list view */
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                {["#", "Category", "Parent", "Level", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 13, fontWeight: 600, color: "#6b7280", borderBottom: "1px solid #f0f0f0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pCatStat.map((c, i) => (
                <tr key={c._id} style={{ borderBottom: "1px solid #f9fafb" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#fafafa"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ padding: "10px 14px", color: "#9ca3af", fontSize: 13 }}>{i + 1}</td>
                  <td style={{ padding: "10px 14px", fontWeight: 500, fontSize: 14 }}>{c.title}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: "#6b7280" }}>{c.parent?.title || "—"}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <Tag color={!c.parent ? "purple" : "green"} style={{ borderRadius: 20, fontSize: 11 }}>
                      {!c.parent ? "Main" : "Sub"}
                    </Tag>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => openEdit(c)} style={{ padding: "5px 10px", borderRadius: 8, border: "1.5px solid #6366f122", background: "#6366f111", color: "#6366f1", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Edit</button>
                      <button onClick={() => { setPCatId(c._id); setDeleteOpen(true); }} style={{ padding: "5px 10px", borderRadius: 8, border: "1.5px solid #ef444422", background: "#ef444411", color: "#ef4444", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>{editNode ? "✏️" : "📁"}</span>
            <span style={{ fontWeight: 700 }}>
              {editNode ? "Edit Category" : parentNode ? `Add under "${parentNode.title}"` : "Add Root Category"}
            </span>
          </div>
        }
        open={modalOpen}
        onCancel={closeModal}
        footer={[
          <Button key="cancel" onClick={closeModal}>Cancel</Button>,
          <Button key="save" type="primary" loading={saving} onClick={handleSave}
            style={{ background: "#6366f1", borderColor: "#6366f1" }}>
            {editNode ? "Save Changes" : "Add Category"}
          </Button>,
        ]}
        width="min(420px, 95vw)"
      >
        <div style={{ paddingTop: 8 }}>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 6, fontSize: 14 }}>
              Category Name <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <Input
              size="large"
              placeholder="e.g. Women's Fashion, Sarees, Silk Sarees..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onPressEnter={handleSave}
              autoFocus
              style={{ borderRadius: 10 }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 6, fontSize: 14 }}>
              Parent Category <span style={{ color: "#9ca3af", fontWeight: 400 }}>(optional)</span>
            </label>
            <Select
              allowClear
              showSearch
              size="large"
              placeholder="Select parent (leave empty for root)"
              style={{ width: "100%" }}
              value={parentId || undefined}
              onChange={(v) => setParentId(v || null)}
              options={pCatStat
                .filter((c) => !editNode || c._id !== editNode._id)
                .map((c) => ({
                  label: `${c.parent ? "  └ " : ""}${c.title}`,
                  value: c._id,
                  disabled: editNode && c._id === editNode._id,
                }))}
              filterOption={(input, option) => option.label.toLowerCase().includes(input.toLowerCase())}
            />
            {parentNode && !editNode && (
              <p style={{ marginTop: 6, fontSize: 12, color: "#10b981" }}>
                ✓ Will be added under "{parentNode.title}"
              </p>
            )}
          </div>
        </div>
      </Modal>

      <CustomModal
        hideModal={() => setDeleteOpen(false)}
        open={deleteOpen}
        performAction={handleDelete}
        title="Are you sure you want to delete this category?"
      />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Categorylist;
