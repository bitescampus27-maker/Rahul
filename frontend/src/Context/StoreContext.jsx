import { createContext, useEffect, useState } from "react";
import { menu_list } from "../assets/assets";
import axios from "axios";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {

    const url = "http://localhost:5000";

    const [food_list, setFoodList] = useState([]);
    const [cartItems, setCartItems] = useState({});
    const [token, setToken] = useState(localStorage.getItem("token") || "");
    const currency = "₹";
    const [searchQuery, setSearchQuery] = useState("");
    const [deliveryFee, setDeliveryFee] = useState(10);

    // ============================
    // AXIOS GLOBAL CONFIG
    // ============================
    axios.defaults.baseURL = url;

    axios.interceptors.request.use((config) => {
        const storedToken = localStorage.getItem("token");

        if (storedToken) {
            config.headers.Authorization = `Bearer ${storedToken}`;
        }

        return config;
    });

    // ===============================
    // FETCH DELIVERY FEE
    // ===============================
    const fetchDeliveryFee = async () => {
        try {
            const res = await axios.get("/api/settings/delivery-fee");

            if (res.data?.deliveryFee !== undefined) {
                setDeliveryFee(res.data.deliveryFee);
            }
        } catch (err) {
            console.error("Delivery fee fetch error:", err);
        }
    };

    // ===============================
    // ADD TO CART
    // ===============================
    const addToCart = async (itemId) => {

        const updatedCart = {
            ...cartItems,
            [itemId]: (cartItems[itemId] || 0) + 1
        };

        setCartItems(updatedCart);

        if (token) {
            await axios.post("/api/cart/add", { itemId });
        } else {
            localStorage.setItem("guestCart", JSON.stringify(updatedCart));
        }
    };

    // ===============================
    // REMOVE FROM CART
    // ===============================
    const removeFromCart = async (itemId) => {

        const updatedCart = { ...cartItems };

        if (updatedCart[itemId] > 1) {
            updatedCart[itemId] -= 1;
        } else {
            delete updatedCart[itemId];
        }

        setCartItems(updatedCart);

        if (token) {
            await axios.post("/api/cart/remove", { itemId });
        } else {
            localStorage.setItem("guestCart", JSON.stringify(updatedCart));
        }
    };

    // ===============================
    // TOTAL CART
    // ===============================
    const getTotalCartAmount = () => {
        let totalAmount = 0;

        for (const item in cartItems) {
            const itemInfo = food_list.find((p) => p._id === item);
            if (itemInfo) {
                totalAmount += itemInfo.price * cartItems[item];
            }
        }

        return totalAmount;
    };

    // ===============================
    // FETCH FOOD
    // ===============================
    const fetchFoodList = async () => {
        const response = await axios.get("/api/food/list");
        setFoodList(response.data.data);
    };

    // ===============================
    // PLACE ORDER (FINAL FIX)
    // ===============================
    const placeOrder = async ({ address, paymentMethod }) => {

        try {

            const formattedItems = Object.keys(cartItems).map((itemId) => {
                const foodItem = food_list.find((f) => f._id === itemId);

                return {
                    _id: itemId,
                    name: foodItem?.name || "",
                    price: foodItem?.price || 0,
                    quantity: cartItems[itemId]
                };
            });

            if (formattedItems.length === 0) {
                return { success: false, message: "Cart is empty" };
            }

            const subtotal = getTotalCartAmount();
            const totalAmount = subtotal + deliveryFee;

            const endpoint =
                paymentMethod === "COD"
                    ? "/api/order/placecod"
                    : "/api/order/place";

            const response = await axios.post(endpoint, {
                items: formattedItems,
                amount: subtotal,
                deliveryFee,
                totalAmount,
                address,
                paymentMethod,
                userType: address?.userType || null
            });

            if (response.data.success) {
                setCartItems({});
                localStorage.removeItem("guestCart");
            }

            return response.data;

        } catch (error) {

            console.error("Order error:", error.response?.data || error.message);

            return {
                success: false,
                message: error.response?.data?.message || "Order failed"
            };
        }
    };

    // ===============================
    // INITIAL LOAD
    // ===============================
    useEffect(() => {

        async function loadData() {

            await fetchFoodList();
            await fetchDeliveryFee();

            const storedToken = localStorage.getItem("token");

            if (storedToken) {
                setToken(storedToken);
            } else {
                const guestCart =
                    JSON.parse(localStorage.getItem("guestCart")) || {};
                setCartItems(guestCart);
            }
        }

        loadData();

    }, []);

    const contextValue = {
        url,
        food_list,
        menu_list,
        cartItems,
        addToCart,
        removeFromCart,
        getTotalCartAmount,
        token,
        setToken,
        currency,
        deliveryFee,
        placeOrder,
        searchQuery,
        setSearchQuery
    };

    return (
        <StoreContext.Provider value={contextValue}>
            {props.children}
        </StoreContext.Provider>
    );
};

export default StoreContextProvider;