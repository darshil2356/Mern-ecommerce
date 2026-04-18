import React, { useEffect, useState } from "react";
import { BiEdit } from "react-icons/bi";
import { AiFillDelete } from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import { createBrand, deleteABrand, getBrands, getABrand, updateABrand, resetState } from "../features/brand/brandSlice";
import CustomModal from "../components/CustomModal";
import { FaPlus } from "react-icons/fa";
import { SiBrandfolder } from "react-icons/si";
import AdminDataTable from "../components/AdminDataTable";
import AdminPageHeader from "../components/AdminPageHeader";
import { Modal, Input, Button } from "antd";
import { toast } from "react-toastify";

const Brandlist = () => {
  const dispatch = useDispatch();
  const brandState = useSelector((state) => state.brand.brands);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [brandId, setBrandId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(getBrands());
  }, []);

  const openAdd = () => { setEditId(null); setTitle(""); setModalOpen(true); };
  const openEdit = async (id) => {
    const res = await dispatch(getABrand(id)).unwrap();
    setEditId(id); setTitle(res.title); setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setTitle(""); setEditId(null); };

  const handleSave = async () => {
    if (!title.trim()) return toast.error("Brand name is required");
    setSaving(true);
    try {
      if (editId) {
        await dispatch(updateABrand({ id: editId, brandData: { title: title.trim() } })).unwrap();
        toast.success("Brand updated!");
      } else {
        await dispatch(createBrand({ title: title.trim() })).unwrap();
        toast.success("Brand added!");
      }
      dispatch(getBrands());
      closeModal();
    } catch { toast.error("Something went wrong"); }
    finally { setSaving(false); }
  };

  const handleDelete = () => {
    dispatch(deleteABrand(brandId));
    setDeleteOpen(false);
    setTimeout(() => dispatch(getBrands()), 100);
  };

  const data1 = brandState.map((b, i) => ({
    key: i + 1,
    name: b.title,
    action: (
      <div className="flex gap-3">
        <button onClick={() => openEdit(b._id)} className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-all duration-200 border-0 cursor-pointer">
          <BiEdit className="text-lg" />
        </button>
        <button onClick={() => { setDeleteOpen(true); setBrandId(b._id); }} className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 transition-all duration-200 border-0 cursor-pointer">
          <AiFillDelete className="text-lg" />
        </button>
      </div>
    ),
  }));

  const columns = [
    { title: <span className="text-gray-600 font-semibold">S.No</span>, dataIndex: "key", width: 80, align: "center" },
    { title: <span className="text-gray-600 font-semibold">Brand Name</span>, dataIndex: "name", sorter: (a, b) => a.name.localeCompare(b.name), render: (t) => <span className="font-medium text-gray-800">{t}</span> },
    { title: <span className="text-gray-600 font-semibold">Actions</span>, dataIndex: "action", align: "center", width: 120 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <AdminPageHeader
        title="Brands"
        description="Manage your product brands"
        icon={<SiBrandfolder />}
        gradient="from-indigo-600 to-indigo-700"
        actionButton={
          <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-all shadow-md border-0 cursor-pointer">
            <FaPlus className="text-sm" /> Add Brand
          </button>
        }
      />

      <AdminDataTable columns={columns} dataSource={data1} paginationOptions={{ showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} brands` }} />

      {/* Add / Edit Modal */}
      <Modal
        title={editId ? "Edit Brand" : "Add Brand"}
        open={modalOpen}
        onCancel={closeModal}
        footer={[
          <Button key="cancel" onClick={closeModal}>Cancel</Button>,
          <Button key="save" type="primary" loading={saving} onClick={handleSave}>Save</Button>,
        ]}
        width={360}
      >
        <div className="mb-3">
          <label className="fw-medium mb-1 d-block">Brand Name</label>
          <Input placeholder="e.g. Nike" value={title} onChange={(e) => setTitle(e.target.value)} onPressEnter={handleSave} autoFocus />
        </div>
      </Modal>

      <CustomModal hideModal={() => setDeleteOpen(false)} open={deleteOpen} performAction={handleDelete} title="Are you sure you want to delete this brand?" />
    </div>
  );
};

export default Brandlist;
