import { useEffect, useState } from "react";
import Layout from "../layout/layout";
import {
  Button,
  Dropdown,
  Modal,
  Table,
  Form,
  Badge,
  ListGroup,
} from "react-bootstrap";
import {
  FaDownload,
  FaEdit,
  FaEye,
  FaFile,
  FaSuitcase,
  FaTimes,
  FaToolbox,
  FaTrash,
  FaWrench,
} from "react-icons/fa";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
  getDocs,
  where,
  query,
} from "firebase/firestore";
import { db } from "../../firebase";
import { toast } from "react-toastify";
import { setDoc } from "firebase/firestore";

function DeleteModal({ showModal, handleClose, handleDelete }) {
  return (
    <Modal size="md" centered show={showModal} onHide={handleClose}>
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
  const [editModal, setEditModal] = useState(false);

  const handleDelete = () => {
    try {
      const docRef = doc(db, "offices", message.id);
      deleteDoc(docRef).then(() => {
        toast.success("Successfully Deleted!");
        // Close the modal after successful deletion
        setDeleteModal(false);
      });
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleEdit = async (updatedOffice) => {
    try {
      toast.success("Office information updated successfully!");
      const officeDoc = doc(db, "offices", message.id);
      await setDoc(officeDoc, updatedOffice);
    } catch (error) {
      toast.error("Error updating office information.");
      console.error(error);
    }
  };

  function EditModal({ show, onHide, office }) {
    const officeCollection = collection(db, "offices");
    const [officeID, setOfficeID] = useState(office.officeID || "");
    const [officeName, setOfficeName] = useState(office.officeName || "");
    const [officeCode, setOfficeCode] = useState(office.officeCode || "");
    const [status, setStatus] = useState(office.status || "");

    const [errors, setErrors] = useState({
      officeID: "",
      officeName: "",
      officeCode: "",
      status: "",
    });

    const checkDuplicateField = async (field, value) => {
      try {
        const querySnapshot = await getDocs(
          query(officeCollection, where(field, "==", value))
        );
        return !querySnapshot.empty;
      } catch (error) {
        console.error("Error checking duplicate field:", error);
        return false; // Return false in case of an error
      }
    };

    const validateForm = async () => {
      let isValid = true;
      const newErrors = {};

      // Validate officeName
      if (!officeName.trim()) {
        newErrors.officeName = "Office name must not be empty.";
        isValid = false;
      } else {
        // Check if officeName already exists
        const nameExists = await checkDuplicateField("officeName", officeName);
        if (nameExists && office.officeName !== officeName) {
          // Exclude the current data from the duplicate check during editing
          newErrors.officeName = "Office name already exists.";
          isValid = false;
        }
      }

      // Validate officeCode
      if (!officeCode.trim()) {
        newErrors.officeCode = "Office code must not be empty.";
        isValid = false;
      } else {
        // Check if officeCode already exists
        const codeExists = await checkDuplicateField("officeCode", officeCode);
        if (codeExists && office.officeCode !== officeCode) {
          // Exclude the current data from the duplicate check during editing
          newErrors.officeCode = "Office code already exists.";
          isValid = false;
        }
      }

      // Validate officeID
      const isValidOfficeID = /^\d{5}$/.test(officeID);
      if (!isValidOfficeID) {
        newErrors.officeID =
          "Office ID must be a numeric value with a length of 5 characters.";
        isValid = false;
      } else {
        // Check if officeID already exists
        const idExists = await checkDuplicateField("officeID", officeID);
        if (idExists && office.officeID !== officeID) {
          // Exclude the current data from the duplicate check during editing
          newErrors.officeID = "Office ID already exists.";
          isValid = false;
        }
      }

      // Validate status
      if (!status.trim() || status === "Please select an option") {
        newErrors.status = "Please select office status.";
        isValid = false;
      }

      setErrors((prevErrors) => ({
        ...prevErrors,
        ...newErrors,
      }));

      return isValid;
    };

    const handleSubmit = async () => {
      try {
        // Validate the form
        if (!(await validateForm())) {
          return;
        }

        const updatedOffice = {
          officeID,
          officeName,
          officeCode,
          status,
        };

        try {
          // Use the doc function to construct the document reference
          const docRef = doc(db, "offices", message.id);

          onHide();
          // Update the Firestore document with the new data
          await updateDoc(docRef, updatedOffice);

          // Pass the updated office object to the handleEdit function
          handleEdit(updatedOffice);

          // Close the modal
        } catch (error) {
          console.error("Error updating office:", error);
        }

        // Rest of the code for form submission
      } catch (error) {
        toast.error(error.message);
      }
    };

    return (
      <Modal show={show} onHide={onHide} centered size="md">
        <Modal.Header className="bg-primary">
          <h5 className="fw-bold text-white">{"Edit Office"}</h5>
        </Modal.Header>
        <Modal.Body>
          <div className="wrapper">
            <label htmlFor="officeID">Office ID</label>
            <Form.Control
              type="text"
              id="officeID"
              className={`form-control bg-secondary ${
                errors.officeID ? "is-invalid" : ""
              }`}
              value={officeID}
              onChange={(e) => {
                setOfficeID(e.target.value);
                setErrors((prevErrors) => ({ ...prevErrors, officeID: "" }));
              }}
            />
            {errors.officeID && (
              <div className="invalid-feedback">{errors.officeID}</div>
            )}
          </div>
          <div className="wrapper">
            <label htmlFor="officeName">Office Name</label>
            <Form.Control
              type="text"
              id="officeName"
              className={`form-control bg-secondary ${
                errors.officeName && "is-invalid"
              }`}
              value={officeName}
              onChange={(e) => {
                setOfficeName(e.target.value);
                setErrors((prevErrors) => ({ ...prevErrors, officeName: "" }));
              }}
            />
            {errors.officeName && (
              <div className="invalid-feedback">{errors.officeName}</div>
            )}
          </div>
          <div className="wrapper">
            <label htmlFor="officeCode">Office Code</label>
            <Form.Control
              type="text"
              id="officeCode"
              className={`form-control bg-secondary ${
                errors.officeCode && "is-invalid"
              }`}
              value={officeCode}
              onChange={(e) => {
                setOfficeCode(e.target.value);
                setErrors((prevErrors) => ({ ...prevErrors, officeCode: "" }));
              }}
            />
            {errors.officeCode && (
              <div className="invalid-feedback">{errors.officeCode}</div>
            )}
          </div>
          <div className="wrapper">
            <label htmlFor="status">Status</label>
            <Form.Select
              id="status"
              className={`bg-secondary ${errors.status ? "is-invalid" : ""}`}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setErrors((prevErrors) => ({ ...prevErrors, status: "" }));
              }}
            >
              <option>Please select an option</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </Form.Select>
            {errors.status && (
              <div className="invalid-feedback">{errors.status}</div>
            )}
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button onClick={handleSubmit}>{"Update Office"}</Button>
        </Modal.Footer>
      </Modal>
    );
  }

  const openModal = () => setDeleteModal(true);
  const closeModal = () => setDeleteModal(false);
  const openEditModal = () => setEditModal(true);
  const closeEditModal = () => setEditModal(false);

  return (
    <div>
      <Dropdown>
        <Dropdown.Toggle variant="secondary" id="dropdown-basic">
          <img src="./assets/images/pepicons-pencil_dots-y.png" alt="" />
        </Dropdown.Toggle>

        <Dropdown.Menu>
          <Dropdown.Item onClick={openEditModal}>
            Edit <FaEdit />
          </Dropdown.Item>
          <Dropdown.Item onClick={openModal}>
            Delete <FaEdit />
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>

      {/* Delete Modal */}
      <DeleteModal
        showModal={deleteModal}
        handleClose={closeModal}
        handleDelete={handleDelete}
      />
      <EditModal show={editModal} onHide={closeEditModal} office={message} />
    </div>
  );
}

const Office = () => {
  const officeCollection = collection(db, "offices");

  const [loading, setLoading] = useState();
  const [offices, setOffices] = useState([]);
  const [officeModal, setOfficeModal] = useState(false);
  const [classificationData, setClassificationData] = useState([]);
  const [classification, setClassification] = useState("");
  const [subClassificationData, setSubClassificationData] = useState([]);
  const [subClassification, setSubClassification] = useState("");
  const [action, setAction] = useState("");
  const [actionData, setActionData] = useState([]);

  function OfficeModal(props) {
    const [officeName, setOfficeName] = useState("");
    const [officeCode, setOfficeCode] = useState("");
    const [status, setStatus] = useState("");
    const [errors, setErrors] = useState({
      officeName: "",
      officeCode: "",
      status: "",
      // Add other fields as needed
    });

    const generateRandomCode = () => {
      const min = 1000;
      const max = 99999;
      const code = Math.floor(Math.random() * (max - min + 1)) + min;
      return code;
    };

    const checkDuplicateField = async (field, value) => {
      try {
        const querySnapshot = await getDocs(
          query(officeCollection, where(field, "==", value))
        );
        return !querySnapshot.empty;
      } catch (error) {
        console.error("Error checking duplicate field:", error);
        return false; // Return false in case of an error
      }
    };

    const validateForm = async () => {
      let isValid = true;
      const newErrors = {};

      // Validate officeName
      if (!officeName.trim()) {
        newErrors.officeName = "Office name must not be empty.";
        isValid = false;
      } else {
        // Check if officeName already exists
        const nameExists = await checkDuplicateField("officeName", officeName);
        if (nameExists) {
          newErrors.officeName = "Office name already exists.";
          isValid = false;
        }
      }

      // Validate officeCode
      if (!officeCode.trim()) {
        newErrors.officeCode = "Office code must not be empty.";
        isValid = false;
      } else {
        // Check if officeCode already exists
        const codeExists = await checkDuplicateField("officeCode", officeCode);
        if (codeExists) {
          newErrors.officeCode = "Office code already exists.";
          isValid = false;
        }
      }

      // Validate status
      if (!status.trim() || status === "Please select an option") {
        newErrors.status = "Please select office status.";
        isValid = false;
      }

      setErrors((prevErrors) => ({
        ...prevErrors,
        ...newErrors,
      }));

      return isValid;
    };

    const handleSubmit = async () => {
      try {
        // Validate the form
        if (!(await validateForm())) {
          return;
        }

        const data = {
          officeID: generateRandomCode(),
          officeName: officeName,
          officeCode: officeCode,
          status: status,
        };

        // Assuming setOfficeModal is a prop passed to the component
        setOfficeModal(false);
        toast.success("Successfully added office!");
        addDoc(officeCollection, data);
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
          <h5 className="fw-bold text-white">Add Office</h5>
        </Modal.Header>
        <Modal.Body>
          <div className="wrapper">
            <label htmlFor="officeName">Office Name</label>
            <Form.Control
              type="text"
              id="officeName"
              className={`form-control bg-secondary ${
                errors.officeName ? "is-invalid" : ""
              }`}
              value={officeName}
              onChange={(e) => {
                setOfficeName(e.target.value);
                setErrors((prevErrors) => ({
                  ...prevErrors,
                  officeName: "", // Clear the error when typing
                }));
              }}
            />
            {errors.officeName && (
              <div className="invalid-feedback">{errors.officeName}</div>
            )}
          </div>
          <div className="wrapper">
            <label htmlFor="officeCode">Office Code</label>
            <Form.Control
              type="text"
              id="officeCode"
              className={`form-control bg-secondary ${
                errors.officeCode ? "is-invalid" : ""
              }`}
              value={officeCode}
              onChange={(e) => {
                setOfficeCode(e.target.value);
                setErrors((prevErrors) => ({
                  ...prevErrors,
                  officeCode: "", // Clear the error when typing
                }));
              }}
            />
            {errors.officeCode && (
              <div className="invalid-feedback">{errors.officeCode}</div>
            )}
          </div>
          <div className="wrapper">
            <label htmlFor="status">Status</label>
            <Form.Select
              id="status"
              className={`bg-secondary ${errors.status ? "is-invalid" : ""}`}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setErrors((prevErrors) => ({
                  ...prevErrors,
                  status: "", // Clear the error when typing
                }));
              }}
            >
              <option>Please select an option</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </Form.Select>{" "}
            {errors.status && (
              <div className="invalid-feedback">{errors.status}</div>
            )}
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button onClick={handleSubmit}>Add Office</Button>
        </Modal.Footer>
      </Modal>
    );
  }

  const fetchData = () => {
    onSnapshot(officeCollection, (snapshot) => {
      const output = [];
      snapshot.docs.forEach((doc) => {
        output.push({ ...doc.data(), id: doc.id });
      });
      setOffices(output);
    });

    onSnapshot(collection(db, "classification"), (snapshot) => {
      const output = [];
      snapshot.docs.forEach((doc) => {
        output.push({ ...doc.data(), id: doc.id });
      });
      setClassificationData(output);
    });
    onSnapshot(collection(db, "sub-classification"), (snapshot) => {
      const output = [];
      snapshot.docs.forEach((doc) => {
        output.push({ ...doc.data(), id: doc.id });
      });
      setSubClassificationData(output);
    });
    onSnapshot(collection(db, "action"), (snapshot) => {
      const output = [];
      snapshot.docs.forEach((doc) => {
        output.push({ ...doc.data(), id: doc.id });
      });
      setActionData(output);
    });
  };

  const handleAction = (office, status) => {
    try {
      const officeRef = doc(db, "offices", office.id);
      updateDoc(officeRef, {
        status: status,
      });
    } catch (error) {}
  };

  const addValue = async (attr, value) => {
    try {
      const col = collection(db, attr);
      await addDoc(col, { value: value });

      if (attr === "classification") {
        setClassification("");
      } else if (attr === "sub-classification") {
        setSubClassification("");
      } else if (attr === "action") {
        setAction("");
      }
    } catch (error) {
      console.error("Error adding value:", error);
    }
  };

  const handleDeleteValue = (attr, value) => {
    const docRef = doc(db, attr, value.id);
    deleteDoc(docRef);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <Layout>
      <OfficeModal show={officeModal} onHide={() => setOfficeModal(false)} />
      {loading && <PlaceHolder />}

      <div className="container-fluid">
        <div className="row">
          <div className="col-8">
            <div className="wrapper">
              <h2 className="fw-bold my-3 mx-2">
                Office Management <FaSuitcase />
              </h2>
              <div
                className="bg-info mx-2 mb-3"
                style={{ width: "200px", height: "10px", borderRadius: 20 }}
              ></div>
            </div>
          </div>
          <div className="col-4 flex">
            <Button variant="primary mb-2" onClick={() => setOfficeModal(true)}>
              <h6 className="fw-bold text-white px-3 mb-0 py-1">Add Office</h6>
            </Button>
          </div>
        </div>

        <Table responsive="md" bordered hover variant="white">
          <thead>
            <tr>
              <th>No. </th>
              <th>Office ID</th>
              <th>Office Name</th>
              <th>Office Code</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {offices.map((message, index) => {
              return (
                <tr key={index + 1}>
                  <td>
                    <div>{index + 1}</div>
                  </td>
                  <td>
                    <div>{message.officeID}</div>
                  </td>
                  <td>{message.officeName}</td>

                  <td>{message.officeCode}</td>
                  <td>
                    <div className="flex">
                      <ListGroup horizontal>
                        <ListGroup.Item>
                          <Button
                            onClick={() => handleAction(message, "Active")}
                            className={`${
                              message.status == "Active"
                                ? "bg-success text-white"
                                : "bg-secondary"
                            }`}
                          >
                            Active
                          </Button>
                        </ListGroup.Item>
                        <ListGroup.Item>
                          {" "}
                          <Button
                            onClick={() => handleAction(message, "Inactive")}
                            className={`${
                              message.status == "Inactive"
                                ? "bg-danger text-white"
                                : "bg-secondary"
                            }`}
                          >
                            Inactive
                          </Button>
                        </ListGroup.Item>
                      </ListGroup>
                    </div>

                    {/* <Badge
                    className={
                      message.status == "Active"
                        ? "bg-success p-2 flex"
                        : "bg-danger p-2 flex"
                    }
                  >
                    {message.status}
                  </Badge> */}
                  </td>

                  <td className="flex">
                    <DropdownAction message={message} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>
      <div className="container-fluid">
        <div className="wrapper">
          <h2 className="fw-bold my-3 mx-2">
            Message Utilities <FaWrench />
          </h2>
          <div
            className="bg-info mx-2 mb-3"
            style={{ width: "200px", height: "10px", borderRadius: 20 }}
          ></div>
        </div>
        <div className="row">
          <div className="col-12">
            <div className="shadow m-3 p-3">
              <h5 className="fw-bold">Classification</h5>
              <div className="content mt-3">
                <div className="row">
                  {classificationData &&
                    classificationData.map((value) => {
                      return (
                        <div key={value} className="col-lg-2 my-2">
                          <div className="w-100 d-flex justify-content-end align-items-center">
                            <FaTimes
                              onClick={() =>
                                handleDeleteValue("classification", value)
                              }
                              style={{
                                marginBottom: "-10px",
                                cursor: "pointer",
                              }}
                            />
                          </div>
                          <div className="mx-1 border border-primary py-1 text-center rounded">
                            <span className="mx-2 my-2  p-1">
                              {value.value}
                            </span>{" "}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
              <div className="row mt-3">
                <div className="col-lg-6">
                  <input
                    name="classification"
                    onChange={(e) => setClassification(e.target.value)}
                    type="text"
                    className="form-control mx-3"
                    value={classification}
                  />
                </div>
                <div className="col-lg-6">
                  <Button
                    onClick={() => addValue("classification", classification)}
                  >
                    Add Value
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div className="col-12">
            <div className="shadow m-3 p-3">
              <h5 className="fw-bold">Sub Classification</h5>
              <div className="content mt-3">
                <div className="row">
                  {subClassificationData &&
                    subClassificationData.map((value) => {
                      return (
                        <div key={value} className="col-lg-2 my-2">
                          <div className="w-100 d-flex justify-content-end align-items-center">
                            <FaTimes
                              onClick={() =>
                                handleDeleteValue("sub-classification", value)
                              }
                              style={{
                                marginBottom: "-10px",
                                cursor: "pointer",
                              }}
                            />
                          </div>
                          <div className="mx-1 border border-primary py-1 text-center rounded">
                            <span className="mx-2 my-2  p-1">
                              {value.value}
                            </span>{" "}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
              <div className="row mt-3">
                <div className="col-lg-6">
                  <input
                    name="sub-classification"
                    onChange={(e) => setSubClassification(e.target.value)}
                    type="text"
                    className="form-control mx-3"
                    value={subClassification}
                  />
                </div>
                <div className="col-lg-6">
                  <Button
                    onClick={() =>
                      addValue("sub-classification", subClassification)
                    }
                  >
                    Add Value
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div className="col-12">
            <div className="shadow m-3 p-3">
              <h5 className="fw-bold">Action</h5>
              <div className="content mt-3">
                <div className="row">
                  {actionData &&
                    actionData.map((value) => {
                      return (
                        <div key={value} className="col-lg-2 my-2">
                          <div className="w-100 d-flex justify-content-end align-items-center">
                            <FaTimes
                              onClick={() => handleDeleteValue("action", value)}
                              style={{
                                marginBottom: "-10px",
                                cursor: "pointer",
                              }}
                            />
                          </div>
                          <div className="mx-1 border border-primary py-1 text-center rounded">
                            <span className="mx-2 my-2  p-1">
                              {value.value}
                            </span>{" "}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
              <div className="row mt-3">
                <div className="col-lg-6">
                  <input
                    name="action"
                    onChange={(e) => setAction(e.target.value)}
                    type="text"
                    className="form-control mx-3"
                    value={action}
                  />
                </div>
                <div className="col-lg-6">
                  <Button onClick={() => addValue("action", action)}>
                    Add Value
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Office;
