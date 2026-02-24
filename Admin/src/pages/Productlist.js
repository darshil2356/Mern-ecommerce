import React, { useEffect, useState } from "react";
import { Table, Input, Button, Space, Tag, Tooltip, Avatar, Card } from "antd";
import { BiEdit } from "react-icons/bi";
import { AiFillDelete, AiOutlineSearch, AiOutlineEye, AiOutlineDownload } from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import { deleteAProduct, getProducts } from "../features/product/productSlice";
import { Link } from "react-router-dom";
import { delImg } from "../features/upload/uploadSlice";
import CustomModal from "../components/CustomModal";
import BarcodeModal from "../components/BarcodeModal";
import JsBarcode from "jsbarcode";
import { MdInventory, MdOutlineInventory2 } from "react-icons/md";

const Productlist = () => {
  const [open, setOpen] = useState(false);
  const [productId, setproductId] = useState("");
  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);
  const [selectedBarcode, setSelectedBarcode] = useState("");
  const [selectedTitle, setSelectedTitle] = useState("");
  const [searchText, setSearchText] = useState("");

  const showModal = (e) => {
    setOpen(true);
    setproductId(e);
  };

  const downloadBarcode = (barcode) => {
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, barcode, {
      format: "CODE128",
      width: 2,
      height: 80,
      displayValue: true,
    });
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${barcode}.png`;
    link.click();
  };

  const hideModal = () => {
    setOpen(false);
  };

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getProducts());
  }, []);

  const productState = useSelector((state) => state?.product?.products);

  // Filter products based on search
  const filteredProducts = productState?.filter((product) =>
    product.title?.toLowerCase().includes(searchText.toLowerCase()) ||
    product.brand?.toLowerCase().includes(searchText.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchText.toLowerCase()) ||
    product.barcode?.toLowerCase().includes(searchText.toLowerCase())
  );

  const getStockStatus = (quantity) => {
    if (quantity === 0) return { color: "red", text: "Out of Stock", bg: "#fff1f0" };
    if (quantity < 10) return { color: "orange", text: "Low Stock", bg: "#fff7e6" };
    return { color: "green", text: "In Stock", bg: "#f6ffed" };
  };

  const columns = [
    {
      title: "S.No",
      dataIndex: "key",
      key: "key",
      width: 70,
      render: (text, record, index) => (
        <span className="text-muted fw-medium">{index + 1}</span>
      ),
    },
    {
      title: "Product",
      dataIndex: "title",
      key: "title",
      sorter: (a, b) => a.title.localeCompare(b.title),
      render: (text, record) => (
        <div className="d-flex align-items-center gap-3">
          <Avatar
            shape="square"
            size={48}
            src={record.images?.[0]?.url}
            style={{ borderRadius: "8px", backgroundColor: "#f0f0f0" }}
            icon={!record.images?.[0]?.url && <MdInventory />}
          />
          <div>
            <div className="fw-semibold text-dark" style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {text}
            </div>
            <div className="text-muted small">{record.category}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Color",
      dataIndex: "color",
      key: "color",
      width: 80,
      render: (color) =>
        color && color.title ? (
          <Tooltip title={color.title}>
            <div
              style={{
                backgroundColor: color.title,
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid #fff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                cursor: "pointer",
              }}
            />
          </Tooltip>
        ) : (
          <span className="text-muted">-</span>
        ),
    },
    {
      title: "Brand",
      dataIndex: "brand",
      key: "brand",
      render: (brand) => (
        <Tag color="blue" style={{ borderRadius: "4px", fontWeight: 500 }}>
          {brand}
        </Tag>
      ),
    },
    {
      title: "Barcode",
      dataIndex: "barcode",
      key: "barcode",
      render: (barcode, record) =>
        barcode ? (
          <div className="d-flex gap-1">
            <Tooltip title="View Barcode">
              <Button
                type="text"
                size="small"
                icon={<AiOutlineEye />}
                onClick={() => {
                  setSelectedBarcode(barcode);
                  setSelectedTitle(record.title);
                  setBarcodeModalOpen(true);
                }}
                style={{ color: "#1890ff" }}
              />
            </Tooltip>
            <Tooltip title="Download Barcode">
              <Button
                type="text"
                size="small"
                icon={<AiOutlineDownload />}
                onClick={() => downloadBarcode(barcode)}
                style={{ color: "#52c41a" }}
              />
            </Tooltip>
          </div>
        ) : (
          <span className="text-muted">-</span>
        ),
    },
    {
      title: "Stock",
      dataIndex: "quantity",
      key: "quantity",
      sorter: (a, b) => a.quantity - b.quantity,
      render: (quantity) => {
        const status = getStockStatus(quantity);
        return (
          <div
            style={{
              backgroundColor: status.bg,
              padding: "4px 12px",
              borderRadius: "20px",
              display: "inline-block",
            }}
          >
            <span style={{ color: status.color, fontWeight: 500, fontSize: "13px" }}>
              {status.text}
            </span>
            <span className="text-muted ms-1" style={{ fontSize: "12px" }}>
              ({quantity})
            </span>
          </div>
        );
      },
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      sorter: (a, b) => a.price - b.price,
      render: (price) => (
        <span className="fw-bold" style={{ color: "#1a1a1a", fontSize: "15px" }}>
          ₹{parseFloat(price).toFixed(2)}
        </span>
      ),
    },
    {
      title: "Actions",
      dataIndex: "action",
      key: "action",
      width: 120,
      render: (_, record) => (
        <div className="d-flex gap-2">
          <Tooltip title="Edit Product">
            <Link
              to={`/admin/product/${record._id}`}
              className="d-flex align-items-center justify-content-center"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                backgroundColor: "#e6f7ff",
                color: "#1890ff",
                transition: "all 0.2s",
              }}
            >
              <BiEdit size={18} />
            </Link>
          </Tooltip>
          <Tooltip title="Delete Product">
            <button
              className="d-flex align-items-center justify-content-center"
              onClick={() => showModal(record._id)}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                backgroundColor: "#fff1f0",
                color: "#ff4d4f",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <AiFillDelete size={18} />
            </button>
          </Tooltip>
        </div>
      ),
    },
  ];

  const data1 = [];
  for (let i = 0; i < filteredProducts?.length; i++) {
    data1.push({
      key: i + 1,
      _id: filteredProducts[i]._id,
      title: filteredProducts[i].title,
      brand: filteredProducts[i].brand,
      barcode: filteredProducts[i].barcode,
      category: filteredProducts[i].category,
      color: filteredProducts[i].color || null,
      images: filteredProducts[i].images,
      quantity: filteredProducts[i].quantity,
      price: `${filteredProducts[i].price}`,
      action: (
        <>
          <Link to={`/admin/product/${filteredProducts[i]._id}`} className="fs-3 text-success">
            <BiEdit />
          </Link>
          <button
            className="ms-3 fs-3 text-danger bg-transparent border-0"
            onClick={() => showModal(filteredProducts[i]._id)}
          >
            <AiFillDelete />
          </button>
        </>
      ),
    });
  }

  const deleteProduct = (e) => {
    dispatch(deleteAProduct(e));
    dispatch(delImg(e));
    setOpen(false);
    setTimeout(() => {
      dispatch(getProducts());
    }, 100);
  };

  return (
    <div style={{ backgroundColor: "#f5f5f5", minHeight: "100vh", padding: "24px" }}>
      {/* Header Section */}
      <Card
        style={{
          borderRadius: "12px",
          border: "none",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          marginBottom: "24px",
        }}
        bodyStyle={{ padding: "20px 24px" }}
      >
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <h2 className="mb-1" style={{ fontWeight: 600, color: "#1a1a1a", fontSize: "24px" }}>
              Products
            </h2>
            <p className="text-muted mb-0" style={{ fontSize: "14px" }}>
              Manage your product inventory and catalog
            </p>
          </div>
          <div className="d-flex gap-3 align-items-center">
            <Input
              placeholder="Search products..."
              prefix={<AiOutlineSearch style={{ color: "#8c8c8c" }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{
                width: "280px",
                height: "40px",
                borderRadius: "8px",
                border: "1px solid #d9d9d9",
              }}
              allowClear
            />
            <Link to="/admin/product">
              <Button
                type="primary"
                style={{
                  height: "40px",
                  borderRadius: "8px",
                  backgroundColor: "#1890ff",
                  border: "none",
                  fontWeight: 500,
                }}
              >
                + Add Product
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <Card
            style={{
              borderRadius: "12px",
              border: "none",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            }}
            bodyStyle={{ padding: "20px" }}
          >
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-muted mb-1" style={{ fontSize: "13px" }}>Total Products</p>
                <h3 className="mb-0" style={{ fontWeight: 600 }}>{productState?.length || 0}</h3>
              </div>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                backgroundColor: "#e6f7ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#1890ff",
                fontSize: "24px"
              }}>
                <MdInventory />
              </div>
            </div>
          </Card>
        </div>
        <div className="col-md-3">
          <Card
            style={{
              borderRadius: "12px",
              border: "none",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            }}
            bodyStyle={{ padding: "20px" }}
          >
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-muted mb-1" style={{ fontSize: "13px" }}>Total Value</p>
                <h3 className="mb-0" style={{ fontWeight: 600 }}>
                  ₹{productState?.reduce((sum, p) => sum + (p.price * p.quantity), 0).toLocaleString() || 0}
                </h3>
              </div>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                backgroundColor: "#f6ffed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#52c41a",
                fontSize: "24px"
              }}>
                ₹
              </div>
            </div>
          </Card>
        </div>
        <div className="col-md-3">
          <Card
            style={{
              borderRadius: "12px",
              border: "none",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            }}
            bodyStyle={{ padding: "20px" }}
          >
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-muted mb-1" style={{ fontSize: "13px" }}>Out of Stock</p>
                <h3 className="mb-0" style={{ fontWeight: 600, color: "#ff4d4f" }}>
                  {productState?.filter(p => p.quantity === 0).length || 0}
                </h3>
              </div>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                backgroundColor: "#fff1f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ff4d4f",
                fontSize: "24px"
              }}>
                <MdOutlineInventory2 />
              </div>
            </div>
          </Card>
        </div>
        <div className="col-md-3">
          <Card
            style={{
              borderRadius: "12px",
              border: "none",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            }}
            bodyStyle={{ padding: "20px" }}
          >
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-muted mb-1" style={{ fontSize: "13px" }}>Categories</p>
                <h3 className="mb-0" style={{ fontWeight: 600 }}>
                  {new Set(productState?.map(p => p.category)).size || 0}
                </h3>
              </div>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                backgroundColor: "#fff7e6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fa8c16",
                fontSize: "24px"
              }}>
                #
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Products Table */}
      <Card
        style={{
          borderRadius: "12px",
          border: "none",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}
        bodyStyle={{ padding: "0" }}
      >
        <Table
          columns={columns}
          dataSource={data1}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} products`,
            pageSizeOptions: ["10", "20", "50", "100"],
          }}
          style={{ borderRadius: "12px" }}
        />
      </Card>

      <CustomModal
        hideModal={hideModal}
        open={open}
        performAction={() => {
          deleteProduct(productId);
        }}
        title="Are you sure you want to delete this Product?"
      />
      <BarcodeModal
        open={barcodeModalOpen}
        onClose={() => setBarcodeModalOpen(false)}
        barcode={selectedBarcode}
        title={selectedTitle}
      />

      <style>{`
        .ant-table-thead > tr > th {
          background-color: #fafafa !important;
          font-weight: 600 !important;
          color: #1a1a1a !important;
          border-bottom: 2px solid #f0f0f0 !important;
        }
        .ant-table-tbody > tr:hover > td {
          background-color: #f5f5f5 !important;
        }
        .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f0f0f0 !important;
          padding: 16px !important;
        }
        .ant-pagination {
          padding: 16px 24px !important;
          margin: 0 !important;
          background: #fafafa;
          border-top: 1px solid #f0f0f0;
        }
        .ant-pagination-item-active {
          border-color: #1890ff !important;
        }
        .ant-pagination-item-active a {
          color: #1890ff !important;
        }
      `}</style>
    </div>
  );
};

export default Productlist;

