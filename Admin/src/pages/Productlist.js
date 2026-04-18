import React, { useEffect, useState } from "react";
import { Input, Button, Space, Tag, Tooltip, Avatar, Modal } from "antd";
import AdminPageHeader from "../components/AdminPageHeader";
import AdminDataTable from "../components/AdminDataTable";
import { BiEdit } from "react-icons/bi";
import { AiFillDelete, AiOutlineSearch, AiOutlineEye, AiOutlineDownload } from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import { deleteAProduct, getProducts } from "../features/product/productSlice";
import { Link } from "react-router-dom";
import { delImg } from "../features/upload/uploadSlice";
import CustomModal from "../components/CustomModal";
import BarcodeModal from "../components/BarcodeModal";
import SizeBarcodesList from "../components/SizeBarcodesList";
import { getReadableColorName, getColorSwatch } from "../utils/colorDisplay";
import JsBarcode from "jsbarcode";
import { MdInventory, MdOutlineInventory2 } from "react-icons/md";

const Productlist = () => {
  const [open, setOpen] = useState(false);
  const [productId, setproductId] = useState("");
  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);
  const [selectedBarcode, setSelectedBarcode] = useState("");
  const [selectedTitle, setSelectedTitle] = useState("");
  const [searchText, setSearchText] = useState("");
  
  // State for size-wise barcodes modal
  const [sizeBarcodesModalOpen, setSizeBarcodesModalOpen] = useState(false);
  const [productSizeBarcodes, setProductSizeBarcodes] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);

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

  // Show all barcodes for a product (size-wise only)
  const showSizeBarcodes = (record) => {
    const sizeItems =
      record.sizeStock && record.sizeStock.length > 0
        ? record.sizeStock
        : (record.variants || []).flatMap((variant) => variant.sizeStock || []);

    const barcodes = sizeItems
      .filter((item) => item.barcode)
      .map((item) => ({
        size: item.size,
        barcode: item.barcode,
        quantity: item.quantity,
      }));

    setProductSizeBarcodes(barcodes);
    setSelectedTitle(record.title);
    // store full record for productData
    setSelectedRecord(record);
    setSizeBarcodesModalOpen(true);
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

  const getEffectiveStock = (record) => {
    if (record.sizeStock && record.sizeStock.length > 0) {
      return record.sizeStock.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    }
    if (record.variants && record.variants.length > 0) {
      return record.variants.reduce((sum, variant) => {
        const variantQuantity = (variant.sizeStock || []).reduce((s, item) => s + Number(item.quantity || 0), 0);
        return sum + variantQuantity;
      }, 0);
    }
    return Number(record.quantity || 0);
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
      title: "Color & Size",
      key: "colorSize",
      width: 120,
      render: (_, record) => {
        const color = record.color;
        const hasSizeStock = record.sizeStock && record.sizeStock.length > 0;
        const hasVariants = record.variants && record.variants.length > 0;

        let sizeInfo = "";
        if (hasSizeStock) {
          const sizes = record.sizeStock.map(item => item.size).join(", ");
          sizeInfo = sizes.length > 15 ? sizes.substring(0, 12) + "..." : sizes;
        } else if (hasVariants) {
          const allSizes = record.variants.flatMap(variant =>
            variant.sizeStock ? variant.sizeStock.map(item => item.size) : []
          );
          const uniqueSizes = [...new Set(allSizes)];
          sizeInfo = uniqueSizes.join(", ");
          sizeInfo = sizeInfo.length > 15 ? sizeInfo.substring(0, 12) + "..." : sizeInfo;
        }

        return (
          <div className="d-flex flex-column gap-1">
            {color && color.title ? (
              <div className="d-flex align-items-center gap-2">
                <div
                  style={{
                    backgroundColor: getColorSwatch(color),
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid #fff",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  }}
                />
                <span style={{ fontSize: "12px", fontWeight: 500 }}>{getReadableColorName(color)}</span>
              </div>
            ) : (
              <span className="text-muted" style={{ fontSize: "12px" }}>-</span>
            )}
            {sizeInfo && (
              <div>
                <Tag color="geekblue" style={{ fontSize: "10px", padding: "1px 4px" }}>
                  Sizes: {sizeInfo}
                </Tag>
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "HSN",
      dataIndex: "hsnCode",
      key: "hsnCode",
      width: 120,
      render: (hsnCode) => (
        <span className="text-muted fw-medium">{hsnCode || "-"}</span>
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
      title: "Barcodes",
      dataIndex: "barcode",
      key: "barcode",
      render: (barcode, record) => {
        const allSizeItems = record.sizeStock && record.sizeStock.length > 0
          ? record.sizeStock
          : (record.variants || []).flatMap((variant) => variant.sizeStock || []);
        const sizeBarcodes = allSizeItems.filter((s) => s.barcode);
        const barcodeCount = sizeBarcodes.length;
        
        if (barcodeCount > 0) {
          return (
            <div className="d-flex gap-1">
              <Tooltip title="View All Barcodes">
                <Button
                  type="primary"
                  size="small"
                  onClick={() => showSizeBarcodes(record)}
                  style={{ backgroundColor: "#722ed1", borderColor: "#722ed1" }}
                >
                  {barcodeCount} {barcodeCount === 1 ? 'Size' : 'Sizes'}
                </Button>
              </Tooltip>
            </div>
          );
        }
        if (record.barcode) {
          return (
            <div className="d-flex gap-1">
              <Tooltip title="View Main Barcode">
                <Button
                  type="default"
                  size="small"
                  onClick={() => {
                    setSelectedBarcode(record.barcode);
                    setSelectedTitle(record.title);
                    setBarcodeModalOpen(true);
                  }}
                >
                  Main
                </Button>
              </Tooltip>
            </div>
          );
        }
        return <span className="text-muted">-</span>;
      },
    },
    // {
    //   title: "Stock",
    //   dataIndex: "quantity",
    //   key: "quantity",
    //   sorter: (a, b) => a.quantity - b.quantity,
    //   render: (quantity) => {
    //     const status = getStockStatus(quantity);
    //     return (
    //       <div
    //         style={{
    //           backgroundColor: status.bg,
    //           padding: "4px 12px",
    //           borderRadius: "20px",
    //           display: "inline-block",
    //         }}
    //       >
    //         <span style={{ color: status.color, fontWeight: 500, fontSize: "13px" }}>
    //           {status.text}
    //         </span>
    //         <span className="text-muted ms-1" style={{ fontSize: "12px" }}>
    //           ({quantity})
    //         </span>
    //       </div>
    //     );
    //   },
    // },

    {
  title: "Stock",
  key: "quantity",
    sorter: (a, b) => {
      const totalA = (a.sizeStock && a.sizeStock.length > 0)
        ? a.sizeStock.reduce((sum, item) => sum + item.quantity, 0)
        : (a.variants || []).flatMap((variant) => variant.sizeStock || []).reduce((sum, item) => sum + item.quantity, 0);
      const totalB = (b.sizeStock && b.sizeStock.length > 0)
        ? b.sizeStock.reduce((sum, item) => sum + item.quantity, 0)
        : (b.variants || []).flatMap((variant) => variant.sizeStock || []).reduce((sum, item) => sum + item.quantity, 0);
      return totalA - totalB;
    },
  render: (_, record) => {
    const total =
      getEffectiveStock(record);

    const status = getStockStatus(total);

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
          ({total})
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
      hsnCode: filteredProducts[i].hsnCode || filteredProducts[i].productHsn || "",
      sizeStock: filteredProducts[i].sizeStock || [],
      variants: filteredProducts[i].variants || [],
      category: filteredProducts[i].category,
      color: filteredProducts[i].color || null,
      images: filteredProducts[i].images,
      quantity: filteredProducts[i].quantity,
      price: `${filteredProducts[i].price}`,
      mrp: filteredProducts[i].mrp || "",
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <AdminPageHeader
        title="Products"
        description="Manage your product inventory and catalog"
        icon={<MdInventory />}
        gradient="from-indigo-600 to-indigo-700"
        actionButton={
          <div className="flex items-center gap-3">
            <Input
              placeholder="Search products..."
              prefix={<AiOutlineSearch className="text-gray-400" />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              className="rounded-xl"
              style={{ width: 240 }}
            />
            <Link to="/admin/product">
              <button className="flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-all shadow-md border-0 cursor-pointer">
                + Add Product
              </button>
            </Link>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Products", value: productState?.length || 0, icon: <MdInventory />, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Total Value", value: `₹${(productState?.reduce((sum, p) => sum + (Number(p.price) || 0) * getEffectiveStock(p), 0) || 0).toLocaleString()}`, icon: "₹", color: "text-green-600", bg: "bg-green-50" },
          { label: "Out of Stock", value: productState?.filter(p => getEffectiveStock(p) === 0).length || 0, icon: <MdOutlineInventory2 />, color: "text-red-500", bg: "bg-red-50" },
          { label: "Categories", value: new Set(productState?.map(p => p.category)).size || 0, icon: "#", color: "text-orange-500", bg: "bg-orange-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center ${s.color} text-2xl flex-shrink-0`}>{s.icon}</div>
            <div>
              <p className="text-gray-400 text-xs font-medium mb-0.5">{s.label}</p>
              <h3 className="text-2xl font-bold text-gray-800 leading-none">{s.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <AdminDataTable
        columns={columns}
        dataSource={data1}
        paginationOptions={{ showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} products`, pageSizeOptions: ["10", "20", "50", "100"] }}
      />

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

      {/* Size-wise Barcodes Modal */}
      <Modal
        title={<span style={{ color: '#722ed1' }}>📦 All Barcodes - {selectedTitle}</span>}
        open={sizeBarcodesModalOpen}
        onCancel={() => setSizeBarcodesModalOpen(false)}
        footer={null}
        width={700}
      >
        <SizeBarcodesList
          barcodes={productSizeBarcodes}
          onDownload={downloadBarcode}
          productData={{
            title: selectedTitle,
            color: selectedRecord?.color,
            price: selectedRecord?.price,
          }}
        />
      </Modal>


    </div>
  );
};

export default Productlist;
