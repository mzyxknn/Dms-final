import { useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { FaBook, FaEye, FaUser } from "react-icons/fa";
import Badge from "react-bootstrap/Badge";
import { ModalBody, Spinner, Table } from "react-bootstrap";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db, storage } from "../../firebase";
import { toast } from "react-toastify";
import moment from "moment";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";



function ViewFile(props) {
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => {
    // Extract the file extension
    const cleanedFileUrl = props.file.split('?')[0];

    // Extract the file extension
    const fileExtension = cleanedFileUrl.split('.').pop();

    console.log('File URL:', fileExtension);

    if (fileExtension.toLowerCase() !== 'pdf') {
      // If the file is not a PDF, show a toast message and return
      handleDownload();
      toast.info('File type: '+ fileExtension + ' not available for viewing. Download initiated.');
      return;
    }

    // Remove query parameters and additional text after the extension
    setShow(true);
  };
  const handleDownload = () => {
    // You can customize the download behavior here
    // Example: Triggering download using an invisible link
    const link = document.createElement('a');
    link.href = props.file;
    link.download = props.file; // You can set the desired file name
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <button onClick={handleShow} className="btn btn-primary mx-3 px-3 flex">
        View <FaEye className="mx-1" />
      </button>

      <Modal size="lg" show={show} onHide={handleClose}>
        <Modal.Header className="bg-primary" closeButton>
          <Modal.Title>File</Modal.Title>
        </Modal.Header>
        <ModalBody>
          <iframe
            style={{ height: "100vh" }}
            src={props.file}
            width={"100%"}
            frameborder="0"
          ></iframe>
        </ModalBody>
      </Modal>
    </>
  );
}

