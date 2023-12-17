import { useEffect, useState } from "react";
import Layout from "../layout/layout";
import { Button, Dropdown, Modal, Table, Form } from "react-bootstrap";
import {
  FaDownload,
  FaEye,
  FaFile,
  FaSuitcase,
  FaTrash,
  FaUser,
} from "react-icons/fa";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "../../firebase";
import { toast } from "react-toastify";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
} from "firebase/auth";

function DeleteModal({ showModal, handleClose, handleDelete }) {
  return (
    <Modal show={showModal} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Delete Confirmation</Modal.Title>
      </Modal.Header>
      <Modal.Body>Are you sure you want to continue?</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleDelete}>
          Delete
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

function DropdownAction({ message }) {
  const [deleteModal, setDeleteModal] = useState(false);

  const handleDelete = async () => {
    try {
      const response = await fetch("http://localhost:5137/deleteUser", { //http://localhost:5137/deleteUser , https://lgudms.web.app/deleteUser
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uid: message.id }), // Use message.id instead of message.uid
      });
  
      const result = await response.json();
  
      if (result.success) {
        toast.success(result.message);
        // Close the modal after successful deletion
        setDeleteModal(false);
      } else {
        toast.error(result.message);
        console.error(result); // Log the error response for debugging
      }
    } catch (error) {
      toast.error("Error deleting user.");
      console.error(result); // Log the error response for debugging
    }
  };
  

  const openModal = () => setDeleteModal(true);
  const closeModal = () => setDeleteModal(false);

  return (
    <div>
      <Dropdown>
        <Dropdown.Toggle variant="secondary" id="dropdown-basic">
          <img src="./assets/images/pepicons-pencil_dots-y.png" alt="" />
        </Dropdown.Toggle>

        <Dropdown.Menu>
          <Dropdown.Item onClick={openModal}>
            Delete <FaTrash />
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>

      {/* Delete Modal */}
      <DeleteModal
        showModal={deleteModal}
        handleClose={closeModal}
        handleDelete={handleDelete}
      />
    </div>
  );
}

const CreateUser = () => {
  const userCollection = collection(db, "users");
  const officeCollection = collection(db, "offices");

  const [loading, setLoading] = useState();
  const [users, setUsers] = useState([]);
  const [offices, setOffices] = useState([]);

  const [officeModal, setOfficeModal] = useState(false);

  function OfficeModal(props) {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [contactNumber, setContactNumber] = useState("");
    const [password, setPassword] = useState("");
    const [position, setPosition] = useState("");
    const [office, setOffice] = useState("");
    const [role, setRole] = useState("");

    const handleSubmit = async () => {
      try {
        const data = {
          fullName: fullName,
          email: email,
          phone: contactNumber,
          password: password,
          position: position,
          office: office,
          role: "user",
        };

        const result = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        if (result) {
          const userDoc = doc(db, "users", result.user.uid);
          setDoc(userDoc, data).then(() => {
            toast.success("Successfully Created User!");
          });
        }
      } catch (error) {
        toast.error(error.message);
      }
    };

    return (
      <Modal
        {...props}
        size="md"
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header className="bg-primary">
          <h5 className="fw-bold text-white">Add User</h5>
        </Modal.Header>
        <Modal.Body>
          <div className="wrapper">
            <label htmlFor="fullName">Full Name</label>
            <Form.Control
              type="text"
              id="fullName"
              className="form-control bg-secondary"
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="wrapper">
            <label htmlFor="email">Email</label>
            <Form.Control
              type="text"
              id="email"
              className="form-control bg-secondary"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="wrapper">
            <label htmlFor="contactNumber">Contact Number</label>
            <Form.Control
              type="text"
              id="contactNumber"
              className="form-control bg-secondary"
              onChange={(e) => setContactNumber(e.target.value)}
            />
          </div>
          <div className="wrapper">
            <label htmlFor="password">Password</label>
            <Form.Control
              type="password"
              id="password"
              className="form-control bg-secondary"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {/* <div className="wrapper">
            <label htmlFor="officeStatus">Role</label>
            <Form.Select
              id="officeStatus"
              className="bg-secondary"
              onChange={(e) => setRole(e.target.value)}
            >
              <option>Please select an option</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </Form.Select>{" "}
          </div> */}
          <div className="wrapper">
            <label htmlFor="position">Position</label>
            <Form.Control
              type="text"
              id="position"
              className="form-control bg-secondary"
              onChange={(e) => setPosition(e.target.value)}
            />
          </div>

          <div className="wrapper">
            <label htmlFor="officeStatus">Office</label>
            <Form.Select
              id="officeStatus"
              className="bg-secondary"
              onChange={(e) => setOffice(e.target.value)}
            >
              <option>Please select an option</option>
              {offices.map((office) => {
                return (
                  <option key={office.id} value={office.id}>
                    {office.officeName}
                  </option>
                );
              })}
            </Form.Select>{" "}
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button onClick={handleSubmit}>Create User</Button>
        </Modal.Footer>
      </Modal>
    );
  }

  const fetchData = () => {
    onSnapshot(userCollection, (snapshot) => {
      const output = [];
      snapshot.docs.forEach((doc) => {
        output.push({ ...doc.data(), id: doc.id });
      });
      setUsers(output);
    });

    onSnapshot(officeCollection, (snapshot) => {
      const output = [];
      snapshot.docs.forEach((doc) => {
        const office = { ...doc.data(), id: doc.id };
        if (office.status == "Active") {
          output.push(office);
        }
      });
      setOffices(output);
    });
  };

  const getOffice = (id) => {
    const office = offices.filter((office) => {
      if (office.id == id) {
        return office;
      }
    });
    return office[0] == undefined ? "Inactive Office" : office[0].officeName;
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <Layout>
      <OfficeModal show={officeModal} onHide={() => setOfficeModal(false)} />

      <div className="row">
        <div className="col-8">
          <div className="wrapper">
            <h2 className="fw-bold my-3 mx-2">
              User Management <FaUser />
            </h2>
            <div
              className="bg-info mx-2 mb-3"
              style={{ width: "200px", height: "10px", borderRadius: 20 }}
            ></div>
          </div>
        </div>
        <div className="col-4 flex">
          <Button variant="primary mb-2" onClick={() => setOfficeModal(true)}>
            <h6 className="fw-bold text-white px-3 mb-0 py-1">Add User</h6>
          </Button>
        </div>
      </div>

      {users && (
        <Table responsive="md" bordered hover variant="white">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Position</th>
              <th>Office</th>
              <th>Gender</th>
              <th>Role</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((message) => {
              return (
                <tr key={message.id}>
                  <td>
                    <div>{message.id}</div>
                  </td>
                  <td>{message.fullName}</td>

                  <td>{message.email}</td>
                  <td>{message.phone}</td>
                  <td>{message.position ? message.position : "N/A"}</td>
                  {offices.length >= 1 && <td>{getOffice(message.office)}</td>}

                  <td>{message.gender ? message.gender : "N/A"}</td>
                  <td>{message.role}</td>

                  <td className="flex">
                    <DropdownAction message={message} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </Layout>
  );
};

export default CreateUser;
