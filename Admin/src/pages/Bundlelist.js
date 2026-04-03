import React, { useEffect, useState } from "react";
import { Table, Card, Tag, Button, Switch, Popconfirm, message, Tooltip } from "antd";
import { Link } from "react-router-dom";
import { 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined, 
  ShoppingCartOutlined,
  ExclamationCircleOutlined 
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { getBundles, deleteBundle, updateBundle } from "../features/bundle/bundleSlice";
import { getReadableColorName, getColorSwatch } from "../utils/colorDisplay";

const BundleList = () => {
  const dispatch = useDispatch();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    dispatch(getBundles());
  }, [dispatch]);

  const bundleState = useSelector((state) => state.bundle);
  const { bundles, isLoading, isError, isSuccess } = bundleState;

  const handleDelete = async (id) => {
    try {
      await dispatch(deleteBundle(id)).unwrap();
      message.success("Bundle deleted successfully");
      dispatch(getBundles());
    } catch (error) {
      message.error("Failed to delete bundle");
    }
  };

  const handleToggleStatus = async (bundle) => {
    try {
      await dispatch(
        updateBundle({
          id: bundle._id,
          bundleData: { isActive: !bundle.isActive },
        })
      ).unwrap();
      message.success(`Bundle ${bundle.isActive ? "deactivated" : "activated"}`);
      dispatch(getBundles());
    } catch (error) {
      message.error("Failed to update bundle status");
    }
  };

  const handleToggleShowOnProduct = async (bundle) => {
    try {
      await dispatch(
        updateBundle({
          id: bundle._id,
          bundleData: { showOnProductPage: !bundle.showOnProductPage },
        })
      ).unwrap();
      message.success(
        `Bundle ${bundle.showOnProductPage ? "removed from" : "added to"} product page`
      );
      dispatch(getBundles());
    } catch (error) {
      message.error("Failed to update bundle");
    }
  };

  const columns = [
    {
      title: "S.No",
      dataIndex: "key",
      key: "key",
      render: (text, record, index) => <span>{(page - 1) * pageSize + index + 1}</span>,
      width: 60,
    },
    {
      title: "Bundle Name",
      dataIndex: "title",
      key: "title",
      render: (text, record) => (
        <div>
          <div className="fw-bold">{text}</div>
          <div className="text-muted" style={{ fontSize: "12px" }}>
            {record.category}
          </div>
        </div>
      ),
    },
    {
      title: "Products",
      dataIndex: "products",
      key: "products",
      render: (products) => (
        <div>
          <Tag icon={<ShoppingCartOutlined />} color="blue">
            {products?.length || 0} Products
          </Tag>
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
            {(products || []).slice(0, 2).map((item, index) => (
              <div key={index} style={{ fontSize: 12, color: "#475569" }}>
                <div style={{ fontWeight: 600 }}>{item.product?.title || "Product"}</div>
                {(item.product?.variants || []).length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                    {item.product.variants.slice(0, 3).map((variant, vIndex) => (
                      <span key={vIndex} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 8px", borderRadius: 999, border: "1px solid #dbeafe", background: "#f8fafc" }}>
                        <span style={{ width: 10, height: 10, borderRadius: "50%", background: getColorSwatch(variant.color), border: "1px solid #cbd5e1" }} />
                        {getReadableColorName(variant.color)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {(products || []).length > 2 && <span style={{ fontSize: 11, color: "#94a3b8" }}>+{products.length - 2} more</span>}
          </div>
        </div>
      ),
    },
    {
      title: "Original Price",
      dataIndex: "originalPrice",
      key: "originalPrice",
      render: (price) => <span>₹{price?.toLocaleString() || 0}</span>,
    },
    {
      title: "Bundle Price",
      dataIndex: "bundlePrice",
      key: "bundlePrice",
      render: (price, record) => (
        <div>
          <span className="fw-bold">₹{price?.toLocaleString() || 0}</span>
          {record.discountPercent > 0 && (
            <Tag color="green" className="ms-2">
              -{record.discountPercent}%
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "Stock",
      dataIndex: "stock",
      key: "stock",
      render: (stock, record) => (
        <div>
          <span className={stock <= record.minStockWarning ? "text-danger" : ""}>
            {stock}
          </span>
          {stock <= record.minStockWarning && (
            <Tooltip title="Low Stock">
              <ExclamationCircleOutlined className="text-danger ms-2" />
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      title: "Show on Product",
      dataIndex: "showOnProductPage",
      key: "showOnProductPage",
      render: (show, record) => (
        <Switch
          checked={show}
          onChange={() => handleToggleShowOnProduct(record)}
          checkedChildren="Yes"
          unCheckedChildren="No"
        />
      ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (active, record) => (
        <Switch
          checked={active}
          onChange={() => handleToggleStatus(record)}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div className="d-flex gap-2">
          <Link to={`/admin/bundle/${record._id}`}>
            <Button type="primary" size="small" icon={<EditOutlined />}>
              Edit
            </Button>
          </Link>
          <Popconfirm
            title="Are you sure you want to delete this bundle?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="danger" size="small" icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="title">Bundle List</h3>
        <Link to="/admin/add-bundle">
          <Button type="primary" icon={<ShoppingCartOutlined />}>
            Add Bundle
          </Button>
        </Link>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={bundles}
          loading={isLoading}
          rowKey="_id"
          pagination={{
            current: page,
            pageSize: pageSize,
            onChange: (page, pageSize) => {
              setPage(page);
              setPageSize(pageSize);
            },
          }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
};

export default BundleList;
