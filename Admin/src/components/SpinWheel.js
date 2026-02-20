import React, { useState, useEffect, useRef } from "react";
import { FaGift, FaTimes, FaStar } from "react-icons/fa";

const SpinWheel = ({ isOpen, onClose, onSpinComplete, purchaseAmount = 0 }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState(null);
  const wheelRef = useRef(null);

  // Smart offers based on purchase amount - ensures profitability
  const getOffersForAmount = (amount) => {
    if (amount < 300) {
      // Small purchase - only give small offers
      return [
        { label: "5% OFF", value: 5, type: "percentage", color: "#FF6B6B", minPurchase: 0 },
        { label: "₹30 OFF", value: 30, type: "flat", color: "#4ECDC4", minPurchase: 0 },
        { label: "10% OFF", value: 10, type: "percentage", color: "#45B7D1", minPurchase: 0 },
        { label: "NO LUCK", value: 0, type: "none", color: "#95A5A6", minPurchase: 0 },
        { label: "₹50 OFF", value: 50, type: "flat", color: "#96CEB4", minPurchase: 0 },
        { label: "7% OFF", value: 7, type: "percentage", color: "#FFEAA7", minPurchase: 0 },
      ];
    } else if (amount < 800) {
      // Medium-small purchase
      return [
        { label: "5% OFF", value: 5, type: "percentage", color: "#FF6B6B", minPurchase: 0 },
        { label: "₹50 OFF", value: 50, type: "flat", color: "#4ECDC4", minPurchase: 0 },
        { label: "10% OFF", value: 10, type: "percentage", color: "#45B7D1", minPurchase: 0 },
        { label: "₹100 OFF", value: 100, type: "flat", color: "#96CEB4", minPurchase: 0 },
        { label: "15% OFF", value: 15, type: "percentage", color: "#FFEAA7", minPurchase: 0 },
        { label: "NO LUCK", value: 0, type: "none", color: "#95A5A6", minPurchase: 0 },
      ];
    } else if (amount < 1500) {
      // Medium purchase
      return [
        { label: "7% OFF", value: 7, type: "percentage", color: "#FF6B6B", minPurchase: 0 },
        { label: "₹100 OFF", value: 100, type: "flat", color: "#4ECDC4", minPurchase: 0 },
        { label: "10% OFF", value: 10, type: "percentage", color: "#45B7D1", minPurchase: 0 },
        { label: "₹150 OFF", value: 150, type: "flat", color: "#96CEB4", minPurchase: 0 },
        { label: "12% OFF", value: 12, type: "percentage", color: "#FFEAA7", minPurchase: 0 },
        { label: "NO LUCK", value: 0, type: "none", color: "#95A5A6", minPurchase: 0 },
      ];
    } else if (amount < 3000) {
      // Large purchase
      return [
        { label: "10% OFF", value: 10, type: "percentage", color: "#FF6B6B", minPurchase: 0 },
        { label: "₹200 OFF", value: 200, type: "flat", color: "#4ECDC4", minPurchase: 0 },
        { label: "15% OFF", value: 15, type: "percentage", color: "#45B7D1", minPurchase: 0 },
        { label: "₹300 OFF", value: 300, type: "flat", color: "#96CEB4", minPurchase: 0 },
        { label: "12% OFF", value: 12, type: "percentage", color: "#FFEAA7", minPurchase: 0 },
        { label: "NO LUCK", value: 0, type: "none", color: "#95A5A6", minPurchase: 0 },
      ];
    } else {
      // Very large purchase - premium offers
      return [
        { label: "12% OFF", value: 12, type: "percentage", color: "#FF6B6B", minPurchase: 0 },
        { label: "₹300 OFF", value: 300, type: "flat", color: "#4ECDC4", minPurchase: 0 },
        { label: "15% OFF", value: 15, type: "percentage", color: "#45B7D1", minPurchase: 0 },
        { label: "₹500 OFF", value: 500, type: "flat", color: "#96CEB4", minPurchase: 0 },
        { label: "20% OFF", value: 20, type: "percentage", color: "#FFEAA7", minPurchase: 0 },
        { label: "NO LUCK", value: 0, type: "none", color: "#95A5A6", minPurchase: 0 },
      ];
    }
  };

  // Use dynamic offers based on purchase amount
  const offers = getOffersForAmount(purchaseAmount);
  const segmentAngle = 360 / offers.length;

  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setResult(null);
      setRotation(0);
    }
  }, [isOpen]);

  const spinWheel = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setResult(null);

    // Random spin - at least 5 full rotations + random position
    const spins = 5 + Math.random() * 3; // 5-8 full rotations
    const randomOffset = Math.random() * 360;
    const newRotation = rotation + spins * 360 + randomOffset;

    setRotation(newRotation);

    // Calculate result after animation
    setTimeout(() => {
      // Normalize the rotation to 0-360
      const normalizedRotation = newRotation % 360;
      // The pointer is at the top (270 degrees from right)
      // We need to find which segment is at the pointer
      const pointerPosition = (360 - normalizedRotation + 270) % 360;
      const winningIndex = Math.floor(pointerPosition / segmentAngle);
      
      const winningOffer = offers[winningIndex];
      setResult(winningOffer);
      setIsSpinning(false);
      
      if (onSpinComplete) {
        onSpinComplete(winningOffer);
      }
    }, 5000); // 5 seconds spin duration
  };

  const handleClose = () => {
    if (!isSpinning) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full mx-4 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={handleClose}
          disabled={isSpinning}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          <FaTimes className="text-gray-500" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full mb-4">
            <FaGift className="text-3xl text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Spin & Win!</h2>
          <p className="text-gray-500 mt-1">Spin the wheel to get an exclusive offer</p>
        </div>

        {/* Wheel Container */}
        <div className="relative flex justify-center mb-6">
          {/* Pointer */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
            <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[25px] border-t-amber-500" />
          </div>

          {/* Wheel */}
          <div 
            ref={wheelRef}
            className="relative w-64 h-64 rounded-full"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning ? "transform 5s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "transform 0.3s ease-out",
            }}
          >
            {/* Segments */}
            {offers.map((offer, index) => (
              <div
                key={index}
                className="absolute w-full h-full"
                style={{
                  transform: `rotate(${index * segmentAngle}deg)`,
                  clipPath: "polygon(50% 50%, 100% 0, 100% 100%)",
                  backgroundColor: offer.color,
                }}
              >
                {/* Label */}
                <span
                  className="absolute left-1/2 top-1/2 text-xs font-bold text-white whitespace-nowrap"
                  style={{
                    transform: `translate(-50%, -50%) rotate(${segmentAngle / 2}deg)`,
                    transformOrigin: "center center",
                  }}
                >
                  {offer.label}
                </span>
              </div>
            ))}

            {/* Center Circle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center">
              <FaStar className="text-amber-500 text-xl" />
            </div>
          </div>
        </div>

        {/* Result Display */}
        {result && (
          <div className="text-center mb-6 animate-fade-in">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
              <p className="text-gray-600 text-sm">Congratulations! You won</p>
              <p className="text-2xl font-bold text-amber-600">
                {result.value === 0 ? "No Luck" : result.type === "percentage" 
                  ? `${result.value}% OFF` 
                  : `₹${result.value} FLAT OFF`}
              </p>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="text-center">
          {!result ? (
            <button
              onClick={spinWheel}
              disabled={isSpinning}
              className={`px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-full text-lg shadow-lg transform transition-all hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${isSpinning ? 'animate-pulse' : ''}`}
            >
              {isSpinning ? "Spinning..." : "SPIN NOW!"}
            </button>
          ) : (
            <button
              onClick={handleClose}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-full text-lg shadow-lg transform transition-all hover:scale-105 hover:shadow-xl"
            >
              Claim Offer
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default SpinWheel;

