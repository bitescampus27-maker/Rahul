import { createContext, useEffect, useState } from "react";
import axios from "axios";

export const KitchenContext = createContext();

const KitchenProvider = ({ children }) => {
  const [kitchenOpen, setKitchenOpen] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await axios.get("https://rahul-joqb.onrender.com/api/settings");
      if (res.data.success) {
        setKitchenOpen(res.data.kitchenOpen);
      }
    } catch (err) {
      console.error("Error fetching kitchen status", err);
    }
  };

  const toggleKitchen = async () => {
    try {
      const res = await axios.post("https://rahul-joqb.onrender.com/api/settings/toggle-kitchen");
      if (res.data.success) {
        setKitchenOpen(res.data.kitchenOpen);
      }
    } catch (err) {
      console.error("Error toggling kitchen", err);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <KitchenContext.Provider value={{ kitchenOpen, toggleKitchen }}>
      {children}
    </KitchenContext.Provider>
  );
};

export default KitchenProvider;
