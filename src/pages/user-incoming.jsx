import {
  FaSearch,
  FaFile,
  FaTrash,
  FaEye,
  FaDownload,
  FaMap,
  FaBell,
  FaSuitcase,
  FaIntercom,
  FaInbox,
  FaCaretRight,
  FaFacebookMessenger,
  FaCheck,
} from "react-icons/fa";
import ListGroup from "react-bootstrap/ListGroup";
import Badge from "react-bootstrap/Badge";
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import {
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { auth, db, storage } from "../../firebase";
import BounceLoader from "react-spinners/BounceLoader";
import Dropdown from "react-bootstrap/Dropdown";

import { useEffect, useRef, useState } from "react";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { toast } from "react-toastify";
import { createUserWithEmailAndPassword } from "firebase/auth";
import UserLayout from "../layout/layoutUser";
import ViewModal from "../components/viewModal";
import Offcanvas from "react-bootstrap/Offcanvas";
import PlaceHolder from "../components/placeholder";
import moment from "moment";
import Routing from "../components/routing";

const userCollectionRef = collection(db, "users");
const messagesCollectionRef = collection(db, "messages");
const incomingExternalRef = collection(db, "incoming-external");

const UserIncoming = () => {
  const [modalShow, setModalShow] = useState(false);
  const [messages, setMessages] = useState([]);
  const [externalMessages, setExternalMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentMessage, setCurrentMessage] = useState(null);
  const [showRouting, setShowRouting] = useState(false);
  const [urgent, setUrgent] = useState(false);
  const [urgentFiles, setUrgentFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState("internal");
  const [composeModalOpen, setComposeModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("a-z");
  const [currentClassification, setCurrentClassification] = useState("");
  const [classificationData, setClassificationData] = useState([]);
  const [subClassificationData, setSubClassificationData] = useState([]);
  const [actionData, setActionData] = useState([]);

  const handleSeen = async (message) => {
    const isAll = message.reciever == message.sender;
    const seener = getUser(auth.currentUser.uid).fullName;
    if (isAll) {
      const docRef = collection(
        db,
        "routing",
        message.id,
        "sendAll",
        "seeners",
        "AllSeeners"
      );
      addDoc(docRef, {
        createdAt: serverTimestamp(),
        message: message,
        status: "Seen",
        seener: seener,
      });
    } else {
      const docRef = doc(db, "routing", message.id, message.id, message.id);
      const res = await getDoc(docRef);
      if (!res.exists()) {
        setDoc(docRef, {
          createdAt: serverTimestamp(),
          message: message,
          status: "Seen",
          seener: seener,
        });
      }
    }
  };

  const sortData = () => {
    const sortedData = [...messages].sort((a, b) => {
      if (sort === "a-z") {
        return a.subject.localeCompare(b.subject);
      } else {
        return b.subject.localeCompare(a.subject);
      }
    });

    const sortedDataExternal = [...externalMessages].sort((a, b) => {
      if (sort === "a-z") {
        return a.subject.localeCompare(b.subject);
      } else {
        return b.subject.localeCompare(a.subject);
      }
    });

    setMessages(sortedData);
    setExternalMessages(sortedDataExternal);
  };

  useEffect(() => {
    sortData();
  }, [sort]);

  function UrgentModal(props) {
    const urgentFiles = props.urgentFiles;
    return (
      <Modal
        {...props}
        size="md"
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header closeButton className="bg-danger">
          <Modal.Title id="contained-modal-title-vcenter"></Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <FaBell size={50} color={"gray"} />
          <h3 className="fw-bold">You have an urgent message!</h3>
          <p className="fw-italic">
            The documents below needs your imediate response, please send a
            response before the deadline
          </p>
          {urgentFiles && (
            <Table bordered variant="white">
              <thead>
                <tr>
                  <th>DocID</th>
                  <th>Subject</th>
                  <th>File Name</th>
                  <th>Deadline</th>
                </tr>
              </thead>
              <tbody>
                {urgentFiles.map((message) => {
                  return (
                    <tr key={message.code}>
                      <td>
                        <div className="flex">
                          <FaFile />
                          {message.code}
                        </div>
                      </td>
                      <td>{message.subject}</td>
                      <td
                        style={{
                          textDecoration: "underline",
                          cursor: "pointer",
                        }}
                        className="text-dark fw-bold"
                        onClick={() => {
                          setCurrentMessage(message);
                          setModalShow(true);
                          setUrgent(false);
                          handleSeen(message);
                        }}
                      >
                        {message.fileName}
                      </td>
                      <td>{message.dueDate}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={props.onHide}>Close</Button>
        </Modal.Footer>
      </Modal>
    );
  }

  function ComposeModal(props) {
    const [code, setCode] = useState("");
    const [sender, setSender] = useState("");
    const [reciever, setReciever] = useState(props.currentUser.uid);
    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");
    const [prioritization, setPrioritization] = useState("");
    const [classification, setClassification] = useState("");
    const [subClassification, setSubClassification] = useState("");
    const [action, setAction] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [deliverType, setDeliverType] = useState("");
    const [documentFlow, setDocumentFlow] = useState("External");
    const [attachmentDetail, setAttachmentDetail] = useState("");
    const [file, setFile] = useState("");
    const [loading, setLoading] = useState(false);

    const generateRandomCode = () => {
      const min = 1000;
      const max = 99999;
      const code = Math.floor(Math.random() * (max - min + 1)) + min;
      setCode(code.toString());
    };

    const validateForm = () => {
      // console.log("Code:", code);
      // console.log("Sender:", sender);
      // console.log("Receiver:", reciever);
      // console.log("Subject:", subject);
      // console.log("Description:", description);
      // console.log("Prioritization:", prioritization);
      // console.log("Classification:", classification);
      // console.log("Subclassification:", subClassification);
      // console.log("Action:", action);
      // console.log("Due Date:", dueDate);
      // console.log("Deliver Type:", deliverType);
      // console.log("Document Flow:", documentFlow);
      // console.log("Attachment Detail:", attachmentDetail);
      // console.log("File:", file);
      if (
        code &&
        sender &&
        subject &&
        prioritization &&
        classification &&
        subClassification &&
        action &&
        // deliverType &&
        documentFlow &&
        attachmentDetail &&
        file
      ) {
        return true;
      } else {
        return false;
      }
    };

    function ConfirmationModal() {
      const [show, setShow] = useState(false);

      const handleClose = () => setShow(false);

      return (
        <>
          <Button
            variant="primary"
            onClick={() => {
              if (validateForm()) {
                setShow(true);
              } else {
                toast.error("Please fill up the form completely");
              }
            }}
          >
            Upload Document
          </Button>

          <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
              <Modal.Title>Confirmation</Modal.Title>
            </Modal.Header>
            <Modal.Body className="flex flex-column">
              <img src="./assets/images/game-icons_confirmed.png" alt="" />
              Proceed to send document?
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleUpload}>
                Confirm
              </Button>
            </Modal.Footer>
          </Modal>
        </>
      );
    }

    const handleSubmit = (fileUrl) => {
      try {
        const dataObject = {
          code: code || null,
          sender: sender || null,
          reciever: props.currentUser.uid || null,
          subject: subject || null,
          description: description || null,
          prioritization: prioritization || null,
          date: serverTimestamp(),
          classification: classification || null,
          subClassification: subClassification || null,
          action: action || null,
          dueDate: dueDate || null,
          // deliverType: deliverType || null,
          documentFlow: documentFlow || null,
          attachmentDetail: attachmentDetail || null,
          fileUrl: fileUrl || null,
          fileName: file.name,
          status: "Received",
          createdAt: serverTimestamp(),
          isSendToALl: props.currentUser.uid === reciever,
        };
        addDoc(incomingExternalRef, dataObject).then(() => {
          setComposeModalOpen(false);
          toast.success("Your message is succesfully sent!");
        });
      } catch (error) {
        toast.error(error.message);
      }
    };

    const handleUpload = async () => {
      setLoading(true);
      if (file) {
        const storageRef = ref(storage, `uploads/${file.name}`);
        uploadBytes(storageRef, file).then((snapshot) => {
          getDownloadURL(storageRef)
            .then((url) => {
              if (url) {
                handleSubmit(url);
              }
            })
            .catch((error) => {
              console.error("Error getting download URL:", error);
            });
        });
      } else {
        console.warn("No file selected for upload");
      }
    };

    return (
      <Modal
        {...props}
        size="xl"
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-vcenter">Compose</Modal.Title>
        </Modal.Header>
        {loading ? (
          <div className="flex flex-column my-5">
            <BounceLoader size={150} color="#36d7b7" />
            <h5>Sending message, please wait...</h5>
          </div>
        ) : (
          <Modal.Body>
            <div className="title bg-primary w-100">
              <h5 className="text-white mx-3 p-2 my-3">Document Details</h5>
            </div>
            <Form.Label>Document Code</Form.Label>

            <Form.Group
              className="mb-3 flex"
              controlId="exampleForm.ControlInput1"
            >
              <Form.Control
                value={code}
                type="text"
                placeholder="Document Code"
              />
              <Button onClick={generateRandomCode}>Generate</Button>
            </Form.Group>
            <Form.Label>Sender</Form.Label>
            <Form.Control
              onChange={(e) => setSender(e.target.value)}
              type="text"
              placeholder="Sender"
            />

            <Form.Group
              onChange={(e) => setSubject(e.target.value)}
              className="mb-3"
              controlId="exampleForm.ControlInput1"
            >
              <Form.Label>Subject</Form.Label>
              <Form.Control type="email" />
            </Form.Group>
            <Form.Group
              className="mb-3"
              controlId="exampleForm.ControlTextarea1"
            >
              <Form.Label>{"Description (Optional)"}</Form.Label>
              <Form.Control
                onChange={(e) => setDescription(e.target.value)}
                as="textarea"
                rows={3}
              />
            </Form.Group>
            <div className="row">
              <div className="col-lg-6">
                <Form.Label>Prioritization</Form.Label>
                <Form.Select
                  onChange={(e) => setPrioritization(e.target.value)}
                  className="mb-3"
                >
                  <option>Please select an option</option>
                  <option value="urgent">Urgent</option>
                  <option value="usual">Usual</option>
                </Form.Select>
              </div>

              <div className="col-lg-6">
                <Form.Label>Classification</Form.Label>
                <Form.Select
                  onChange={(e) => setClassification(e.target.value)}
                  className="mb-3"
                >
                  <option>Please select an option</option>
                  {classificationData.map((value) => {
                    return <option value={value.value}>{value.value}</option>;
                  })}
                </Form.Select>
              </div>
              <div className="col-lg-6">
                <Form.Label>Sub Classification</Form.Label>
                <Form.Select
                  onChange={(e) => setSubClassification(e.target.value)}
                  className="mb-3"
                >
                  <option>Please select an option</option>
                  {subClassificationData.map((value) => {
                    return <option value={value.value}>{value.value}</option>;
                  })}
                </Form.Select>
              </div>
              <div className="col-lg-6">
                <Form.Label>Action</Form.Label>
                <Form.Select
                  onChange={(e) => setAction(e.target.value)}
                  className="mb-3"
                >
                  <option>Please select an option</option>
                  {actionData.map((value) => {
                    return <option value={value.value}>{value.value}</option>;
                  })}
                </Form.Select>
              </div>
              <div className="col-lg-6">
                <Form.Label>Due Date (Optional)</Form.Label>
                <Form.Control
                  onChange={(e) => setDueDate(e.target.value)}
                  type="date"
                />
              </div>
              {/* <div className="col-lg-6">
                <Form.Label>Deliver Type</Form.Label>

                <Form.Select
                  onChange={(e) => setDeliverType(e.target.value)}
                  className="mb-3"
                >
                  <option>Please select an option</option>
                  <option value="Through DMS">Through DMS</option>
                  <option value="Hand-over">Hand-over</option>
                  <option value="Combination">Combination</option>
                </Form.Select>
              </div> */}
              <div className="col-lg-6">
                <Form.Label>Document Flow</Form.Label>

                <Form.Control
                  type="text"
                  onChange={(e) => setDocumentFlow(e.target.value)}
                  className="mb-3"
                  defaultValue={documentFlow}
                  readOnly
                />
              </div>
            </div>
            <div className="title bg-primary w-100">
              <h5 className="text-white mx-3 p-2 my-3">Attachments</h5>
            </div>
            <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
              <Form.Label>Attachment Details</Form.Label>
              <Form.Control
                onChange={(e) => setAttachmentDetail(e.target.value)}
                type="text"
              />
              <Form.Group controlId="formFile" className="mb-3">
                <Form.Label>Choose File</Form.Label>
                <Form.Control
                  onChange={(e) => setFile(e.target.files[0])}
                  type="file"
                  accept=".pdf,.docx"
                />
              </Form.Group>
            </Form.Group>
          </Modal.Body>
        )}

        <Modal.Footer>
          <ConfirmationModal />
        </Modal.Footer>
      </Modal>
    );
  }

  function DropdownAction({ message }) {
    const downloadFIle = () => {
      const fileUrl = message.fileUrl;
      const link = document.createElement("a");
      link.href = fileUrl;
      link.target = "_blank";
      link.download = "downloaded_file";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const handleDelete = () => {
      const docRef = doc(db, "incoming", message.id);
      deleteDoc(docRef).then(() => toast.success("Successfully Deleted!"));
    };

    return (
      <Dropdown>
        <Dropdown.Toggle variant="secondary" id="dropdown-basic">
          <img src="./assets/images/pepicons-pencil_dots-y.png" alt="" />
        </Dropdown.Toggle>

        <Dropdown.Menu>
          <Dropdown.Item
            onClick={() => {
              setModalShow(true);
              setCurrentMessage(message);
              handleSeen(message);
            }}
          >
            View Detail <FaEye />
          </Dropdown.Item>
          <Dropdown.Item onClick={downloadFIle}>
            Download <FaDownload />
          </Dropdown.Item>

          <Dropdown.Item
            onClick={() => {
              setCurrentMessage(message);
              setShowRouting(true);
            }}
          >
            View Routing <FaMap />
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    );
  }

  function DropdownActionExternal({ message }) {
    const downloadFIle = () => {
      const fileUrl = message.fileUrl;
      const link = document.createElement("a");
      link.href = fileUrl;
      link.target = "_blank";
      link.download = "downloaded_file";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const handleDelete = () => {
      const docRef = doc(db, "incoming-external", message.id);
      deleteDoc(docRef).then(() => toast.success("Successfully Deleted!"));
    };

    return (
      <Dropdown>
        <Dropdown.Toggle variant="secondary" id="dropdown-basic">
          <img src="./assets/images/pepicons-pencil_dots-y.png" alt="" />
        </Dropdown.Toggle>

        <Dropdown.Menu>
          <Dropdown.Item onClick={downloadFIle}>
            Download <FaDownload />
          </Dropdown.Item>
          <Dropdown.Item onClick={handleDelete}>
            Delete <FaTrash />
          </Dropdown.Item>

          {/* <Dropdown.Item
            onClick={() => {
              setCurrentMessage(message);
              setShowRouting(true);
            }}
          >
            View Routing <FaMap />
          </Dropdown.Item> */}
        </Dropdown.Menu>
      </Dropdown>
    );
  }

  const fetchData = async () => {
    setLoading(true);
    const snapshot = await getDocs(userCollectionRef);
    const output = snapshot.docs.map((doc) => {
      return { id: doc.id, ...doc.data() };
    });

    setUsers(output);

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

    const q = query(messagesCollectionRef, orderBy("createdAt", "desc"));

    onSnapshot(
      q,
      (querySnapshot) => {
        const messages = [];
        const urgents = [];
        querySnapshot.forEach((doc) => {
          const message = { ...doc.data(), id: doc.id };
          if (
            message.reciever == auth.currentUser.uid ||
            message.sender == message.reciever
          ) {
            messages.push(message);
            if (
              message.prioritization == "urgent" &&
              message.status == "Pending"
            ) {
              urgents.push(message);
            }
          }
        });
        if (urgents.length >= 1) {
          setUrgent(true);
        }
        setUrgentFiles(urgents);
        setMessages(messages);
      },
      (error) => {
        console.error("Error listening to collection:", error);
      }
    );

    const q2 = query(incomingExternalRef, orderBy("createdAt", "desc"));

    onSnapshot(q2, (snapshot) => {
      const messages = [];
      snapshot.docs.forEach((doc) => {
        const message = { ...doc.data(), id: doc.id };
        if (message.reciever === auth.currentUser.uid) {
          messages.push(message);
        }
      });
      setExternalMessages(messages);
    });

    setLoading(false);
  };

  const getUser = (id) => {
    const user = users.filter((user) => {
      if (user.id === id) {
        return user;
      }
    });
    return user[0] ? user[0] : { fullName: "Deleted User" };
  };

  function toTitleCase(str) {
    return str.replace(/\w\S*/g, function (txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }

  useEffect(() => {
    fetchData();
  }, []);

  const filteredMessages = messages.filter((message) => {
    const sender = getUser(message.sender);
    const reciever = getUser(message.reciever);
    if (
      message.code.toLowerCase().startsWith(search.toLowerCase()) ||
      message.fileName.toLowerCase().startsWith(search.toLowerCase()) ||
      sender.fullName.toLowerCase().startsWith(search.toLowerCase()) ||
      reciever.fullName.toLowerCase().startsWith(search.toLowerCase()) ||
      message.subject.toLowerCase().startsWith(search.toLocaleLowerCase())
    ) {
      return message;
    }
  });

  const filteredExternalMessages = externalMessages.filter((message) => {
    const reciever = getUser(message.reciever);
    if (
      message.code.toLowerCase().startsWith(search.toLowerCase()) ||
      message.fileName.toLowerCase().startsWith(search.toLowerCase()) ||
      reciever.fullName.toLowerCase().startsWith(search.toLowerCase()) ||
      message.subject.toLowerCase().startsWith(search.toLocaleLowerCase())
    ) {
      return message;
    }
  });

  const classificationFilteredInternal = filteredMessages.filter((message) => {
    if (currentClassification == "") {
      return message;
    }
    if (message.classification == currentClassification) {
      return message;
    }
  });
  const classificationFilteredExternal = filteredExternalMessages.filter(
    (message) => {
      if (currentClassification == "") {
        return message;
      }
      if (message.classification == currentClassification) {
        return message;
      }
    }
  );

  return (
    <UserLayout>
      {currentMessage && (
        <Routing
          currentMessage={currentMessage}
          showRouting={showRouting}
          handleCloseRouting={() => setShowRouting(false)}
          placement={"end"}
          name={"end"}
        />
      )}

      {currentMessage && (
        <ViewModal
          getUser={getUser}
          currentMessage={currentMessage}
          closeModal={() => setModalShow(false)}
          showModal={modalShow}
        />
      )}

      {messages && (
        <UrgentModal
          show={urgent}
          onHide={() => setUrgent(false)}
          urgentFiles={urgentFiles}
        />
      )}

      {auth.currentUser && users && (
        <ComposeModal
          show={composeModalOpen}
          onHide={() => setComposeModalOpen(false)}
          currentUser={auth.currentUser}
          users={users}
        />
      )}

      <div className="dashboard">
        <div className="dashboard-content mx-3 mt-3">
          <div className="row">
            <div className="wrapper col-lg-8">
              <h2 className="fw-bold my-3 mx-2">
                Incoming Documents
                <FaFacebookMessenger className="mx-2" />
              </h2>
              <div
                className="bg-info mx-2 mb-3"
                style={{ width: "200px", height: "10px", borderRadius: 20 }}
              ></div>
            </div>
            {currentPage == "external" && (
              <div className="col-lg-4 flex justify-content-end">
                <img
                  style={{ width: "150px", cursor: "pointer" }}
                  onClick={() => setComposeModalOpen(true)}
                  className="mx-3"
                  src="./assets/images/Group 8779.png"
                  alt=""
                />
              </div>
            )}
          </div>
          <div className="row">
            <div className="col-lg-4 mx-2  flex display-flex">
              <ListGroup horizontal>
                <ListGroup.Item
                  className={`${
                    currentPage == "internal" ? "bg-info text-white" : ""
                  } px-5 fw-bold`}
                  onClick={() => setCurrentPage("internal")}
                >
                  Internal
                </ListGroup.Item>
                <ListGroup.Item
                  className={`${
                    currentPage == "external" ? "bg-info text-white" : ""
                  } px-5 fw-bold`}
                  onClick={() => setCurrentPage("external")}
                >
                  External
                </ListGroup.Item>
                
              </ListGroup>
                <ListGroup className="col-lg-6 p-0 m-0">
                  <ListGroup.Item style={{ border: "none" }}>
                    <Form.Select
                      aria-label="Default select example"
                      onChange={(e) => setCurrentClassification(e.target.value)}
                    >
                      <option key={0} value={""}>
                        Select Classification
                      </option>
                      {classificationData.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.value}
                        </option>
                      ))}
                    </Form.Select>
                  </ListGroup.Item>
                </ListGroup>
            </div>
            
            <div className="flex display-flex  col-2">
              <Button
                className="mx-0 mx-3 my-3"
                onClick={() => {
                  if (sort == "a-z") {
                    setSort("z-a");
                  } else {
                    setSort("a-z");
                  }
                }}
              >
                Sort {sort}
              </Button>
            </div>
            <div className="flex justify-content-end col ">
              <div className="search flex w-100 ms-auto">
                <input
                  onChange={(e) => setSearch(e.target.value)}
                  type="text"
                  placeholder="Search docID, name, etc..."
                  className="form form-control bg-secondary mx-2"
                />
                <FaSearch />
              </div>
            </div>
          </div>
          {loading && <PlaceHolder />}

          {currentPage == "internal" ? (
            <Table responsive="md" bordered variant="white">
              <thead>
                <tr>
                  <th>DocID</th>
                  <th>Subject</th>
                  <th>File Name</th>
                  <th>Sender</th>
                  <th>Required Action</th>
                  <th>Date </th>
                  <th>Prioritization</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {classificationFilteredInternal.map((message) => {
                  return (
                    <tr key={message.code}>
                      <td>
                        <div className="flex">
                          <FaFile />
                          {message.code}
                        </div>
                      </td>
                      <td>{message.subject}</td>
                      <td
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          setCurrentMessage(message);
                          setModalShow(true);
                          handleSeen(message);
                        }}
                      >
                        <div
                          style={{ textDecoration: "underline" }}
                          className="text-dark fw-bold"
                        >
                          {message.fileName}
                        </div>
                      </td>
                      <td>
                        {getUser(message.sender).fullName} -
                        <b> {getUser(message.sender).position}</b>
                      </td>
                      <td>{message.action}</td>

                      {message.date && (
                        <td>{moment(message.date.toDate()).format("LLL")}</td>
                      )}
                      <td>
                        <div className="flex">
                          {" "}
                          <Badge
                            bg={
                              message.prioritization == "urgent"
                                ? "danger"
                                : "info"
                            }
                            className="text-white p-2"
                          >
                            {toTitleCase(message.prioritization)}
                          </Badge>{" "}
                        </div>
                      </td>
                      <td>
                        <div className="flex">
                          {message.status === "Received" && (
                            <Badge bg="success" className="text-white p-2">
                              {message.status}
                            </Badge>
                          )}
                          {message.status === "Pending" && (
                            <Badge bg="info" className="text-white p-2">
                              {message.status}
                            </Badge>
                          )}
                          {message.status === "Rejected" && (
                            <Badge bg="danger" className="text-white p-2">
                              {message.status}
                            </Badge>
                          )}
                          {message.status === "In Progress" && (
                            <Badge bg="warning" className="text-black p-2">
                              {message.status}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="flex">
                          <DropdownAction message={message} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          ) : (
            <Table responsive="md" bordered variant="white">
              <thead>
                <tr>
                  <th>DocID</th>
                  <th>Subject</th>
                  <th>File Name</th>
                  <th>Sender</th>
                  <th>Required Action</th>
                  <th>Date </th>
                  <th>Prioritization</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {classificationFilteredExternal.map((message) => {
                  return (
                    <tr key={message.code}>
                      <td>
                        <div className="flex">
                          <FaFile />
                          {message.code}
                        </div>
                      </td>
                      <td>{message.subject}</td>
                      <td
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          setCurrentMessage(message);
                          setModalShow(true);
                          handleSeen(message);
                        }}
                      >
                        <div
                          style={{ textDecoration: "underline" }}
                          className="text-dark fw-bold"
                        >
                          {message.fileName}
                        </div>
                      </td>
                      <td>{message.sender} -</td>
                      <td>{message.action}</td>
                      {message.date && (
                        <td>{moment(message.date.toDate()).format("LLL")}</td>
                      )}

                      <td>
                        <div className="flex">
                          {" "}
                          <Badge
                            bg={
                              message.prioritization == "urgent"
                                ? "danger"
                                : "info"
                            }
                            className="text-white p-2"
                          >
                            {toTitleCase(message.prioritization)}
                          </Badge>{" "}
                        </div>
                      </td>
                      <td>
                        <div className="flex">
                          {message.status === "Received" && (
                            <Badge bg="success" className="text-white p-2">
                              {message.status}
                            </Badge>
                          )}
                          {message.status === "Pending" && (
                            <Badge bg="info" className="text-white p-2">
                              {message.status}
                            </Badge>
                          )}
                          {message.status === "Rejected" && (
                            <Badge bg="danger" className="text-white p-2">
                              {message.status}
                            </Badge>
                          )}
                          {message.status === "In Progress" && (
                            <Badge bg="warning" className="text-black p-2">
                              {message.status}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="flex">
                          <DropdownActionExternal message={message} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </div>
      </div>
    </UserLayout>
  );
};

export default UserIncoming;
