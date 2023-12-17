import {
  FaSearch,
  FaFile,
  FaTrash,
  FaEye,
  FaDownload,
  FaMap,
  FaInbox,
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
  Timestamp,
  query,
  where,
  or,
  orderBy,
} from "firebase/firestore";
import { auth, db, storage } from "../../firebase";
import BounceLoader from "react-spinners/BounceLoader";
import Dropdown from "react-bootstrap/Dropdown";

import { useEffect, useRef, useState } from "react";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { toast } from "react-toastify";
import { createUserWithEmailAndPassword } from "firebase/auth";
import Layout from "../layout/layout";
import Offcanvas from "react-bootstrap/Offcanvas";
import ViewModal from "../components/viewModal";
import PlaceHolder from "../components/placeholder";
import moment from "moment";
import { Margin, Resolution, usePDF } from "react-to-pdf";

const userCollectionRef = collection(db, "users");
const messagesCollectionRef = collection(db, "messages");
const incomingExternalRef = collection(db, "incoming-external");
const outgoingExternalRef = collection(db, "outgoing-external");

const currentDate = new Date();

const Reports = () => {
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [showTools, setShowTools] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState("internal");
  const [currentFilter, setCurrentFilter] = useState(null);

  const { toPDF, targetRef } = usePDF({
    filename: "reports.pdf",
  });

  const fetchData = async () => {
    setLoading(true);
    const snapshot = await getDocs(userCollectionRef);
    const output = snapshot.docs.map((doc) => {
      return { id: doc.id, ...doc.data() };
    });

    setUsers(output);

    const q = query(messagesCollectionRef, orderBy("createdAt", "desc"));

    onSnapshot(
      q,
      (querySnapshot) => {
        const messages = [];
        querySnapshot.forEach((doc) => {
          const message = { ...doc.data(), id: doc.id };
          messages.push(message);
        });
        setMessages(messages);
      },
      (error) => {
        console.error("Error listening to collection:", error);
      }
    );

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

  const updateFilter = async (filter) => {
    const messages = [];

    if (!filter.startDate || !filter.endDate) {
      toast.error("Start date and end date must not be empty!");
      setLoading(false);

      return;
    }

    setCurrentFilter(filter);
    setLoading(true);

    const startDate = new Date(filter.startDate);
    const endDate = new Date(filter.endDate);

    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);

    if (filter.documentFlow == "external") {
      setCurrentPage("external");
    }

    if (filter.documentFlow == "internal") {
      let q = null;
      if (filter.sender) {
        q = query(
          messagesCollectionRef,
          where("date", ">=", startTimestamp),
          where("date", "<=", endTimestamp),
          where("sender", "==", filter.sender)
        );
      } else {
        q = query(
          messagesCollectionRef,
          where("date", ">=", startTimestamp),
          where("date", "<=", endTimestamp)
        );
      }
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        messages.push({ ...doc.data(), id: doc.id });
      });
    } else {
      const q = query(
        incomingExternalRef,
        where("date", ">=", startTimestamp),
        where("date", "<=", endTimestamp)
      );
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        const message = { ...doc.data(), id: doc.id };
        if (
          message.reciever == auth.currentUser.uid ||
          message.sender == auth.currentUser.uid
        ) {
          messages.push(message);
        }
      });

      const q2 = query(
        outgoingExternalRef,
        where("date", ">=", startTimestamp),
        where("date", "<=", endTimestamp)
      );
      const querySnapshot2 = await getDocs(q2);
      querySnapshot2.forEach((doc) => {
        const message = { ...doc.data(), id: doc.id };
        if (
          message.reciever == auth.currentUser.uid ||
          message.sender == auth.currentUser.uid
        ) {
          messages.push(message);
        }
      });
    }
    setMessages(messages);
    setLoading(false);
  };

  function ReportToolsSidebar(props) {
    const [startDate, setStartDate] = useState(props.currentFilter);
    const [endDate, setEndDate] = useState(null);
    const [documentFlow, setDocumentFlow] = useState("internal");
    const [sender, setSender] = useState(null);
    const [reciever, setReciever] = useState(null);

    const handleFilter = () => {
      const filter = {
        startDate: startDate,
        endDate: endDate,
        documentFlow: documentFlow,
        sender: sender,
        reciever,
      };
      props.updateFilter(filter);
      props.handleCloseTools();
    };

    return (
      <>
        <Offcanvas
          placement="end"
          show={props.showTools}
          onHide={props.handleCloseTools}
        >
          <Offcanvas.Header closeButton></Offcanvas.Header>
          <Offcanvas.Body>
            <Form.Group className="mb-3" controlId="formBasicEmail">
              <Form.Label>Start Date</Form.Label>
              <Form.Control
                onChange={(e) => setStartDate(e.target.value)}
                type="date"
                placeholder="Enter email"
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formBasicEmail">
              <Form.Label>End Date</Form.Label>
              <Form.Control
                onChange={(e) => setEndDate(e.target.value)}
                type="date"
                placeholder="Enter email"
              />
            </Form.Group>
            <Form.Label>Document Flow</Form.Label>
            <Form.Select
              onChange={(e) => setDocumentFlow(e.target.value)}
              aria-label="Default select example"
            >
              <option value="internal">Internal</option>
              <option value="external">External</option>
            </Form.Select>
            {documentFlow == "internal" && (
              <>
                <Form.Label>Sender</Form.Label>
                <Form.Select
                  onChange={(e) => setSender(e.target.value)}
                  className="mb-3"
                >
                  <option value="">Please select an option</option>
                  <option value="">All Users</option>;
                  {users &&
                    users.map((user) => {
                      return (
                        <option key={user.userID} value={user.id}>
                          {user.fullName}{" "}
                        </option>
                      );
                    })}
                </Form.Select>
              </>
            )}
            <div className="row mt-5">
              <div className="col-6">
                <Button variant="warning" onClick={() => toPDF()}>
                  <p className="fw-bold text-black  mb-0">Export to PDF</p>
                </Button>
              </div>
              <div className="col-6">
                <Button onClick={handleFilter}>Generate Report</Button>
              </div>
            </div>
          </Offcanvas.Body>
        </Offcanvas>
      </>
    );
  }

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <Layout>
      <ReportToolsSidebar
        showTools={showTools}
        currentFilter={currentFilter}
        handleCloseTools={() => setShowTools(false)}
        updateFilter={updateFilter}
      />
      <div className="dashboard">
        <div className="row">
          <div className="col-lg-7">
            <div className="wrapper">
              <h2 className="fw-bold my-3 mx-2">
                Document Reports
                <FaInbox className="mx-2" />
              </h2>
              <div
                className="bg-info mx-2 mb-3"
                style={{ width: "200px", height: "10px", borderRadius: 20 }}
              ></div>
            </div>
          </div>
          <div className="col-lg-5 flex">
            <Button variant="primary mb-2" onClick={() => setShowTools(true)}>
              <p className="fw-bold text-white  mb-0">Report Tools</p>
            </Button>{" "}
          </div>
          {loading && (
            <div className="col-12 d-flex justify-content-center align-items-center flex-column">
              <h2>Generating Reports...</h2>
              <BounceLoader color="#00b5ca" />
            </div>
          )}
        </div>

        <div ref={targetRef} className="dashboard-content mx-3 mt-3">
          <h2 className="text-center fw-bold mb-3">
            Document Results {currentDate.toDateString()}
          </h2>
          {loading && <PlaceHolder />}
          {currentFilter && (
            <div className="col-12">
              <ListGroup>
                <ListGroup.Item>
                  Document Flow: <b>{currentPage}</b>
                </ListGroup.Item>
                <ListGroup.Item>
                  Start Date: <b>{currentFilter.startDate}</b>
                </ListGroup.Item>
                <ListGroup.Item>
                  End: <b>{currentFilter.endDate}</b>
                </ListGroup.Item>
                <ListGroup.Item>
                  Sender:{" "}
                  <b>
                    {currentFilter.sender
                      ? getUser(currentFilter.sender).fullName
                      : "N/A"}
                  </b>
                </ListGroup.Item>
              </ListGroup>
            </div>
          )}
          {currentPage == "internal" ? (
            <Table responsive="md" bordered variant="white">
              <thead>
                <tr>
                  <th>DocID</th>
                  <th>Subject</th>
                  <th>File Name</th>
                  <th>Sender</th>
                  <th>Subject</th>
                  <th>Document Flow</th>
                  <th>Action</th>
                  <th>Date </th>
                  <th>Prioritization</th>
                  <th>Remarks</th>
                  <th>Date Resolve</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((message) => {
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
                          setShowViewModal(true);
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

                      <td>{message.subject}</td>
                      <td>{message.documentFlow}</td>

                      <td>{message.action}</td>
                      {message.date && (
                        <td>{moment(message.date.toDate()).format("LLL")}</td>
                      )}
                      <td className="flex">
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
                      </td>
                      <td>{message.remarks ? message.remarks : "N/A"}</td>
                      <td>
                        {message.dateResolve
                          ? moment(message.dateResolve.toDate()).format("LLL")
                          : "N/A"}
                      </td>
                      <td>
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
                  <th>Document Flow</th>
                  <th>File Name</th>
                  <th>Sender</th>
                  <th>Required Action</th>
                  <th>Date </th>
                  <th>Prioritization</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((message) => {
                  return (
                    <tr key={message.code}>
                      <td>
                        <div className="flex">
                          <FaFile />
                          {message.code}
                        </div>
                      </td>
                      <td>{message.subject}</td>
                      <td>{message.documentFlow}</td>
                      <td
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          setCurrentMessage(message);
                          setShowViewModal(true);
                        }}
                      >
                        <div
                          style={{ textDecoration: "underline" }}
                          className="text-info fw-bold"
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

export default Reports;
