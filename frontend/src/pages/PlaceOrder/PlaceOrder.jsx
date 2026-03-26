import React, { useContext, useEffect, useState } from 'react';
import './PlaceOrder.css';
import { StoreContext } from '../../Context/StoreContext';
import { assets } from '../../assets/assets';
import { useNavigate } from 'react-router-dom';
import axios from "axios";

/* ================= RAZORPAY PAYMENT ================= */
const handlePayment = async (
  amount,
  address,
  items,
  token,
  placeOrder,
  navigate,
  couponCode
) => {
  try {
    const { data } = await axios.post(
      "https://rahul-joqb.onrender.com/api/payment/create-order",
      { amount },
      { headers: token ? { token } : {} }
    );

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY,
      amount: data.amount,
      currency: data.currency,
      name: "Campus Bites",
      description: "Food Order Payment",
      order_id: data.id,
      handler: async function (response) {
        try {
          const verify = await axios.post(
            "https://rahul-joqb.onrender.com/api/payment/verify-payment",
            response
          );

          if (verify.data.success) {
            const resp = await placeOrder({
              address,
              paymentMethod: "ONLINE",
              couponCode,
              items
            });

            if (resp.success) {
              alert("Payment successful & order placed!");
              navigate("/");
            } else {
              alert("Payment successful but order failed!");
            }
          } else {
            alert("Payment verification failed");
          }
        } catch (err) {
          console.error(err);
          alert("Payment verification error");
        }
      },
      theme: { color: "#3399cc" }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  } catch (error) {
    console.error(error);
    alert("Payment Failed. Try Again.");
  }
};

/* ================= BREAK WINDOW FORMAT ================= */
const formatBreakWindow = (timeStr) => {
  if (!timeStr) return "";

  const [hStr, mStr] = timeStr.split(":");
  let h = parseInt(hStr, 10);
  let m = parseInt(mStr, 10);

  const startMinutesTotal = h * 60 + m;
  const endMinutesTotal = startMinutesTotal + 10;

  const endH = Math.floor(endMinutesTotal / 60) % 24;
  const endM = endMinutesTotal % 60;

  const format12 = (hour24, minutes) => {
    const ampm = hour24 >= 12 ? "PM" : "AM";
    let hour12 = hour24 % 12;
    if (hour12 === 0) hour12 = 12;
    const minStr = minutes.toString().padStart(2, "0");
    return `${hour12}:${minStr} ${ampm}`;
  };

  return `${format12(h, m)} - ${format12(endH, endM)}`;
};

