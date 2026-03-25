import React, { useContext } from 'react'
import './Navbar.css'
import { assets } from '../../assets/assets'
import { KitchenContext } from '../../context/KitchenContext'
import { toast } from "react-toastify"

const Navbar = () => {

  const { kitchenOpen, toggleKitchen } = useContext(KitchenContext)

  const handleToggle = async () => {
    await toggleKitchen()

    // Toast message
    toast.success(
      kitchenOpen ? "Kitchen Closed ❌" : "Kitchen Opened ✅"
    )
  }

  return (
    <header className='navbar'>
      <img className='logo' src={assets.logo} alt="logo" />

      <div className="navbar-right">

        {/* 🔥 TOGGLE BUTTON */}
        <button
          className={`kitchen-toggle ${kitchenOpen ? "open" : "closed"}`}
          onClick={handleToggle}
        >
          <span className="toggle-dot"></span>
          {kitchenOpen ? "Kitchen Open" : "Kitchen Closed"}
        </button>

        <img className='profile' src={assets.profile_image} alt="profile" />
      </div>
    </header>
  )
}

export default Navbar