import React, { useContext } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemText,
  useMediaQuery,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import AccountCircle from "@mui/icons-material/AccountCircle";
import { useTheme } from "@mui/material/styles";
import { NavLink } from "react-router-dom";
import logo from "../assets/logo.png";
import UserContext from "../account/UserContext.jsx";

const menuItems = [
  { label: "Carte", path: "/" },
  { label: "Événements", path: "/events" },
  { label: "Mes événements", path: "/my-events" },
];

export default function Header() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { me, logout } = useContext(UserContext);

  const [anchorEl, setAnchorEl] = React.useState(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleLogout = () => {
    logout();
    handleMenuClose();
  };

  const toggleDrawer = () => setDrawerOpen(!drawerOpen);

  const navLinkStyle = ({ isActive }) => ({
    color: isActive ? "#fff" : "#ddd",
    fontWeight: isActive ? "bold" : "normal",
    margin: "0 0.5rem",
    textDecoration: "none",
  });

  return (
    <>
      <AppBar position="static" color="primary">
        <Toolbar sx={{ justifyContent: "space-between" }}>
          {/* Logo + Menu mobile */}
          <Box display="flex" alignItems="center">
            {isMobile && me && (
              <IconButton color="inherit" onClick={toggleDrawer}>
                <MenuIcon />
              </IconButton>
            )}
            <img src={logo} alt="Slopify" style={{ height: 40, marginLeft: isMobile ? 8 : 0 }} />
            {!isMobile && me && (
              <Typography variant="h6" component="div" sx={{ ml: 2 }}>
                Slopify
              </Typography>
            )}
          </Box>

          {/* Menu desktop */}
          {!isMobile && me && (
            <Box>
              {menuItems.map((item) => (
                <NavLink key={item.path} to={item.path} style={navLinkStyle}>
                  {item.label}
                </NavLink>
              ))}
            </Box>
          )}

          {/* Profil / Déconnexion */}
          {me && (
            <Box>
              <IconButton onClick={handleMenuOpen} color="inherit">
                <AccountCircle />
              </IconButton>
              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <MenuItem onClick={handleMenuClose}>Profil</MenuItem>
                <MenuItem onClick={handleLogout}>Déconnexion</MenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Drawer Mobile */}
      {me && (
        <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer}>
          <Box sx={{ width: 250 }} role="presentation" onClick={toggleDrawer}>
            <List>
              {menuItems.map((item) => (
                <ListItem button key={item.path} component={NavLink} to={item.path}>
                  <ListItemText primary={item.label} />
                </ListItem>
              ))}
            </List>
          </Box>
        </Drawer>
      )}
    </>
  );
}
