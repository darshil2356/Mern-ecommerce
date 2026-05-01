import React, { useEffect, useState } from "react";
import { Table, Tag, Card, Input, Select, Row, Col, Statistic, Spin, Button, Modal, message } from "antd";
import { AiFillDelete, AiOutlineSearch, AiFillStar, AiOutlineUser } from "react-icons/ai";
import ReactStars from "react-rating-stars-component";
import axios from "axios";
import CustomModal from "../components/CustomModal";
import { base_url } from "../utils/baseUrl";

const { Search } = Input;

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStar, setFilterStar] = useState(null);
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [productId, setProductId] = useState(null);

  const getTokenFromLocalStorage = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null;

  const config = {
    headers: {
      Authorization: `Bearer ${getTokenFromLocalStorage?.token || ""}`,
      Accept: "application/json",
    },
  };

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${base_url}product/reviews/all`, config);
      setReviews(response.data);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDelete = async () => {
    if (!deleteId || !productId) return;
    
    try {
      await axios.delete(`${base_url}product/reviews/${productId}/${deleteId}`, config);
      message.success("Review deleted successfully");
      fetchReviews();
    } catch (error) {
      message.error("Failed to delete review");
    } finally {
      setOpen(false);
      setDeleteId(null);
      setProductId(null);
    }
  };

  const showDeleteModal = (reviewId, prodId) => {
    setDeleteId(reviewId);
    setProductId(prodId);
    setOpen(true);
  };

  // Filter reviews
  const filteredReviews = reviews.filter((review) => {
    const matchesSearch = 
      review.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.product?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.user?.firstname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.user?.lastname?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStar = filterStar ? review.star === filterStar : true;
    
    return matchesSearch && matchesStar;
  });

  // Calculate stats
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0 
    ? (reviews.reduce((sum, r) => sum + r.star, 0) / totalReviews).toFixed(1) 
    : 0;
  const verifiedReviews = reviews.filter(r => r.isVerifiedPurchase).length;

  const columns = [
    {
      title: "SNo",
      dataIndex: "key",
      width: 60,
      render: (text) => <span className="text-muted">{text}</span>,
    },
    {
      title: "Product",
      dataIndex: "product",
      render: (product) => (
        <div>
          <p className="mb-0 fw-medium" style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {product?.title || "Unknown Product"}
          </p>
          <a 
            href={`/product/${product?._id}`} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ fontSize: '12px', color: '#1890ff' }}
          >
            View Product
          </a>
        </div>
      ),
    },
    {
      title: "Customer",
      dataIndex: "user",
      render: (user) => (
        <div className="d-flex align-items-center gap-2">
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 600,
            fontSize: '14px'
          }}>
            {(user?.firstname || "U").charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="mb-0 fw-medium" style={{ fontSize: '13px' }}>
              {user?.firstname || "Unknown"} {user?.lastname || ""}
            </p>
            <p className="mb-0 text-muted" style={{ fontSize: '11px' }}>
              {user?.email || "No email"}
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Rating",
      dataIndex: "star",
      width: 150,
      render: (star) => (
        <div className="d-flex align-items-center gap-2">
          <ReactStars
            count={5}
            size={16}
            value={star || 0}
            edit={false}
            activeColor="#ffd700"
          />
          <span className="fw-bold" style={{ color: '#faad14' }}>{star}</span>
        </div>
      ),
    },
    {
      title: "Review",
      dataIndex: "comment",
      render: (comment) => (
        <p className="mb-0" style={{ 
          maxWidth: '250px',
          fontSize: '13px',
          color: '#555',
          lineHeight: 1.5
        }}>
          {comment?.length > 100 ? `${comment.substring(0, 100)}...` : comment}
        </p>
      ),
    },
    {
      title: "Images",
      dataIndex: "images",
      render: (images) => (
        images && images.length > 0 ? (
          <Tag color="blue">{images.length} image(s)</Tag>
        ) : (
          <span className="text-muted">-</span>
        )
      ),
    },
    {
      title: "Status",
      dataIndex: "isVerifiedPurchase",
      render: (isVerified) => (
        isVerified ? (
          <Tag color="green">Verified</Tag>
        ) : (
          <Tag color="default">Unverified</Tag>
        )
      ),
    },
    {
      title: "Helpful",
      dataIndex: "helpful",
      render: (helpful) => (
        <span className="d-flex align-items-center gap-1">
          <AiFillStar style={{ color: '#faad14' }} />
          {helpful || 0}
        </span>
      ),
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      render: (date) => (
        <span style={{ fontSize: '12px', color: '#999' }}>
          {new Date(date).toLocaleDateString()}
        </span>
      ),
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<AiFillDelete />}
          onClick={() => showDeleteModal(record._id, record.product?._id)}
        />
      ),
    },
  ];

  // Rating distribution for stats
  const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.star === star).length,
    percentage: totalReviews > 0 ? ((reviews.filter(r => r.star === star).length / totalReviews) * 100).toFixed(0) : 0
  }));

  return (
    <div className="content-wrapper" style={{ padding: 'clamp(8px, 2vw, 24px)', background: '#f0f2f5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        color: '#fff'
      }}>
        <h2 style={{ margin: 0, fontWeight: 600 }}>Product Reviews</h2>
        <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: '14px' }}>
          Manage and moderate customer reviews
        </p>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: '12px' }}>
            <Statistic
              title="Total Reviews"
              value={totalReviews}
              prefix={<AiOutlineUser style={{ color: '#667eea' }} />}
              valueStyle={{ color: '#667eea' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: '12px' }}>
            <Statistic
              title="Average Rating"
              value={avgRating}
              prefix={<AiFillStar style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
              suffix="/ 5"
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: '12px' }}>
            <Statistic
              title="Verified Purchases"
              value={verifiedReviews}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ borderRadius: '12px', marginBottom: '24px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={12}>
            <Search
              placeholder="Search reviews, products, customers..."
              allowClear
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ borderRadius: '8px' }}
            />
          </Col>
          <Col xs={24} md={12}>
            <Select
              placeholder="Filter by rating"
              allowClear
              style={{ width: '100%' }}
              onChange={setFilterStar}
            >
              <Select.Option value={5}>5 Stars</Select.Option>
              <Select.Option value={4}>4 Stars</Select.Option>
              <Select.Option value={3}>3 Stars</Select.Option>
              <Select.Option value={2}>2 Stars</Select.Option>
              <Select.Option value={1}>1 Star</Select.Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Rating Distribution */}
      <Card style={{ borderRadius: '12px', marginBottom: '24px' }}>
        <h4 style={{ marginBottom: '16px' }}>Rating Distribution</h4>
        <Row gutter={[16, 8]}>
          {ratingDistribution.map(({ star, count, percentage }) => (
            <Col xs={24} key={star}>
              <div className="d-flex align-items-center gap-2">
                <span style={{ width: '50px', fontSize: '14px' }}>{star} ★</span>
                <div style={{ flex: 1, height: '24px', background: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${percentage}%`, 
                    height: '100%', 
                    background: star === 5 ? '#52c41a' : star === 4 ? '#95de64' : star === 3 ? '#faad14' : star === 2 ? '#fa8c16' : '#ff4d4f',
                    borderRadius: '4px',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <span style={{ width: '60px', textAlign: 'right', fontSize: '13px', color: '#666' }}>
                  {count} ({percentage}%)
                </span>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Reviews Table */}
      <Card style={{ borderRadius: '12px' }}>
        {loading ? (
          <div className="text-center py-5">
            <Spin size="large" />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={filteredReviews.map((review, index) => ({
              ...review,
              key: index + 1,
            }))}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1200 }}
          />
        )}
      </Card>

      {/* Delete Modal */}
      <CustomModal
        hideModal={() => setOpen(false)}
        open={open}
        performAction={handleDelete}
        title="Are you sure you want to delete this review?"
      />
    </div>
  );
};

export default Reviews;

