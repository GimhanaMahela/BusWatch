import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { Link } from "react-router-dom";
import { styled } from "@mui/system";

// Import your logo image. Adjust the path as necessary.
import logo from "../assets/logo.png";

// Styled component for the logo text
const LogoText = styled(Typography)(({ theme }) => ({
  textDecoration: "none",
  color: theme.palette.common.white,
  fontWeight: 700,
  "&:hover": {
    color: theme.palette.grey[300],
  },
}));

const NavButton = styled(Button)(({ theme }) => ({
  color: theme.palette.common.white,
  textTransform: "none",
  margin: theme.spacing(0, 1),
  "&:hover": {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
}));

function Header() {
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const toggleDrawer = (open) => () => {
    setDrawerOpen(open);
  };

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Submit Report", path: "/submit-report" },
    { name: "About Us", path: "/about-us" },
    { name: "Admin Login", path: "/admin/login" },
  ];

  const drawer = (
    <Box
      sx={{ width: 250 }}
      role="presentation"
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
    >
      <List>
        {navItems.map((item) => (
          <ListItem button key={item.name} component={Link} to={item.path}>
            <ListItemText primary={item.name} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <AppBar position="static">
      <Toolbar sx={{ justifyContent: "space-between" }}>
        {" "}
        {/* Changed to space-between to push items to ends */}
        {/* Desktop view: Logo and BusWatch text on the left */}
        <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center" }}>
          <Link
            to="/"
            style={{
              display: "flex",
              alignItems: "center",
              textDecoration: "none",
            }}
          >
            <img
              src={logo}
              alt="BusWatch Logo"
              style={{ height: 80, marginRight: 8 }}
            />
            <LogoText variant="h6" component="span">
              BusWatch
            </LogoText>
          </Link>
        </Box>
        {/* Mobile view: Menu icon, Logo, and BusWatch text */}
        <Box
          sx={{
            flexGrow: 1, // Allows this box to take available space
            display: { xs: "flex", md: "none" },
            alignItems: "center",
          }}
        >
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={toggleDrawer(true)}
            sx={{ mr: 1 }}
          >
            <MenuIcon />
          </IconButton>
          <Link
            to="/"
            style={{
              display: "flex",
              alignItems: "center",
              textDecoration: "none",
            }}
          >
            <img
              src={logo}
              alt="BusWatch Logo"
              style={{ height: 80, marginRight: 8 }}
            />
            <LogoText variant="h6" component="span">
              BusWatch
            </LogoText>
          </Link>
          <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
            {drawer}
          </Drawer>
        </Box>
        {/* Navigation items for larger screens, now aligned to the right */}
        <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center" }}>
          {" "}
          {/* This box naturally goes to the right */}
          {navItems.map((item) => (
            <NavButton key={item.name} component={Link} to={item.path}>
              {item.name}
            </NavButton>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Header;