function ViewModal(props) {
  const { currentMessage } = props;

  const isDisable =
    currentMessage.status == "Pending" ||
    currentMessage.status == "In Progress";

  const sendAll = currentMessage.sender == currentMessage.reciever;

  const remarksRef = collection(db, "remarks", "allRemarks", currentMessage.id);
  const allReceiverCollection = collection(
    db,
    "routing",
    currentMessage.id,
    "sendAll",
    "receivers",
    "allReceivers"
  );
  const allRejectorsCollection = collection(
    db,
    "routing",
    currentMessage.id,
    "sendAll",
    "rejectors",
    "allRejectors"
  );

  const [sender, setSender] = useState("");
  const [reciever, setReciever] = useState("");
  const [remarks, setRemarks] = useState("");
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [confirmation, setConfirmation] = useState(false);
  const [action, setAction] = useState(null);
  const [routing, setRouting] = useState();
  const [allCreated, setAllCreated] = useState();
  const [allSeeners, setAllSeeners] = useState([]);
  const [allRemarks, setAllRemarks] = useState([]);
  const [allReceiver, setAllReceiver] = useState([]);
  const [allRejectors, setAllRejectors] = useState([]);
  const [isDeadline, setIsDeadline] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonData, setReasonData] = useState("");

  function Confirmation() {
    return (
      <>
        <Modal show={confirmation} onHide={() => setConfirmation(false)}>
          <Modal.Header closeButton>
            <Modal.Title>{action} Confirmation</Modal.Title>
          </Modal.Header>
          <Modal.Body>Are you sure you want to continue?</Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setConfirmation(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                handleAction(action);
                setConfirmation(false);
                props.closeModal();
              }}
            >
              Confirm
            </Button>
          </Modal.Footer>
        </Modal>
      </>
    );
  }

  function toTitleCase(str) {
    return str.replace(/\w\S*/g, function (txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }

  const getOffice = (id) => {
    const output = offices.filter((office) => {
      if (office.id == id) {
        return office;
      }
    });
    return output[0];
  };
  useEffect(() => {
    getDocs(collection(db, "offices")).then((res) => {
      const offices = [];
      res.docs.forEach((doc) => {
        offices.push({ ...doc.data(), id: doc.id });
      });
      setOffices(offices);
    });
    if (props.dashboard) {
      const senderUser = props.getUser(currentMessage.sender);
      const recieverUser = props.getUser(currentMessage.reciever);

      setSender(senderUser);
      setReciever(recieverUser);
    }
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, "routing", currentMessage.id, currentMessage.id),
      orderBy("createdAt", "asc")
    );
    onSnapshot(q, (snapshot) => {
      const output = [];
      snapshot.docs.forEach((doc) => {
        output.push({ ...doc.data(), id: doc.id });
      });
      setRouting(output);
    });

    const allCreatedRef = doc(
      db,
      "routing",
      currentMessage.id,
      "sendAll",
      "created"
    );
    getDoc(allCreatedRef).then((res) => {
      setAllCreated(res.data());
    });

    const q2 = query(
      collection(
        db,
        "routing",
        currentMessage.id,
        "sendAll",
        "seeners",
        "AllSeeners"
      ),
      orderBy("createdAt", "asc")
    );
    onSnapshot(q2, (snapshot) => {
      const output = [];
      snapshot.docs.forEach((doc) => {
        output.push({ ...doc.data(), id: doc.id });
      });
      setAllSeeners(output);
    });

    const q3 = query(remarksRef, orderBy("createdAt", "asc"));
    onSnapshot(q3, (snapshot) => {
      const output = [];
      snapshot.docs.forEach((doc) => {
        output.push({ ...doc.data(), id: doc.id });
      });
      setAllRemarks(output);
    });

    const q4 = query(allReceiverCollection, orderBy("createdAt", "asc"));
    onSnapshot(q4, (snapshot) => {
      const output = [];
      snapshot.docs.forEach((doc) => {
        output.push({ ...doc.data(), id: doc.id });
      });
      setAllReceiver(output);
    });
    const q5 = query(allRejectorsCollection, orderBy("createdAt", "asc"));
    onSnapshot(q5, (snapshot) => {
      const output = [];
      snapshot.docs.forEach((doc) => {
        output.push({ ...doc.data(), id: doc.id });
      });
      setAllRejectors(output);
    });

    //Check if deadline or not
    const dateNow = moment();
    const deadline = moment(currentMessage.dueDate);
    const isDue = deadline.isBefore(dateNow);
    setIsDeadline(isDue);

    onSnapshot(doc(db, "reason", currentMessage.id), (res) => {
      setReason(res.data().remarks);
    });
  }, [currentMessage]);

  const handleAction = async (type) => {
    const user = props.getUser(currentMessage.sender);
    const office = getOffice(user.office);

    if (type == "Received") {
      addDoc(collection(db, "routing", currentMessage.id, currentMessage.id), {
        createdAt: serverTimestamp(),
        message: currentMessage,
        status: "Received",
      });

      addDoc(remarksRef, {
        createdAt: serverTimestamp(),
        remarks: remarks,
        user: auth.currentUser.uid,
      });

      const receiverCollection = collection(
        db,
        "routing",
        currentMessage.id,
        "sendAll",
        "receivers",
        "allReceivers"
      );

      addDoc(receiverCollection, {
        createdAt: serverTimestamp(),
        message: currentMessage,
        status: "Received",
        seener: props.getUser(auth.currentUser.uid).fullName,
      });
    } else {
      addDoc(collection(db, "routing", currentMessage.id, currentMessage.id), {
        createdAt: serverTimestamp(),
        message: currentMessage,
        status: "Rejected",
      });
      addDoc(remarksRef, {
        createdAt: serverTimestamp(),
        remarks: remarks,
        user: auth.currentUser.uid,
      });
      const receiverCollection = collection(
        db,
        "routing",
        currentMessage.id,
        "sendAll",
        "rejectors",
        "allRejectors"
      );

      addDoc(receiverCollection, {
        createdAt: serverTimestamp(),
        message: currentMessage,
        status: "Rejected",
        seener: props.getUser(auth.currentUser.uid).fullName,
      });
    }

    try {
      const messageRef = doc(db, "messages", currentMessage.id);
      await setDoc(
        messageRef,
        {
          status: type,
          remarks: remarks,
          dateResolve: serverTimestamp(),
        },
        { merge: true }
      );

      if (!office) {
        addDoc(collection(db, "storage", auth.currentUser.uid, "files"), {
          fileName: currentMessage.fileName,
          fileURL: currentMessage.fileUrl,
          owner: auth.currentUser.uid,
          isFolder: false,
          createdAt: serverTimestamp(),
        });
        toast.success(`Successfully ${type}`);

        return;
      }
      if (type == "Received") {
        const folderData = {
          owner: auth.currentUser.uid,
          isFolder: true,
          fileName: office.officeName,
          createdAt: serverTimestamp(),
        };

        const folderDoc = doc(
          db,
          "storage",
          auth.currentUser.uid,
          "files",
          office.officeName
        );

        const folderExist = await getDoc(folderDoc);
        if (!folderExist.exists()) {
          await setDoc(folderDoc, folderData);
        }

        addDoc(
          collection(db, "storage", auth.currentUser.uid, office.officeName),
          {
            fileName: currentMessage.fileName,
            fileURL: currentMessage.fileUrl,
            owner: auth.currentUser.uid,
            isFolder: false,
            createdAt: serverTimestamp(),
          }
        );
      }
      toast.success(`Successfully ${type}`);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleSubmit = (url) => {
    if (props.currentPage == "internal") {
      const messageRef = doc(db, "messages", currentMessage.id);
      updateDoc(messageRef, {
        fileUrl: url,
        fileName: file.name,
        status: "Pending",
      });

      // Routing
      const docRef = collection(
        db,
        "routing",
        currentMessage.id,
        currentMessage.id
      );
      addDoc(docRef, {
        createdAt: serverTimestamp(),
        message: currentMessage,
        status: "Pending",
      });

      //Remarks

      addDoc(remarksRef, {
        createdAt: serverTimestamp(),
        remarks: remarks,
        user: auth.currentUser.uid,
      });

      props.closeModal();
      props.resetCurrentMessage();
    } else {
      const messageRef = doc(db, "outgoing-external", currentMessage.id);
      updateDoc(messageRef, {
        fileUrl: url,
        fileName: file.name,
        status: "Received",
      });
      props.closeModal();
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
              setLoading(false);
            }
          })
          .catch((error) => {
            console.error("Error getting download URL:", error);
          });
      });
    } else {
      toast.error("No files");
      setLoading(false);
    }
  };

  const handleReason = () => {
    setLoading(true);
    setDoc(doc(db, "reason", currentMessage.id), {
      createdAt: serverTimestamp(),
      remarks: reasonData,
      user: auth.currentUser.uid,
    });
    setLoading(false);
  };

  const filteredSeeners = allSeeners.filter(
    (obj, index, self) =>
      index === self.findIndex((o) => o.seener === obj.seener)
  );

  return (
    <>
      <Confirmation />
      <Modal
        size="xl"
        aria-labelledby="contained-modal-title-vcenter"
        centered
        show={props.showModal}
        onHide={props.closeModal}
      >
        <Modal.Header className="bg-primary" closeButton>
          <Modal.Title>Document Code #{currentMessage.code}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row">
            <div className="col-lg-6">
              {!props.dashboard &&
                props.currentPage == "internal" &&
                currentMessage && (
                  <h5 className="fw-bold">
                    <FaUser /> {props.outgoing ? "Reciever" : "Sender"} -{" "}
                    {
                      props.getUser(
                        props.outgoing
                          ? currentMessage.reciever
                          : currentMessage.sender
                      ).fullName
                    }
                    {" - "}
                    {
                      props.getUser(
                        props.outgoing
                          ? currentMessage.reciever
                          : currentMessage.sender
                      ).position
                    }
                  </h5>
                )}
              {props.dashboard && sender && reciever && (
                <>
                  <h5 className="fw-bold">
                    {" "}
                    <FaUser />
                    Sender - {sender.fullName} {" - "}
                    {sender.position}
                  </h5>
                  <h5 className="fw-bold">
                    {" "}
                    <FaUser />
                    Reciever - {reciever.fullName} {" - "}
                    {reciever.position}
                  </h5>
                </>
              )}
            </div>
            <div className="col-lg-6 d-flex justify-content-end align-items-center">
              Date: {moment(currentMessage.date.toDate()).format("LL")}
            </div>
          </div>
          <h3 className="text-center">
            {toTitleCase(currentMessage.classification) +
              "/" +
              currentMessage.subject}{" "}
            <Badge
              bg={currentMessage.prioritization == "urgent" ? "danger" : "info"}
            >
              {toTitleCase(currentMessage.prioritization)}
            </Badge>
          </h3>
          <div className="details">
            <div className="details-header w-100 bg-secondary p-2">
              <h5>
                {" "}
                <FaBook /> Details
              </h5>
            </div>
            <div className="row mt-3">
              <div className="col-lg-4 flex">
                <div className="form-wrapper">
                  <label htmlFor="">Required Action</label>
                  <input
                    disabled
                    type="text"
                    className="form-control"
                    value={currentMessage.action}
                  />
                </div>
              </div>
              <div className="col-lg-4 flex">
                <div className="form-wrapper">
                  <label htmlFor="">Delivery Type</label>
                  <input
                    disabled
                    type="text"
                    className="form-control"
                    value={currentMessage.deliverType}
                  />
                </div>
              </div>
              <div className="col-lg-4 flex">
                <div className="form-wrapper">
                  <label htmlFor="">Due Date</label>
                  <input
                    disabled
                    type="text"
                    className="form-control"
                    value={currentMessage.dueDate}
                  />
                </div>
              </div>
              <div className="col-lg-12">
                <div className="form-wrapper">
                  <label htmlFor="">Details</label>
                  <textarea
                    rows={5}
                    type="text"
                    className="form-control"
                    value={currentMessage.description}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="attachment mt-3">
            <div className="attachment-header w-100 bg-secondary p-2">
              <h5>
                {" "}
                <FaBook /> Attachment
              </h5>
            </div>
            <div className="row mt-3">
              {currentMessage.status !== "In Progress" && (
                <div className="col-12">
                  <div className="form-wrapper flex">
                    <input
                      type="text"
                      className="form-control"
                      value={currentMessage.fileName}
                    />

                    <ViewFile file={currentMessage.fileUrl} />
                  </div>
                </div>
              )}

              {currentMessage.status == "In Progress" &&
                auth.currentUser.uid == currentMessage.sender && (
                  <div className="col-12 my-3 flex justify-content-start align-items-center">
                    <div className="wrapper w-75">
                      <label htmlFor="">Add File</label>
                      <input
                        accept=".pdf,.docx"
                        onChange={(e) => setFile(e.target.files[0])}
                        type="file"
                        className="form-control"
                      />
                    </div>

                    <button
                      onClick={handleUpload}
                      className="btn btn-primary  mb-0 mx-3"
                    >
                      {loading ? (
                        <Spinner animation="border" variant="secondary" />
                      ) : (
                        "Upload File"
                      )}
                    </button>
                  </div>
                )}
              {currentMessage.status == "Rejected" &&
                auth.currentUser.uid == currentMessage.sender &&
                !props.dashboard && (
                  <>
                    <div className="col-12 my-3 flex justify-content-start align-items-center">
                      <div className="wrapper w-75">
                        <label htmlFor="">Upload new file</label>
                        <input
                          onChange={(e) => setFile(e.target.files[0])}
                          type="file"
                          className="form-control"
                          accept=".pdf,.docx"
                        />
                      </div>
                    </div>
                    <div className="col-12">
                      <label htmlFor="">Add remarks</label>
                      <input
                        onChange={(e) => setRemarks(e.target.value)}
                        type="text"
                        className="form-control"
                      />
                    </div>{" "}
                    <div className="col-12 d-flex justify-content-end align-items-center my-2">
                      <button
                        onClick={handleUpload}
                        className="btn btn-primary  mb-0 mx-3"
                      >
                        {loading ? (
                          <Spinner animation="border" variant="secondary" />
                        ) : (
                          "Upload File"
                        )}
                      </button>
                    </div>
                  </>
                )}
            </div>
          </div>
          <div className="action mt-3">
            {!props.outgoing && (
              <div className="details-header w-100 bg-secondary p-2">
                <h5>
                  {" "}
                  <FaBook /> Action
                </h5>
              </div>
            )}
            {isDeadline && (
              <div className="col-12 my-3">
                {currentMessage.reciever == auth.currentUser.uid && (
                  <div className="wrapper d-flex justify-content-left align-items-center flex-column ">
                    <label htmlFor="" className="align-self-start mb-2">
                      This message is overdue, please state your reason.
                    </label>
                    <div className="wrapper w-100 d-flex">
                      <input
                        onChange={(e) => setReasonData(e.target.value)}
                        type="text"
                        className="form-control border border-danger"
                      />
                      <button
                        onClick={handleReason}
                        className="btn btn-primary  mb-0 mx-3"
                      >
                        {loading ? (
                          <Spinner animation="border" variant="secondary" />
                        ) : (
                          "Send"
                        )}
                      </button>
                    </div>
                  </div>
                )}
                <h5>Reason for overdue</h5>

                <textarea
                  rows={3}
                  value={reason}
                  type="text"
                  placeholder="You reason goes here..."
                  className="form-control bg-danger my-3 text-white"
                />
              </div>
            )}

            <div className="content">
              {currentMessage.reciever == auth.currentUser.uid && (
                <div className="col-12 d-flex w-100 justify-content-center align-items-center">
                  <div className="wrapper w-100">
                    <label htmlFor="">Add remarks</label>
                    <input
                      onChange={(e) => setRemarks(e.target.value)}
                      type="text"
                      className="form-control"
                    />
                  </div>
                </div>
              )}

              {!sendAll && (
                <div className="form-wrapper">
                  <h5>Document Remarks</h5>
                  <div className="remarks-wrapper  py-3 shadow my-3 px-5 d-flex flex-column justify-content-center align-items-center">
                    {allRemarks &&
                      allRemarks.map((remark, index) => {
                        const own = remark.user == auth.currentUser.uid;

                        return (
                          <div
                            key={index}
                            className={`div  px-3 py-2 my-2 ${
                              own
                                ? "align-self-end bg-primary"
                                : "align-self-start bg-info"
                            }`}
                            style={{ borderRadius: "10px" }}
                          >
                            <p className="mb-0">{remark.remarks}</p>
                            {remark.createdAt && (
                              <p className="mb-0" style={{ fontSize: "9px" }}>
                                {moment(remark.createdAt.toDate()).format(
                                  "LLL"
                                )}
                              </p>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="audit mt-3">
            <h5>Document Logs</h5>
            <Table>
              <thead>
                <tr>
                  <th>Date and time</th>
                  <th>Document Code</th>

                  {sendAll && <th>User</th>}
                  <th>Subject</th>
                  <th>File Name</th>
                  <th>Status</th>
                </tr>
              </thead>
              {!sendAll && routing && (
                <tbody>
                  {routing &&
                    routing.map((route, index) => {
                      return (
                        <tr key={index}>
                          <td>
                            {route.createdAt && (
                              <p>
                                {moment(route.createdAt.toDate()).format("LLL")}
                              </p>
                            )}
                          </td>
                          <td>#{route.message.code}</td>
                          <td>{route.message.subject}</td>
                          <td>{route.message.fileName}</td>
                          <td>{route.status}</td>
                        </tr>
                      );
                    })}
                </tbody>
              )}
              {sendAll && allCreated && (
                <tbody>
                  <tr>
                    <td>
                      {allCreated.createdAt && (
                        <p>
                          {moment(allCreated.createdAt.toDate()).format("LLL")}
                        </p>
                      )}
                    </td>
                    <td>#{allCreated.message.code}</td>
                    <td>{allCreated.user}</td>

                    <td>{allCreated.message.subject}</td>
                    <td>{allCreated.message.fileName}</td>
                    <td>{allCreated.status}</td>
                  </tr>
                  {allSeeners &&
                    filteredSeeners.map((seener) => {
                      return (
                        <tr>
                          <td>
                            {seener.createdAt && (
                              <p>
                                {moment(seener.createdAt.toDate()).format(
                                  "LLL"
                                )}
                              </p>
                            )}
                          </td>
                          <td>#{seener.message.code}</td>
                          <td>{seener.seener}</td>
                          <td>{seener.message.subject}</td>
                          <td>{seener.message.fileName}</td>
                          <td>{seener.status}</td>
                        </tr>
                      );
                    })}
                  {allReceiver &&
                    allReceiver.map((seener) => {
                      return (
                        <tr>
                          <td>
                            {seener.createdAt && (
                              <p>
                                {moment(seener.createdAt.toDate()).format(
                                  "LLL"
                                )}
                              </p>
                            )}
                          </td>
                          <td>#{seener.message.code}</td>
                          <td>{seener.seener}</td>
                          <td>{seener.message.subject}</td>
                          <td>{seener.message.fileName}</td>
                          <td>{seener.status}</td>
                        </tr>
                      );
                    })}
                  {allRejectors &&
                    allRejectors.map((seener) => {
                      return (
                        <tr>
                          <td>
                            {seener.createdAt && (
                              <p>
                                {moment(seener.createdAt.toDate()).format(
                                  "LLL"
                                )}
                              </p>
                            )}
                          </td>
                          <td>#{seener.message.code}</td>
                          <td>{seener.seener}</td>
                          <td>{seener.message.subject}</td>
                          <td>{seener.message.fileName}</td>
                          <td>{seener.status}</td>
                        </tr>
                      );
                    })}
                </tbody>
              )}
            </Table>
          </div>
        </Modal.Body>
        {!props.outgoing && (
          <Modal.Footer>
            <div className="row w-100">
              <div className="col-lg-6 flex">
                <Button
                  disabled={!isDisable && !sendAll}
                  onClick={() => {
                    setAction("Rejected");
                    setConfirmation(true);
                  }}
                  className="w-100 text-white"
                  variant="danger"
                >
                  Rejected
                </Button>
              </div>
              <div className="col-lg-6 flex">
                <Button
                  disabled={!isDisable && !sendAll}
                  onClick={() => {
                    setAction("Received");
                    setConfirmation(true);
                  }}
                  className="w-100"
                  variant="primary"
                >
                  Received
                </Button>
              </div>
            </div>
          </Modal.Footer>
        )}
      </Modal>
    </>
  );
}

export default ViewModal;
