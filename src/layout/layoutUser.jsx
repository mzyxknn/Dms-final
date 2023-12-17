import UserSidebar from "../components/userSidebar";
import { FaBaby, FaBars, FaUserCircle } from "react-icons/fa";
import Breadcrumb from "react-bootstrap/Breadcrumb";
import Dropdown from "react-bootstrap/Dropdown";
import { signOut } from "firebase/auth";
import { auth, db, storage } from "../../firebase";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Form from "react-bootstrap/Form";

import Button from "react-bootstrap/Button";
import Offcanvas from "react-bootstrap/Offcanvas";

import Modal from "react-bootstrap/Modal";
import { toast } from "react-toastify";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

const LayoutUser = ({ children }) => {
  const [user, setUser] = useState(null);
  const [show, setShow] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);

  const getUser = async () => {
    const userRef = doc(db, "users", auth.currentUser.uid);
    const snapshot = await getDoc(userRef);
    setUser({ ...snapshot.data(), id: snapshot.id });
  };
  const navigation = useNavigate();

  const handleLogout = () => {
    signOut(auth);
    navigation("/");
  };

  function UserModal(props) {
    const user = props.user;

    const [editProfile, setEditProfile] = useState(false);

    function EditProfile(props) {
      const [fullname, setFullname] = useState(
        props.user.fullName ? props.user.fullName : ""
      );
      const [position, setPosition] = useState(
        props.user.position ? props.user.position : ""
      );
      const [gender, setGender] = useState(
        props.user.gender ? props.user.gender : ""
      );
      const [address, setAddress] = useState(
        props.user.address ? props.user.address : ""
      );
      const [email, setEmail] = useState(
        props.user.email ? props.user.email : ""
      );
      const [phone, setPhone] = useState(
        props.user.phone ? props.user.phone : ""
      );

      const [profile, setProfile] = useState(null);

      const handleSubmit = async () => {
        let profileLink = null;
        if (profile) {
          profileLink = await handleUpload(profile);
        }
        const data = {
          fullName: fullname,
          gender: gender,
          position: position,
          address: address,
          phone: phone,
          profile: profileLink || (user && user.profile) || null,
          //profile: profileLink ? profileLink : user.profile, 
        };
        const userDoc = doc(db, "users", props.user.id);
        setDoc(userDoc, data, { merge: true }).then((res) => {
          toast.success("Successfully Updated");
          props.onHide();
          window.location.reload();
        });
      };

      return (
        <Modal
          {...props}
          size="md"
          aria-labelledby="contained-modal-title-vcenter"
          centered
        >
          <Modal.Header className="bg-primary">
            <h5 className="fw-bold text-white">Update Profile</h5>
          </Modal.Header>
          <Modal.Body className="flex flex-column">
            <div
              className="w-100 bg-secondary p-2 my-2"
              style={{ borderRadius: 15 }}
            >
              <label htmlFor="">Upload Profile Picture</label>
              <input
                type="file"
                onChange={(e) => setProfile(e.target.files[0])}
                className="form-control bg-secondary"
              />
            </div>
            <div
              className="w-100 bg-secondary p-2 my-2"
              style={{ borderRadius: 15 }}
            >
              <label htmlFor="">Full Name</label>
              <input
                onChange={(e) => setFullname(e.target.value)}
                type="text"
                className="form-control bg-secondary"
                placeholder={fullname}
                value={fullname}
              />
            </div>

            <div
              className="w-100 bg-secondary p-2 my-2"
              style={{ borderRadius: 15 }}
            >
              <label htmlFor="">Position</label>
              <input
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                type="text"
                className="form-control bg-secondary"
                placeholder={position}
              />
            </div>
            <div
              className="w-100 bg-secondary p-2 my-2"
              style={{ borderRadius: 15 }}
            >
              <label htmlFor="">Gender</label>
              <Form.Select
                onChange={(e) => setGender(e.target.value)}
                className="bg-secondary"
              >
                <option>Please select a gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Prefer not to say</option>
              </Form.Select>{" "}
            </div>
            <div
              className="w-100 bg-secondary p-2 my-2"
              style={{ borderRadius: 15 }}
            >
              <label htmlFor="">Address</label>
              <Form.Control
                value={address}
                placeholder={address}
                onChange={(e) => setAddress(e.target.value)}
                type="text"
                className="form-control bg-secondary"
              />
            </div>
            <div
              className="w-100 bg-secondary p-2 my-2"
              style={{ borderRadius: 15 }}
            >
              <label htmlFor="">Email</label>
              <input
                value={email}
                type="text"
                className="form-control bg-secondary"
              />
            </div>
            <div
              className="w-100 bg-secondary p-2 my-2"
              style={{ borderRadius: 15 }}
            >
              <label htmlFor="">Phone</label>
              <input
                value={phone}
                placeholder={"+63" + phone}
                onChange={(e) => setPhone(e.target.value)}
                type="text"
                className="form-control bg-secondary"
              />
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={handleSubmit}>Update Profile </Button>
          </Modal.Footer>
        </Modal>
      );
    }

    return (
      <>
        <EditProfile
          user={user}
          show={editProfile}
          onHide={() => setEditProfile(false)}
        />
        <Modal
          {...props}
          size="md"
          aria-labelledby="contained-modal-title-vcenter"
          centered
        >
          <Modal.Body className="flex flex-column">
            {user && (
              <img
                style={{ width: "100px", borderRadius: "100%" }}
                src={user.profile}
                alt=""
              />
            )}
            {user && !user.profile && (
              <img
                style={{ width: "120px", borderRadius: "100%" }}
                src="./assets/images/logo.png"
                alt=""
              />
            )}

            <h2 className="fw-bold my-3">{user.fullName}</h2>
            <h5 className="text-info">
              {user.position ? user.position : "Not Specified"}
            </h5>
            <div
              className="bg-secondary p-2 px-4 w-100 my-2"
              style={{ borderRadius: 15 }}
            >
              <p className="mb-0">Gender</p>
              <h6 className="mb-0">
                {user.gender ? user.gender : "Not Specified"}
              </h6>
            </div>
            <div
              className="bg-secondary p-2 px-4 w-100 my-2"
              style={{ borderRadius: 15 }}
            >
              <p className="mb-0">Address</p>
              <h6 className="mb-0">
                {user.address ? user.address : "Not Specified"}
              </h6>
            </div>
            <div
              className="bg-secondary p-2 px-4 w-100 my-2"
              style={{ borderRadius: 15 }}
            >
              <p className="mb-0">Email</p>
              <h6 className="mb-0">
                {user.email ? user.email : "Not Specified"}
              </h6>
            </div>
            <div
              className="bg-secondary p-2 px-4 w-100 my-2"
              style={{ borderRadius: 15 }}
            >
              <p className="mb-0">Phone</p>
              <h6 className="mb-0">
                +63{user.phone ? user.phone : "Not Specified"}
              </h6>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={() => setEditProfile(true)}>Edit Profile</Button>
          </Modal.Footer>
        </Modal>
      </>
    );
  }

  function SidebarWrapper(props) {
    return (
      <>
        <Offcanvas show={props.show} onHide={props.handleClose}>
          <Offcanvas.Body>
            <UserSidebar onHide={props.handleClose} />
          </Offcanvas.Body>
        </Offcanvas>
      </>
    );
  }

  const handleUpload = (file) => {
    const storageRef = ref(storage, `uploads/${file.name}`);
    return uploadBytes(storageRef, file).then((snapshot) => {
      return getDownloadURL(storageRef)
        .then((url) => {
          if (url) {
            return url;
          }
        })
        .catch((error) => {
          console.error("Error getting download URL:", error);
        });
    });
  };

  useEffect(() => {
    getUser();
  }, []);

  return (
    <div className="container-fluid p-0">
      {user && (
        <UserModal
          user={user}
          show={showUserModal}
          onHide={() => setShowUserModal(false)}
        />
      )}

      <SidebarWrapper show={show} handleClose={() => setShow(false)} />
      <div className="main w-100">
        <div className="main-header fixed-top bg-primary py-2 w-100 d-flex justify-content-between align-items-center">
          <div className="flex mx-3">
            <img
              style={{ cursor: "pointer" }}
              onClick={() => setShow(true)}
              src="./assets/images/Vector.png"
              alt=""
            />
          </div>
          <div className="wrapper mx-3 flex">
            {user && (
              <img
                style={{ width: "40px", borderRadius: "100%" }}
                src={user.profile}
                alt=""
              />
            )}
            {user && !user.profile && (
              <img
                style={{ width: "40px", borderRadius: "100%" }}
                src="./assets/images/logo.png"
                alt=""
              />
            )}
            {user && (
              <p className="mb-0 mx-2">
                {" "}
                {user.fullName} - <b>User</b>
              </p>
            )}{" "}
            <Dropdown>
              <Dropdown.Toggle id="dropdown-basic"></Dropdown.Toggle>

              <Dropdown.Menu>
                <Dropdown.Item onClick={() => setShowUserModal(true)}>
                  Profile
                </Dropdown.Item>
                <Dropdown.Item onClick={handleLogout}>Logout</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>

        <div className="main-content px-3" style={{ marginTop: "100px" }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default LayoutUser;
