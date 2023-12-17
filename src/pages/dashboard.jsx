import {
  FaSearch,
  FaFile,
  FaTrash,
  FaEye,
  FaDownload,
  FaMap,
  FaFileArchive,
  FaBell,
} from "react-icons/fa";
import ListGroup from "react-bootstrap/ListGroup";
import Badge from "react-bootstrap/Badge";
import Table from "react-bootstrap/Table";
import Layout from "../layout/layout";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { FaRoute } from "react-icons/fa";
import { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { auth, db } from "../../firebase";
import { Dropdown, Form, ListGroupItem } from "react-bootstrap";
import ViewModal from "../components/viewModal";
import { toast } from "react-toastify";
import Placeholder from "react-bootstrap/Placeholder";
import PlaceHolder from "../components/placeholder";
import moment from "moment";
import Routing from "../components/routing";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sms, setsms] = useState(null);
  const [offices, setOffices] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [deleteModal, setDeleteModal] = useState(false);
  const [showRouting, setShowRouting] = useState(false);
  const [sort, setSort] = useState("a-z");
  const [urgent, setUrgent] = useState(false);
  const [urgentFiles, setUrgentFiles] = useState([]);
  const [classificationData, setClassificationData] = useState([]);
  const [currentClassification, setCurrentClassification] = useState("");

  const messagesCollectionRef = collection(db, "messages");
  const userCollectionRef = collection(db, "users");

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
        <Modal.Body
          className="text-center"
          style={{ height: "300px", overflow: "scroll" }}
        >
          <FaBell size={50} color={"gray"} />
          <h3 className="fw-bold">Urgent Messages!</h3>
          <p className="fw-italic">
            The documents below needs your imediate response, please send a
            response before the deadline
          </p>
          {urgentFiles && (
            <Table responsive bordered variant="white">
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
                          setShowViewModal(true);
                          setUrgent(false);
                          // handleSeen(message);
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

  const sortData = () => {
    const sortedData = [...messages].sort((a, b) => {
      if (sort === "a-z") {
        return a.subject.localeCompare(b.subject);
      } else {
        return b.subject.localeCompare(a.subject);
      }
    });

    setMessages(sortedData);
  };

  useEffect(() => {
    sortData();
  }, [sort]);

 /*  function DropdownAction({ message }) {
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

    const handleDelete = async () => {
      setCurrentMessage(message);
      setDeleteModal(true);
    };

    return (
      <Button
      variant="secondary"
      onClick={() => {
        setCurrentMessage(message);
        setShowRouting(true);
      }}
    >
      <FaRoute size={20} />
    </Button>
    );
  } */

  const getUser = async () => {
    const userRef = doc(db, "users", auth.currentUser.uid);
    const snapshot = await getDoc(userRef);
    setUser(snapshot.data());
  };

  const fetchData = async () => {
    setLoading(true);
    const snapshot = await getDocs(userCollectionRef);
    const output = snapshot.docs.map((doc) => {
      return { id: doc.id, ...doc.data() };
    });

    setUsers(output);

    // getDoc(doc(db, "sms", "sms")).then((doc) => {
    //   console.log(doc.data());
    // });

    onSnapshot(collection(db, "classification"), (snapshot) => {
      const output = [];
      snapshot.docs.forEach((doc) => {
        output.push({ ...doc.data(), id: doc.id });
      });
      setClassificationData(output);
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
        
        setUrgentFiles(urgents);
        setMessages(messages);
        if (urgents.length >= 1) {
          setUrgent(true);
        }
      },
      (error) => {
        console.error("Error listening to collection:", error);
      }
    );
    onSnapshot(collection(db, "offices"), (snapshot) => {
      const output = [];
      snapshot.docs.forEach((doc) => {
        const office = { ...doc.data(), id: doc.id };
        if (office.status == "Active") {
          output.push(office);
        }
      });
      setOffices(output);
    });

    setLoading(false);
  };

  const getUserData = (id) => {
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

  const allReceived = () => {
    const output = messages.filter((message) => {
      if (message.status == "Received") {
        return message;
      }
    });

    return output.length;
  };

  const allRejected = () => {
    const output = messages.filter((message) => {
      if (message.status == "Rejected") {
        return message;
      }
    });
    return output.length;
  };

  function DeleteModal() {
    const handleDelete = () => {
      const docMessage = doc(db, "messages", currentMessage.id);
      deleteDoc(docMessage).then(() => toast.success("Successfully Deleted!"));
      setDeleteModal(false);
    };
    return (
      <>
        <Modal show={deleteModal} onHide={() => setDeleteModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Delete Confirmation</Modal.Title>
          </Modal.Header>
          <Modal.Body>Are you sure you want to continue?</Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleDelete}>
              Delete
            </Button>
          </Modal.Footer>
        </Modal>
      </>
    );
  }

  useEffect(() => {
    getUser();
    fetchData();
  }, []);

  const filteredMessages = messages.filter((message) => {
    const sender = getUserData(message.sender);
    const reciever = getUserData(message.reciever);
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

  const filteredMessagesFinal = filteredMessages.filter((message) => {
    if (filter == "all") {
      return message;
    }
    if (message.status.toLowerCase() == filter.toLocaleLowerCase()) {
      return message;
    }
  });

  const classificationFiltered = filteredMessagesFinal.filter((message) => {
    if (currentClassification == "") {
      return message;
    }
    if (message.classification == currentClassification) {
      return message;
    }
  });

  return (
    <Layout>
      <div className="dashboard">
        {currentMessage && (
          <ViewModal
            getUser={getUserData}
            outgoing={true}
            dashboard={true}
            currentMessage={currentMessage}
            closeModal={() => setShowViewModal(false)}
            showModal={showViewModal}
          />
        )}

        {currentMessage && (
          <Routing
            currentMessage={currentMessage}
            showRouting={showRouting}
            handleCloseRouting={() => setShowRouting(false)}
            placement={"end"}
            name={"end"}
          />
        )}

        <DeleteModal />

        <div className="dashboard-header ">
          <div className="row">
            <div className="col-lg-12 my-3 my-lg-0">
              <div className="stats flex">
                <div className="wrapper flex mx-3">
                  <img src="./assets/images/ri_home-office-line.png" alt="" />
                  <div className="wrapper flex flex-column">
                    <p className="mb-0">Offices</p>
                    {offices && <Badge bg="primary">{offices.length}</Badge>}
                  </div>
                </div>
                <div className="wrapper flex mx-3">
                  <img
                    src="./assets/images/heroicons_users-20-solid.png"
                    alt=""
                  />
                  <div className="wrapper flex flex-column">
                    <p className="mb-0">Members</p>
                    <Badge bg="primary">{users.length}</Badge>
                  </div>
                </div>
                <div className="wrapper flex mx-3">
                  <img src="./assets/images/solar_documents-bold.png" alt="" />
                  <div className="wrapper flex flex-column">
                    <p className="mb-0">Documents</p>

                    {messages && <Badge bg="primary">{messages.length}</Badge>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="dashboard-content mx-3 mt-3">
          <div className="wrapper">
            <h2 className="fw-bold my-3 mx-2">
              Dashboard Overview <FaFile className="mx-2" />
            </h2>
            <div
              className="bg-info mx-2 mb-3"
              style={{ width: "200px", height: "10px", borderRadius: 20 }}
            ></div>
          </div>

          <div className="row">
            <div className="col-lg-6  my-2 my-lg-0">
              <ListGroup
                horizontal
                className="d-flex align-items-center justify-content-between"
              >
                <ListGroup.Item
                  className={`${filter == "all" ? "bg-secondary" : ""}`}
                  onClick={() => setFilter("all")}
                >
                  All <Badge bg="primary">{messages.length}</Badge>
                </ListGroup.Item>
                <ListGroup.Item
                  className={`${filter == "Received" ? "bg-secondary" : ""}`}
                  onClick={() => setFilter("Received")}
                >
                  Received <Badge bg="primary">{allReceived()}</Badge>
                </ListGroup.Item>
                <ListGroup.Item
                  className={`${filter == "rejected" ? "bg-secondary" : ""}`}
                  onClick={() => setFilter("rejected")}
                >
                  Rejected <Badge bg="danger">{allRejected()}</Badge>{" "}
                </ListGroup.Item>
                <ListGroup.Item style={{ border: "none" }}>
                  <Form.Select
                    aria-label="Default select example"
                    onChange={(e) => setCurrentClassification(e.target.value)}
                  >
                    <option key={0} value={""}>
                      Please select classification
                    </option>{" "}
                    {classificationData.map((item) => {
                      return (
                        <option key={item.value} value={item.value}>
                          {item.value}
                        </option>
                      );
                    })}
                  </Form.Select>
                </ListGroup.Item>
                <ListGroup.Item style={{ border: "none" }}>
                  <Button
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
                </ListGroup.Item>
              </ListGroup>
            </div>
            <div className="col-lg-6 flex my-2 my-lg-0">
              <div className="search flex w-100 ">
                <input
                  onChange={(e) => setSearch(e.target.value)}
                  type="text"
                  placeholder="Search docID, name, etc..."
                  className="form form-control w-75 bg-secondary mx-2"
                />
                <FaSearch />
              </div>
            </div>
          </div>

          {loading && <PlaceHolder />}

          {messages && (
            <Table responsive="md" bordered variant="white">
              <thead>
                <tr>
                  <th>DocID</th>
                  <th>Subject</th>
                  <th>File Name</th>
                  <th>Document Flow</th>
                  <th>Sender</th>
                  <th>Receiver</th>
                  <th>Date </th>
                  <th>Prioritization</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {classificationFiltered.map((message) => {
                  return (
                    <tr key={message.code}>
                      <td>
                        <div className="flex p-1 m-1 justify-content-center">
                          <FaFile />
                          {message.code}
                        </div>
                      </td>
                      <td>{message.subject}</td>
                      <td
                       style={{ cursor: "pointer" }}
                        onClick={() => {
                          setCurrentMessage(message);
                          setShowRouting(true);
                        }} 
                      >
                        <div
                          /* style={{ textDecoration: "underline" }} */
                          className="text-dark fw-bold"
                        >
                          {message.fileName}
                        </div>
                      </td>
                      <td>{message.documentFlow}</td>
                      <td>
                        {getUserData(message.sender).fullName}{" "}
                        <b> {getUserData(message.sender).position}</b>
                      </td>
                      <td>
                        {message.reciever == message.sender ? (
                          "Send to all"
                        ) : (
                          <>
                            {getUserData(message.reciever).fullName} -{" "}
                            <b> {getUserData(message.reciever).position}</b>
                          </>
                        )}
                      </td>
                      {message.date.toDate && (
                        <td>{moment(message.date.toDate()).format("LLL")}</td>
                      )}{" "}
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
                      {/* <td>
                        <div className="flex">
                          <DropdownAction message={message} />
                        </div>
                      </td> */}
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