const PlaceOrder = () => {
  const [userType, setUserType] = useState(
    localStorage.getItem("userType") || "student"
  );

  const [data, setData] = useState({
    fullName: "",
    phone: "",
    breakTime: "",
    specialInstructions: "",
    facultyCode: ""
  });

  const [tableNumber, setTableNumber] = useState(null);

  const {
    getTotalCartAmount,
    placeOrder,
    cartItems,
    food_list,
    token,
    deliveryFee,
    discount,
    couponCode
  } = useContext(StoreContext);

  const navigate = useNavigate();

  /* ================= BUILD ORDER ITEMS ================= */
  const buildOrderItems = () => {
    const orderItems = [];
    Object.keys(cartItems).forEach((itemId) => {
      const item = food_list.find((f) => f._id === itemId);
      if (item && cartItems[itemId] > 0) {
        orderItems.push({
          _id: item._id,
          name: item.name,
          price: item.price,
          quantity: cartItems[itemId],
          productType: item.productType
        });
      }
    });
    return orderItems;
  };

  /* ================= LOAD SAVED DATA ================= */
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("checkoutData"));
    if (saved) {
      setUserType(saved.userType || "student");
      setData(prev => ({ ...prev, ...saved }));
    }
  }, []);

  /* ================= SAVE DATA ================= */
  useEffect(() => {
    localStorage.setItem("checkoutData", JSON.stringify({ ...data, userType }));
  }, [data, userType]);

  /* ================= INPUT HANDLER ================= */
  const onChangeHandler = (event) => {
    const { name, value } = event.target;
    setData(prev => ({ ...prev, [name]: value }));
  };

  /* ================= TABLE NUMBER ================= */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("table");
    if (t) setTableNumber(t);
  }, []);

  /* ================= PREVENT EMPTY CART ================= */
  useEffect(() => {
    if (getTotalCartAmount() === 0) navigate('/');
  }, [getTotalCartAmount, navigate]);

  /* ================= FORM VALIDATION ================= */
  const validateForm = () => {
    if (!data.fullName.trim()) {
      alert("Please enter your full name.");
      return false;
    }
    if (!/^\d{10}$/.test(data.phone)) {
      alert("Please enter a valid 10-digit phone number.");
      return false;
    }
    if (!data.breakTime) {
      alert("Please select your break time.");
      return false;
    }
    if (userType === "faculty" && !data.facultyCode.trim()) {
      alert("Please enter Faculty Verification Code.");
      return false;
    }
    return true;
  };

  /* ================= COD ================= */
  const handlePlaceOrderCOD = async () => {
    if (userType === "student") {
      alert("Students cannot use Cash on Delivery.");
      return;
    }
    if (!validateForm()) return;

    const address = {
      ...data,
      userType,
      breakTimeWindow: formatBreakWindow(data.breakTime),
      table: tableNumber
    };

    try {
      const resp = await placeOrder({
        address,
        paymentMethod: "COD",
        items: buildOrderItems()
      });

      if (resp && resp.success) {
        alert("Order placed successfully!");
        navigate('/');
      } else {
        alert("Failed to place order.");
      }
    } catch (err) {
      console.error(err);
      alert("Error placing order.");
    }
  };

  /* ================= ONLINE PAYMENT ================= */
  const handlePayOnline = async () => {
    if (!validateForm()) return;

    const address = {
      ...data,
      breakTimeWindow: formatBreakWindow(data.breakTime),
      table: tableNumber
    };

    const subtotal = getTotalCartAmount();
    const amount = subtotal === 0 ? 0 : subtotal + deliveryFee - discount;

    await handlePayment(
      amount,
      address,
      buildOrderItems(),
      token,
      placeOrder,
      navigate,
      couponCode
    );
  };

  return (
    <div className='place-order'>
      {/* LEFT SIDE FORM */}
      <div className="place-order-left">
        <p className='title'>Delivery Information</p>

        {/* USER TYPE */}
        <div className="user-type-boxes">
          <div
            className={`type-box ${userType === "student" ? "active" : ""}`}
            onClick={() => setUserType("student")}
          >
            Student
          </div>
          <div
            className={`type-box ${userType === "faculty" ? "active" : ""}`}
            onClick={() => setUserType("faculty")}
          >
            Faculty
          </div>
        </div>

        {/* TABLE */}
        {tableNumber && (
          <div style={{
            marginBottom: 12,
            padding: 8,
            background: "#f6f6f6",
            borderRadius: 6
          }}>
            <strong>Ordering for Table:</strong> {tableNumber}
          </div>
        )}

        {/* NAME */}
        <input
          type="text"
          name="fullName"
          value={data.fullName}
          onChange={onChangeHandler}
          placeholder="Full Name"
          required
        />

        {/* PHONE */}
        <input
          type="tel"
          name="phone"
          value={data.phone}
          placeholder="10-digit Phone Number"
          maxLength={10}
          required
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, "");
            if (value.length <= 10) {
              setData(prev => ({ ...prev, phone: value }));
            }
          }}
        />

        {/* MODERN BREAK TIME PICKER */}
        <div className="break-time-container">
          <label className="break-time-label">
            ⏰ Select your break start time
          </label>
          <div className="time-input-box">
            <input
              type="time"
              name="breakTime"
              value={data.breakTime}
              onChange={onChangeHandler}
              step={600}
              required
            />
          </div>
          {data.breakTime && (
            <p className="delivery-window">
              Delivery window: <b>{formatBreakWindow(data.breakTime)}</b>
            </p>
          )}
        </div>

        {/* FACULTY CODE */}
        {userType === "faculty" && (
          <input
            type="text"
            name='facultyCode'
            value={data.facultyCode}
            onChange={onChangeHandler}
            placeholder='Faculty Verification Code'
          />
        )}

        {/* SPECIAL INSTRUCTIONS */}
        <textarea
          name="specialInstructions"
          value={data.specialInstructions}
          onChange={onChangeHandler}
          placeholder="Any special instructions? (optional)"
          style={{
            width: "100%",
            minHeight: "80px",
            marginTop: "10px",
            padding: "10px",
            borderRadius: "6px"
          }}
        />
      </div>

      {/* RIGHT SIDE TOTAL */}
      <div className="place-order-right">
        <div className="cart-total">
          <h2>Cart Totals</h2>
          <div className="cart-total-details">
            <p>Subtotal</p>
            <p>₹{getTotalCartAmount()}</p>
          </div>
          <hr />
          <div className="cart-total-details">
            <p>Delivery Fee</p>
            <p>₹{getTotalCartAmount() === 0 ? 0 : deliveryFee}</p>
          </div>
          <hr />
          {discount > 0 && (
            <>
              <div className="cart-total-details">
                <p>Discount</p>
                <p>-₹{discount}</p>
              </div>
              <hr />
            </>
          )}
          <div className="cart-total-details">
            <b>Total</b>
            <b>
              ₹{getTotalCartAmount() === 0
                ? 0
                : getTotalCartAmount() + deliveryFee - discount}
            </b>
          </div>
        </div>

        {/* PAYMENT */}
        <div className="payment-options">
          <h2>Select Payment Method</h2>

          {userType === "faculty" && (
            <>
              <div className="payment-option">
                <img src={assets.selector_icon} alt="" />
                <p>COD (Cash On Delivery)</p>
              </div>
              <button onClick={handlePlaceOrderCOD}>
                PLACE ORDER (COD)
              </button>
              <hr />
            </>
          )}

          <div className="payment-option">
            <img src={assets.selector_icon} alt="" />
            <p>Pay Online (Razorpay)</p>
          </div>
          <button onClick={handlePayOnline} className="razorpay-btn">
            PAY WITH RAZORPAY
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlaceOrder;
