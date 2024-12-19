import { useAuth } from "./contexts/AuthProvider";
import Chatroom from "./pages/Chatroom";
import Login from "./pages/Login";

function App() {
  const { currentUser } = useAuth();
  
  return (
    <>
      {currentUser ? (
        <Chatroom />
      ) : (
        <Login />
      )}
    </>
  );
}

export default App;