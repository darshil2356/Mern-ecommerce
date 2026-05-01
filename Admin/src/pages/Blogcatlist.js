import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { deleteABlogCat, getCategories, resetState } from "../features/bcategory/bcategorySlice";
import CustomModal from "../components/CustomModal";
import AdminPageHeader from "../components/AdminPageHeader";
import AdminDataTable from "../components/AdminDataTable";
import ActionButtons from "../components/ActionButtons";
import { FaLayerGroup, FaPlus } from "react-icons/fa";
import { Link } from "react-router-dom";

const Blogcatlist = () => {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [blogCatId, setBlogCatId] = useState("");

  useEffect(() => {
    dispatch(resetState());
    dispatch(getCategories());
  }, []);

  const bCatState = useSelector((state) => state.bCategory.bCategories);

  const data = bCatState.map((c, i) => ({
    key: c._id,
    sno: i + 1,
    name: c.title,
    _id: c._id,
  }));

  const columns = [
    { title: "S.No", dataIndex: "sno", width: 80, align: "center" },
    { title: "Category Name", dataIndex: "name", sorter: (a, b) => a.name.localeCompare(b.name), render: (t) => <span className="font-medium text-gray-800">{t}</span> },
    {
      title: "Actions", dataIndex: "_id", align: "center", width: 120,
      render: (id) => (
        <ActionButtons
          editTo={`/admin/blog-category/${id}`}
          onDelete={() => { setBlogCatId(id); setOpen(true); }}
        />
      ),
    },
  ];

  const deleteBlogCategory = () => {
    dispatch(deleteABlogCat(blogCatId));
    setOpen(false);
    setTimeout(() => dispatch(getCategories()), 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-2 sm:p-4 lg:p-6">
      <AdminPageHeader
        title="Blog Categories"
        description="Manage your blog categories"
        icon={<FaLayerGroup />}
        gradient="from-teal-600 to-teal-700"
        actionButton={
          <Link to="/admin/blog-category" className="flex items-center gap-2 px-5 py-2.5 bg-white text-teal-600 rounded-xl font-semibold hover:bg-teal-50 transition-all shadow-md">
            <FaPlus className="text-sm" /> Add Category
          </Link>
        }
      />
      <AdminDataTable columns={columns} dataSource={data} paginationOptions={{ showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} categories` }} />
      <CustomModal hideModal={() => setOpen(false)} open={open} performAction={deleteBlogCategory} title="Are you sure you want to delete this blog category?" />
    </div>
  );
};

export default Blogcatlist;
