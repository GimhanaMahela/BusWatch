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
import { styled } from "@mui/system"; // Use MUI's styled utility if preferred for simple cases

// Styled component for the logo text
const LogoText = styled(Typography)(({ theme }) => ({
  flexGrow: 1,
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
      <Toolbar>
        <LogoText
          variant="h6"
          component={Link}
          to="/"
          sx={{ display: { xs: "none", md: "block" } }}
        >
          BusWatch
        </LogoText>
        <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={toggleDrawer(true)}
          >
            <MenuIcon />
          </IconButton>
          <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
            {drawer}
          </Drawer>
          <LogoText variant="h6" component={Link} to="/" sx={{ marginLeft: 2 }}>
            BusWatch
          </LogoText>
        </Box>
        <Box sx={{ display: { xs: "none", md: "block" } }}>
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
