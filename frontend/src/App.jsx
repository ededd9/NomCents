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

function App() {
  // Set up routes
  let element = useRoutes([
    {
      path: "/",
      element: <Homepage />,
    },
    {
      path: "/login",
      element: <LoginPage />,
    },
    {
      path: "/profile/:username",
      element: <Profile />,
    },
    {
      path: "/products",
      element: <ViewProducts />,
    },
    {
      path: "/products/details/:id", 
      element: <ViewProductDetails />, 
    },
    {
      path: "/grocery-cart",
      element: <GroceryCartPage />,
    },
    { 
      path: "/favorites",
      element: <FavoritesPage />,
    },
  ]);

  return (
    <LoginProvider>
      <div className="App">
        <div className="NavBar">
          <a href="/">Home </a>
          <a href="/products">Products </a>
          <a href="/favorites"> Favorites </a> 
          <a href="/grocery-cart"> ViewCart </a>
          <a href="/profile/:username">Profile </a> 
          <LoginContext.Consumer>
            {({ isLoggedIn, setIsLoggedIn }) =>
              isLoggedIn ? (
                <button onClick={() => {
                  setIsLoggedIn(false);
                  window.location.href = '/'; // Redirect to homepage after logout
                }}>Logout</button>
              ) : (
                <a href="/login"> Login</a>
              )
            }
          </LoginContext.Consumer>
        </div>
        {element}
      </div>
    </LoginProvider>
  );
}

export default App;