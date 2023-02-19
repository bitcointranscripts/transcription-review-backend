import React, { useState, useEffect } from 'react';
import { Button, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { MenuOutlined } from '@ant-design/icons';

const Navbar = () => {
  const [activeMenu, setActiveMenu] = useState(true);
  const [screenSize, setScreenSize] = useState(undefined);

  useEffect(() => {
    const handleResize = () => setScreenSize(window.innerWidth);

    window.addEventListener('resize', handleResize);

    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (screenSize <= 800) {
      setActiveMenu(false);
    } else {
      setActiveMenu(true);
    }
  }, [screenSize]);

  return (
    <div className="nav-container">
      <div className="logo-container">
        <Typography.Title level={2} className="logo"><Link to="/">Bitcoin Transcripts</Link></Typography.Title>
        <Button className="menu-control-container" onClick={() => setActiveMenu(!activeMenu)}><MenuOutlined /></Button>
      </div>
    </div>
  );
};

export default Navbar;
