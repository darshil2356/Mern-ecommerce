import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createColor, deleteAColor, getColors, getAColor, updateAColor } from "../features/color/colorSlice";
import { BiEdit } from "react-icons/bi";
import { AiFillDelete } from "react-icons/ai";
import { FaPlus, FaPalette } from "react-icons/fa";
import CustomModal from "../components/CustomModal";
import { Modal, Input, Button } from "antd";
import AdminDataTable from "../components/AdminDataTable";
import AdminPageHeader from "../components/AdminPageHeader";
import { toast } from "react-toastify";
import { getColorSwatch, getReadableColorName } from "../utils/colorDisplay";

const Colorlist = () => {
  const dispatch = useDispatch();
  const colorState = useSelector((state) => state.color.colors);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [colorId, setColorId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState("");
  const [hex, setHex] = useState("#000000");
  const [saving, setSaving] = useState(false);

  useEffect(() => { dispatch(getColors()); }, []);

  const openAdd = () => { setEditId(null); setName(""); setHex("#000000"); setModalOpen(true); };
  const openEdit = async (id) => {
    const res = await dispatch(getAColor(id)).unwrap();
    setEditId(id);
    setName(res.name || "");
    setHex(res.hex || res.title || "#000000");
    setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setName(""); setHex("#000000"); setEditId(null); };

  const handleSave = async () => {
    if (!name.trim()) return toast.error("Color name is required");
    setSaving(true);
    try {
      if (editId) {
        await dispatch(updateAColor({ id: editId, colorData: { name: name.trim(), hex } })).unwrap();
        toast.success("Color updated!");
      } else {
        await dispatch(createColor({ name: name.trim(), hex })).unwrap();
        toast.success("Color added!");
      }
      dispatch(getColors());
      closeModal();
    } catch { toast.error("Something went wrong"); }
    finally { setSaving(false); }
  };

  const handleDelete = () => {
    dispatch(deleteAColor(colorId));
    setDeleteOpen(false);
    setTimeout(() => dispatch(getColors()), 100);
  };

  const data1 = colorState.map((c, i) => ({
    key: i + 1,
    color: (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full shadow-md border-2 border-white" style={{ backgroundColor: getColorSwatch(c) }} />
        <span className="font-medium text-gray-700">{getReadableColorName(c)}</span>
      </div>
    ),
    action: (
      <div className="flex gap-3">
        <button onClick={() => openEdit(c._id)} className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-all duration-200 border-0 cursor-pointer">
          <BiEdit className="text-lg" />
        </button>
        <button onClick={() => { setDeleteOpen(true); setColorId(c._id); }} className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 transition-all duration-200 border-0 cursor-pointer">
          <AiFillDelete className="text-lg" />
        </button>
      </div>
    ),
  }));

  const columns = [
    { title: <span className="text-gray-600 font-semibold">S.No</span>, dataIndex: "key", width: 80, align: "center" },
    { title: <span className="text-gray-600 font-semibold">Color</span>, dataIndex: "color" },
    { title: <span className="text-gray-600 font-semibold">Actions</span>, dataIndex: "action", align: "center", width: 120 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-2 sm:p-4 lg:p-6">
      <AdminPageHeader
        title="Colors"
        description="Manage your product colors"
        icon={<FaPalette />}
        gradient="from-violet-600 to-violet-700"
        actionButton={
          <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 bg-white text-violet-600 rounded-xl font-semibold hover:bg-violet-50 transition-all shadow-md border-0 cursor-pointer">
            <FaPlus className="text-sm" /> Add Color
          </button>
        }
      />

      <AdminDataTable columns={columns} dataSource={data1} paginationOptions={{ showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} colors` }} />

      <Modal
        title={editId ? "Edit Color" : "Add Color"}
        open={modalOpen}
        onCancel={closeModal}
        footer={[
          <Button key="cancel" onClick={closeModal}>Cancel</Button>,
          <Button key="save" type="primary" loading={saving} onClick={handleSave}>Save</Button>,
        ]}
        width="min(360px, 95vw)"
      >
        <div className="mb-3">
          <label className="fw-medium mb-1 d-block">Color Name</label>
          <Input placeholder="e.g. Forest Green" value={name} onChange={(e) => setName(e.target.value)} onPressEnter={handleSave} autoFocus />
        </div>
        <div>
          <label className="fw-medium mb-1 d-block">Color Hex</label>
          <div className="d-flex align-items-center gap-2">
            <input type="color" value={hex} onChange={(e) => setHex(e.target.value)} style={{ width: 48, height: 36, border: "none", cursor: "pointer", borderRadius: 6 }} />
            <Input value={hex} onChange={(e) => setHex(e.target.value)} style={{ width: 120 }} />
          </div>
        </div>
      </Modal>

      <CustomModal hideModal={() => setDeleteOpen(false)} open={deleteOpen} performAction={handleDelete} title="Are you sure you want to delete this color?" />
    </div>
  );
};

export default Colorlist;
