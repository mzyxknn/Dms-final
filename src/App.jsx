import { Button, Container, Modal, Spinner } from "react-bootstrap";
import Sidebar from "./components/sidebar";
import Layout from "./layout/layout";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  Link,
} from "react-router-dom";
import Dashboard from "./pages/dashboard";
import Reports from "./pages/reports";
import Files from "./pages/files";
import Outgoing from "./pages/outgoing";
import Incoming from "./pages/incoming";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import MessageView from "./pages/message-view";
import CreateUser from "./pages/createUser";
import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth, db } from "../firebase";
import { FaUser, FaLock } from "react-icons/fa";
import { BounceLoader } from "react-spinners";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import UserDashboard from "./pages/user-dashboard";
import UserIncoming from "./pages/user-incoming";
import UserOutgoing from "./pages/user-outgoing";
import Middleware from "./pages/middleware";
import UserMiddleware from "./pages/userMiddleware";
import Office from "./pages/office";
import UserFiles from "./pages/user-files";
import axios from "axios";
import UserReports from "./pages/user-reports";

function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [appLoading, setAppLoading] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [modalShow, setModalShow] = useState(false);

  const LoginComponent = () => {
    let navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const isAdmin = async () => {
      const userRef = doc(db, "users", auth.currentUser.uid);
      onSnapshot(userRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          if (data.role == "admin") {
            setAdmin(true);
            navigate("/dashboard");
            setModalShow(true);
          }
          if (data.role == "user") {
            setAdmin(false);
            navigate("/user-incoming");
            setModalShow(true);
          }
        }
      });
    };

    const handleLogin = async () => {
      setLoading(true);
      try {
        await signInWithEmailAndPassword(auth, email, password);
        isAdmin();
      } catch (error) {
        toast.error(error.message);
      }
      setLoading(false);
    };

    return (
      <>
        <div className="login-wrapper d-flex justify-content-center align-items-center">
          <div className="login-content d-flex justify-content-center align-items-center flex-column">
            <img width={"80px"} src="./assets/images/logo.png" alt="" />
            <h2 className="fw-bold">DMS-LGU</h2>
            <p>Document Management System</p>
            <div className="wrapper flex ">
              <FaUser className="m-3" />
              <input
                className="form-control bg-secondary"
                type="text"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="wrapper flex">
              <FaLock className="m-3" />
              <input
                className="form-control bg-secondary"
                type="password"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button className="btn btn-primary my-3 px-5" onClick={handleLogin}>
              {!loading ? (
                "Login"
              ) : (
                <Spinner animation="border" variant="secondary" />
              )}
            </button>
            <Link to={"/forgot"}>Forgot Password?</Link>
          </div>
        </div>
      </>
    );
  };

  const ForgotComponent = () => {
    let navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleForgot = async () => {
      try {
        setLoading(true);
        await sendPasswordResetEmail(auth, email);
        toast.success("Successfully sent an email for password reset");
        navigate("/");
      } catch (error) {
        toast.error(error.message);
      }
      setLoading(false);
    };

    return (
      <>
        <div className="login-wrapper d-flex justify-content-center align-items-center">
          <div className="login-content d-flex justify-content-center align-items-center flex-column">
            <img width={"80px"} src="./assets/images/logo.png" alt="" />
            <h2 className="fw-bold">DMS-LGU</h2>
            <p>Document Management System</p>
            <div className="wrapper flex ">
              <FaUser className="m-3" />
              <input
                className="form-control bg-secondary"
                type="text"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              className="btn btn-primary my-3 px-5"
              onClick={handleForgot}
            >
              {!loading ? (
                "Send Email"
              ) : (
                <Spinner animation="border" variant="secondary" />
              )}
            </button>
          </div>
        </div>
      </>
    );
  };

  function WelcomeModal(props) {
    return (
      <Modal
        {...props}
        size="md"
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header closeButton className="bg-primary">
          <Modal.Title id="contained-modal-title-vcenter"></Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <img src="./assets/images/game-icons_confirmed.png" alt="" />

          <h2 className="fw-bold">Welcome Back!</h2>

          {props.user && <h5>{props.user.fullName}</h5>}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={props.onHide}>Close</Button>
        </Modal.Footer>
      </Modal>
    );
  }

  const getUserData = async (id) => {
    const userRef = doc(db, "users", auth.currentUser.uid);
    const snapshot = await getDoc(userRef);
    setUserData(snapshot.data());
  };

  useEffect(() => {
    setAppLoading(true);

    onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
    });

    setTimeout(() => {
      setAppLoading(false);
    }, 2000);
  }, []);

  useEffect(() => {
    if (user) {
      getUserData();
    }
  }, [user]);

  return (
    <>
      {user && (
        <WelcomeModal
          show={modalShow}
          onHide={() => setModalShow(false)}
          user={userData}
        />
      )}

      {!appLoading ? (
        <Router>
          <Routes>
            <Route path="/" element={<LoginComponent />} />
            <Route path="/forgot" element={<ForgotComponent />} />
            <Route
              path="/dashboard"
              element={
                <Middleware admin={admin}>
                  <Dashboard />
                </Middleware>
              }
            />
            <Route
              path="/reports"
              element={
                <Middleware admin={admin}>
                  <Reports />
                </Middleware>
              }
            />
            <Route
              path="/files"
              element={
                <Middleware admin={admin}>
                  <Files />
                </Middleware>
              }
            />
            <Route
              path="/outgoing"
              element={
                <Middleware admin={admin}>
                  <Outgoing />
                </Middleware>
              }
            />
            <Route
              path="/incoming"
              element={
                <Middleware admin={admin}>
                  <Incoming />
                </Middleware>
              }
            />
            <Route
              path="/create-user"
              element={
                <Middleware admin={admin}>
                  <CreateUser />
                </Middleware>
              }
            />{" "}
            <Route
              path="/office-management"
              element={
                <Middleware admin={admin}>
                  <Office />
                </Middleware>
              }
            />{" "}
            <Route
              path="/user-incoming"
              element={
                <UserMiddleware admin={admin}>
                  <UserIncoming />
                </UserMiddleware>
              }
            />
            <Route
              path="/user-files"
              element={
                <UserMiddleware admin={admin}>
                  <UserFiles />
                </UserMiddleware>
              }
            />
            <Route
              path="/user-outgoing"
              element={
                <UserMiddleware admin={admin}>
                  <UserOutgoing />
                </UserMiddleware>
              }
            />
            <Route
              path="/user-reports"
              element={
                <UserMiddleware admin={admin}>
                  <UserReports />
                </UserMiddleware>
              }
            />
          </Routes>

          <ToastContainer
            position="top-center"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </Router>
      ) : (
        <div className="vh-100 flex">
          <BounceLoader size={100} color="#5cd000" />
        </div>
      )}
    </>
  );
}

export default App;
