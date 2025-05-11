import { useRoutes } from "react-router-dom";
import "./App.css";
import { LoginProvider, LoginContext } from "./contexts/LoginContext";
import Homepage from "./pages/Homepage";
import LoginPage from "./pages/LoginPage";
import Profile from "./pages/Profile";
import ViewProducts from "./pages/ViewProducts";
import ViewProductDetails from "./pages/ViewProductDetails";
import GroceryCartPage from "./pages/GroceryCartPage";
import FavoritesPage from "./pages/FavoritesPage";
import ProgressPage from "./pages/ProgressPage";

function App() {
  let element = useRoutes([
    { path: "/", element: <Homepage /> },
    { path: "/login", element: <LoginPage /> },
    { path: "/profile/:username", element: <Profile /> },
    { path: "/products", element: <ViewProducts /> },
    { path: "/products/details/:id", element: <ViewProductDetails /> },
    { path: "/grocery-cart", element: <GroceryCartPage /> },
    { path: "/favorites", element: <FavoritesPage /> },
    { path: "/progress", element: <ProgressPage /> },
  ]);

  return (
    <LoginProvider>
      <div className="App">
        <div className="NavBar">
          <div className="left-nav">
            <a href="/">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="30"
                height="30"
                viewBox="0 0 24 24"
              >
                <path d="M 12.023438 2 A 0.750075 0.750075 0 0 0 11.619141 2.1035156 L 2.1191406 7.6914062 A 0.75033057 0.75033057 0 1 0 2.8808594 8.984375 L 3 8.9140625 L 3 20.25 A 0.750075 0.750075 0 0 0 3.75 21 L 20.25 21 A 0.750075 0.750075 0 0 0 21 20.25 L 21 8.9140625 L 21.119141 8.984375 A 0.75033037 0.75033037 0 1 0 21.880859 7.6914062 L 12.380859 2.1035156 A 0.750075 0.750075 0 0 0 12.023438 2 z M 12 3.6210938 L 19.5 8.03125 L 19.5 19.5 L 16 19.5 L 16 11.75 A 0.750075 0.750075 0 0 0 15.25 11 L 8.75 11 A 0.750075 0.750075 0 0 0 8 11.75 L 8 19.5 L 4.5 19.5 L 4.5 8.03125 L 12 3.6210938 z M 9.5 12.5 L 14.5 12.5 L 14.5 19.5 L 9.5 19.5 L 9.5 12.5 z"></path>
              </svg>
            </a>
          </div>
          <div className="right-nav">
            <a href="/products">Products</a>
            <a href="/favorites">Favorites</a>
            <a href="/grocery-cart">ViewCart</a>
            <a href="/progress">Progress</a>
            <a href="/profile/:username">Profile</a>
            <LoginContext.Consumer>
              {({ isLoggedIn, setIsLoggedIn }) =>
                isLoggedIn ? (
                  <button
                    onClick={() => {
                      setIsLoggedIn(false);
                      window.location.href = "/";
                    }}
                  >
                    Logout
                  </button>
                ) : (
                  <a href="/login">Login</a>
                )
              }
            </LoginContext.Consumer>
          </div>
        </div>
        {element}
      </div>
    </LoginProvider>
  );
}

export default App;
