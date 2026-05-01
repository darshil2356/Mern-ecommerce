import React, { useState, useCallback } from "react";
import { Modal, Button, Upload, Spin, Alert, Progress } from "antd";
import { FaRobot } from "react-icons/fa";
import { MdAutoAwesome } from "react-icons/md";
import { InboxOutlined } from "@ant-design/icons";
import api from "../utils/axiosconfig";

const { Dragger } = Upload;

const AIProductGenerator = ({ onGenerated }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const [imageBase64, setImageBase64] = useState("");
  const [mimeType, setMimeType] = useState("image/jpeg");
  const [confidence, setConfidence] = useState(null);

  const resetState = () => {
    setPreview(null);
    setImageBase64("");
    setError("");
    setConfidence(null);
  };

  const handleClose = () => {
    setOpen(false);
    resetState();
  };

  const handleFileRead = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target.result;
        // result is "data:image/jpeg;base64,XXXX"
        const base64 = result.split(",")[1];
        resolve({ base64, mime: file.type || "image/jpeg" });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  const beforeUpload = async (file) => {
    setError("");
    setConfidence(null);
    try {
      const { base64, mime } = await handleFileRead(file);
      setImageBase64(base64);
      setMimeType(mime);
      setPreview(URL.createObjectURL(file));
    } catch {
      setError("Failed to read image file.");
    }
    return false; // prevent antd auto-upload
  };

  const handleGenerate = async () => {
    if (!imageBase64) {
      setError("Please upload a product image first.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("product/ai-generate", {
        imageBase64,
        mimeType,
      });
      setConfidence(data.ai_confidence_score ?? null);
      onGenerated(data);
      handleClose();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "AI generation failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        type="default"
        icon={<FaRobot style={{ marginRight: 6 }} />}
        onClick={() => setOpen(true)}
        style={{
          height: 40,
          borderRadius: 8,
          fontWeight: 500,
          borderColor: "#722ed1",
          color: "#722ed1",
          display: "flex",
          alignItems: "center",
        }}
      >
        AI Generate
      </Button>

      <Modal
        open={open}
        onCancel={handleClose}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <MdAutoAwesome style={{ color: "#722ed1", fontSize: 20 }} />
            <span>AI Product Listing Generator</span>
          </div>
        }
        footer={[
          <Button key="cancel" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>,
          <Button
            key="generate"
            type="primary"
            loading={loading}
            disabled={!imageBase64}
            onClick={handleGenerate}
            style={{ backgroundColor: "#722ed1", borderColor: "#722ed1" }}
          >
            {loading ? "Analyzing..." : "Generate Listing"}
          </Button>,
        ]}
        width="min(520px, 95vw)"
        destroyOnClose
      >
        <div style={{ padding: "8px 0" }}>
          <p style={{ color: "#595959", marginBottom: 16, fontSize: 13 }}>
            Upload a product image and let AI auto-fill the product form with
            SEO-optimized content for the Indian market.
          </p>

          {!preview ? (
            <Dragger
              accept="image/*"
              beforeUpload={beforeUpload}
              showUploadList={false}
              style={{ borderRadius: 8 }}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ color: "#722ed1" }} />
              </p>
              <p className="ant-upload-text">
                Click or drag a product image here
              </p>
              <p className="ant-upload-hint">
                Supports JPG, PNG, WEBP. Clear product photos give better
                results.
              </p>
            </Dragger>
          ) : (
            <div style={{ textAlign: "center" }}>
              <img
                src={preview}
                alt="preview"
                style={{
                  maxHeight: 240,
                  maxWidth: "100%",
                  borderRadius: 8,
                  border: "1px solid #f0f0f0",
                  objectFit: "contain",
                }}
              />
              <div style={{ marginTop: 8 }}>
                <Button
                  size="small"
                  onClick={resetState}
                  disabled={loading}
                  style={{ fontSize: 12 }}
                >
                  Change Image
                </Button>
              </div>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: "center", marginTop: 20 }}>
              <Spin size="large" />
              <p style={{ marginTop: 8, color: "#722ed1", fontSize: 13 }}>
                Analyzing image with AI...
              </p>
            </div>
          )}

          {confidence !== null && !loading && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 12, color: "#595959", marginBottom: 4 }}>
                AI Confidence Score
              </p>
              <Progress
                percent={confidence}
                strokeColor={
                  confidence >= 70
                    ? "#52c41a"
                    : confidence >= 40
                    ? "#faad14"
                    : "#ff4d4f"
                }
                size="small"
              />
            </div>
          )}

          {error && (
            <Alert
              type="error"
              message={error}
              showIcon
              style={{ marginTop: 16, borderRadius: 8 }}
            />
          )}
        </div>
      </Modal>
    </>
  );
};

export default AIProductGenerator;
