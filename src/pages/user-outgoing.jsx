import {
  FaSearch,
  FaFile,
  FaTrash,
  FaEye,
  FaDownload,
  FaMap,
  FaInbox,
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
import LayoutUser from "../layout/layoutUser";
import Offcanvas from "react-bootstrap/Offcanvas";
import ViewModal from "../components/viewModal";
import PlaceHolder from "../components/placeholder";
import moment from "moment";
import axios from "axios";
import Routing from "../components/routing";
import emailjs from "emailjs-com";
import { InputGroup } from "react-bootstrap";
import Datetime from "react-datetime";
import "react-datetime/css/react-datetime.css";
const userCollectionRef = collection(db, "users");
const messagesCollectionRef = collection(db, "messages");
const outgoingExternal = collection(db, "outgoing-external");
const officeCollection = collection(db, "offices");
const UserOutgoing = () => {
  const [modalShow, setModalShow] = useState(false);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState(null);
  const [showRouting, setShowRouting] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [enableSMS, setEnableSMS] = useState(false);
  const [currentPage, setCurrentPage] = useState("internal");
  const [externalMessages, setExternalMessages] = useState([]);
  const [search, setSearch] = useState("");
  const [deleteModal, setDeleteModal] = useState(false);
  const [offices, setOffices] = useState([]);
  const [sort, setSort] = useState("a-z");
  const [classificationData, setClassificationData] = useState([]);
  const [subClassificationData, setSubClassificationData] = useState([]);
  const [actionData, setActionData] = useState([]);
  const [currentClassification, setCurrentClassification] = useState("");

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

  const getOfficeStatus = (id) => {
    const office = offices.filter((office) => {
      if (office.id == id) {
        return office;
      }
    });
    return office[0] == undefined ? "Unknown" : office[0].status;
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
  function ComposeModal(props) {
    const [code, setCode] = useState("");
    const [reciever, setReciever] = useState("");
    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");
    const [prioritization, setPrioritization] = useState("");
    const [classification, setClassification] = useState("");
    const [subClassification, setSubClassification] = useState("");
    const [action, setAction] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [deliverType, setDeliverType] = useState("");
    const [documentFlow, setDocumentFlow] = useState("");
    const [attachmentDetail, setAttachmentDetail] = useState("");
    const [file, setFile] = useState("");
    const [loading, setLoading] = useState(false);
    const [show, setShow] = useState(false);
    const [multipe, setMultiple] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const generateRandomCode = () => {
      const min = 1000;
      const max = 99999;
      const code = Math.floor(Math.random() * (max - min + 1)) + min;
      setCode(code.toString());
    };
    const validateForm = () => {
      if (!multipe) {
        // Check for validation only when multipe is false
        if (
          code &&
          (reciever || selectedUsers.length >= 1) &&
          subject &&
          prioritization &&
          classification &&
          subClassification &&
          action &&
          deliverType &&
          attachmentDetail
        ) {
          return true;
        } else {
          return false;
        }
      } else {
        if (
          (reciever || selectedUsers.length >= 1) &&
          subject &&
          prioritization &&
          classification &&
          subClassification &&
          action &&
          deliverType &&
          attachmentDetail
        ) {
          return true;
        } else {
          return false;
        }
        // Skip validation when multipe is true
        return true;
      }
    };

    function ConfirmationModal() {
      const handleClose = () => setShow(false);

      return (
        <>
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

    const handleSendSMS = async () => {
      const textReciever = getUser(reciever);
      const textSender = getUser(props.currentUser.uid);

      const message = `You have received a new message from ${textSender.fullName} with a subject: ${subject}. Please log in to your account to view and respond to the message.`;

      try {
        const username = "Sowishi";
        const password = "sdfsdfjsdlkfjsdjfsld3533535GKJlgfgjdlf@";
        const credentials = `${username}:${password}`;
        const encodedCredentials = `Basic ${btoa(credentials)}`;
        const axiosSettings = {
          url: "https://j3q9x4.api.infobip.com/sms/2/text/advanced",
          method: "POST",
          timeout: 0,
          headers: {
            Authorization: encodedCredentials,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          data: {
            messages: [
              {
                destinations: [
                  {
                    to: `+63${textReciever.phone}`,
                  },
                ],
                from: "Document Management System",
                text: message,
              },
            ],
          },
        };
        axios(axiosSettings)
          .then((response) => {
            console.log(response.data);
          })
          .catch((error) => {
            console.error("Request failed", error);
          });
      } catch (error) {
        toast.error(error.toString());
      }
    };

    const sendEmail = (docLink, toUser) => {
      let emailReciever = getUser(reciever);
      if (toUser) {
        emailReciever = toUser;
      }
      const emailSender = getUser(props.currentUser.uid);
      const templateParams = {
        sender: emailSender.fullName,
        reciever: emailReciever.fullName,
        subject: subject,
        prioritization: prioritization,
        date: moment(serverTimestamp()).format("LL"),
        sender_email: emailSender.email,
        sender_position: emailSender.position,
        to_email: emailReciever.email,
        document_link: docLink,
      };

      emailjs
        .send(
          "service_aph5krh", // Replace with your EmailJS service ID
          "template_lbn8eop", // Replace with your EmailJS template ID
          templateParams,
          "iQ0Bvi_u9sIHLiVBV" // Replace with your EmailJS user ID
        )
        .then((result) => {
          console.log(result.text, "Fdksjflk");
        })
        .catch((error) => {
          console.log("Error sending email:", error);
        });
    };

    const handleSubmit = (fileUrl) => {
      let documentState = "Pending";
      if (currentPage == "external") {
        documentState = "Received";
      }
      if (!file) {
        documentState = "In Progress";
      }

      try {
        const dataObject = {
          code: code || null,
          sender: props.currentUser.uid || null,
          reciever: reciever || null,
          subject: subject || null,
          description: description || null,
          prioritization: prioritization || null,
          date: serverTimestamp(),
          classification: classification || null,
          subClassification: subClassification || null,
          action: action || null,
          dueDate: dueDate || null,
          deliverType: deliverType || null,
          documentFlow: currentPage == "internal" ? "Internal" : "External",
          attachmentDetail: attachmentDetail || null,
          fileUrl: fileUrl || "N/A",
          fileName: file.name || "N/A",
          status: documentState,
          createdAt: serverTimestamp(),
          isSendToALl: props.currentUser.uid === reciever,
        };

        if (currentPage == "internal") {
          if (!multipe) {
            addDoc(messagesCollectionRef, dataObject).then((document) => {
              const isAll = props.currentUser.uid == reciever;
              if (!isAll) {
                addDoc(collection(db, "routing", document.id, document.id), {
                  createdAt: serverTimestamp(),
                  message: dataObject,
                  status: "Created",
                });
                toast.success("Your message is succesfully sent!");
                setModalShow(false);
              } else {
                const docRef = doc(
                  db,
                  "routing",
                  document.id,
                  "sendAll",
                  "created"
                );
                setDoc(docRef, {
                  createdAt: serverTimestamp(),
                  message: dataObject,
                  status: "Created",
                  user: getUser(auth.currentUser.uid).fullName,
                });
                setModalShow(false);
              }
            });
          } else {
            selectedUsers.map((user) => {
              const dataObjectCopy = { ...dataObject };
              dataObjectCopy["reciever"] = user.id;

              addDoc(messagesCollectionRef, dataObjectCopy).then((document) => {
                addDoc(collection(db, "routing", document.id, document.id), {
                  createdAt: serverTimestamp(),
                  message: dataObject,
                  status: "Created",
                });
                toast.success("Your message is succesfully sent!");
                setModalShow(false);
              });
              sendEmail(fileUrl, user);
            });
          }
        } else {
          addDoc(outgoingExternal, dataObject).then(() => {
            toast.success("Your message is succesfully sent!");
            setModalShow(false);
          });
        }
      } catch (error) {
        toast.error(error.message);
      }
      // console.log("Code:", code);
      // console.log("Sender:", sender);
      // console.log("Receiver:", reciever);
      // console.log("Subject:", subject);
      // console.log("Description:", description);
      // console.log("Prioritization:", prioritization);
      // console.log("Date:", date);
      // console.log("Classification:", classification);
      // console.log("Subclassification:", subClassification);
      // console.log("Action:", action);
      // console.log("Due Date:", dueDate);
      // console.log("Deliver Type:", deliverType);
      // console.log("Document Flow:", documentFlow);
      // console.log("Attachment Detail:", attachmentDetail);
      // console.log("File:", file);
    };

    const handleUpload = async () => {
      setLoading(true);
      setShow(false);
    
      const generateRandomCode = () => {
        const min = 1000;
        const max = 99999;
        return Math.floor(Math.random() * (max - min + 1)) + min;
      };
    
      const generateCodeForUser = () => {
        return generateRandomCode().toString();
      };
    
      const uploadFile = async (file) => {
        const storageRef = ref(storage, `uploads/${file.name}`);
        try {
          const snapshot = await uploadBytes(storageRef, file);
          const fileUrl = await getDownloadURL(snapshot.ref);
          return fileUrl;
        } catch (error) {
          console.error("Error uploading file:", error);
          throw new Error("Error uploading file. Please try again.");
        }
      };
    
      const handleDocumentForUser = async (user, fileUrl) => {
        try {
          const dataObjectCopy = {
            code: generateCodeForUser(),
            sender: props.currentUser.uid || null,
            reciever: user.id,
            subject,
            description,
            prioritization,
            date: serverTimestamp(),
            classification,
            subClassification,
            action,
            dueDate,
            deliverType,
            documentFlow: currentPage === "internal" ? "Internal" : "External",
            attachmentDetail,
            fileUrl: fileUrl || "N/A",
            fileName: file.name || "N/A",
            status: "Pending",
            createdAt: serverTimestamp(),
            isSendToAll: props.currentUser.uid === user.id,
          };
    
          const documentRef = await addDoc(messagesCollectionRef, dataObjectCopy);
          setShowModal(false)
          await addDoc(collection(db, "routing", documentRef.id, documentRef.id), {
            createdAt: serverTimestamp(),
            message: dataObjectCopy,
            status: "Created",
          });
    
          toast.success(`Your message is successfully sent to ${user.fullName}`);
          sendEmail(fileUrl, user);
        } catch (error) {
          console.error("Error handling document for user:", error);
          toast.error(`Error sending document to ${user.fullName}. Please try again.`);
        }
      };
    
      try {
        if (file) {
          const fileUrl = await uploadFile(file);
    
          if (enableSMS && currentPage === "internal") {
            if (!multipe) {
              sendEmail(fileUrl);
              handleSubmit(fileUrl);
            } else {
              // Handle multiple users
              const promises = selectedUsers.map((user) => {
                return handleDocumentForUser(user, fileUrl);
              });
    
              await Promise.all(promises);
            }
          } else {
            // Continue with the existing logic for single user
            handleSubmit(fileUrl);
          }
        } else {
          // Continue with the existing logic for single user
          handleSubmit();
        }
      } catch (error) {
        console.error("Error handling upload:", error);
        toast.error(error.message || "Error sending document. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    
    
    

    const handleSelectedUsers = (user) => {
      setSelectedUsers((prevSelectedUsers) => {
        const userIndex = prevSelectedUsers.findIndex((u) => u.id === user.id);
        if (userIndex !== -1) {
          return prevSelectedUsers.filter((u) => u.id !== user.id);
        } else {
          return [...prevSelectedUsers, user];
        }
      });
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
              <Button onClick={generateRandomCode} disabled={multipe}>Generate</Button>
            </Form.Group>
            <Form.Label>Sender</Form.Label>
            <Form.Control
              type="text"
              value={
                (users &&
                  users.find((user) => user.id === props.currentUser.uid)
                    ?.fullName) ||
                ""
              }
              className="mb-3"
              disabled
            />
            <ListGroup horizontal className="my-2">
              <ListGroup.Item
                className={!multipe ? "bg-primary" : ""}
                onClick={() => {
                  setMultiple(false);
                  setSelectedUsers([]);
                }}
              >
                Single
              </ListGroup.Item>
              <ListGroup.Item
                className={multipe ? "bg-primary" : ""}
                onClick={() => {setMultiple(true)}}
              >
                Multiple
              </ListGroup.Item>
            </ListGroup>
            {currentPage == "internal" && (
              <>
                {!multipe ? (
                  <Form.Select
                    onChange={(e) => setReciever(e.target.value)}
                    className="mb-3"
                  >
                    <option key={0} value={0}>
                      Please select a receiever
                    </option>
                    <option
                      className="bg-primary text-white"
                      key={0}
                      value={props.currentUser.uid}
                    >
                      Send to all
                    </option>
                    {users &&
                      users.map((user) => {
                        if (
                          user.id !== props.currentUser.uid &&
                          getOfficeStatus(user.office) == "Active"
                        ) {
                          return (
                            <option
                              className={`${
                                user.role == "admin" ? "bg-info text-white" : ""
                              }`}
                              key={user.id}
                              value={user.id}
                            >
                              {user.fullName}
                            </option>
                          );
                        }
                      })}
                  </Form.Select>
                ) : (
                  <div className="row">
                    {users.map((user) => {
                      if (user.id !== auth.currentUser.uid) {
                        return (
                          <div className="col-lg-4">
                            <InputGroup className="mb-3 bg-seconary">
                              <Form.Control
                                className="bg-primary"
                                value={user.fullName}
                                aria-label="Text input with checkbox"
                              />
                              <InputGroup.Checkbox
                                onChange={() => handleSelectedUsers(user)}
                                aria-label="Checkbox for following text input"
                              />
                            </InputGroup>
                          </div>
                        );
                      }
                    })}
                  </div>
                )}
              </>
            )}

            {currentPage == "external" && (
              <Form.Control
                type="text"
                onChange={(e) => setReciever(e.target.value)}
              />
            )}

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
              <Form.Label> {"Description (Optional)"} </Form.Label>
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
                <Datetime
                  onChange={(e) => {
                    setDueDate(moment(e).format("LLL"));
                  }}
                />
              </div>
              <div className="col-lg-6">
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
              </div>
              <div className="col-lg-6">
                <Form.Label>Document Flow</Form.Label>
                <Form.Control
                  type="text"
                  className="mb-3"
                  defaultValue={
                    currentPage === "internal" ? "Internal" : "External"
                  }
                  disabled
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
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                />
              </Form.Group>
            </Form.Group>
          </Modal.Body>
        )}
        <Modal.Footer>
          {!loading && (
            <Button
              variant="primary"
              onClick={() => {
                if (validateForm()) {
                  setShow(true);
                } else {
                  toast.error("Pleae fill up the form completely");
                }
              }}
            >
              Send Document
            </Button>
          )}
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
      setCurrentMessage(message);
      setDeleteModal(true);
      // try {
      //   const docRef = doc(db, "messages", message.id);
      //   deleteDoc(docRef).then(() => toast.success("Successfully Deleted!"));
      // } catch (error) {
      //   toast.error(error.message);
      // }
    };
    return (
      <Dropdown>
        <Dropdown.Toggle variant="secondary" id="dropdown-basic">
          <img src="./assets/images/pepicons-pencil_dots-y.png" alt="" />
        </Dropdown.Toggle>
        <Dropdown.Menu>
          <Dropdown.Item
            onClick={() => {
              setShowViewModal(true);
              setCurrentMessage(message);
            }}
          >
            View Detail <FaEye />
          </Dropdown.Item>
          <Dropdown.Item onClick={downloadFIle}>
            Download <FaDownload />
          </Dropdown.Item>
          <Dropdown.Item onClick={handleDelete}>
            Delete <FaTrash />
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
      const docRef = doc(db, "outgoing-external", message.id);
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
              setShowViewModal(true);
              setCurrentMessage(message);
            }}
          >
            View Detail <FaEye />
          </Dropdown.Item>
          <Dropdown.Item onClick={handleDelete}>
            Delete <FaTrash />
          </Dropdown.Item>
          <Dropdown.Item onClick={downloadFIle}>
            Download <FaDownload />
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
    //Offices
    onSnapshot(officeCollection, (snapshot) => {
      const offices = [];
      snapshot.docs.forEach((doc) => {
        offices.push({ ...doc.data(), id: doc.id });
      });
      setOffices(offices);
    });
    getDoc(doc(db, "sms", "sms")).then((doc) => {
      setEnableSMS(doc.data().enable);
    });
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
          if (message.sender == auth.currentUser.uid) {
            messages.push(message);
          }
        });
        setMessages(messages);
      },
      (error) => {
        console.error("Error listening to collection:", error);
      }
    );
    const q2 = query(outgoingExternal, orderBy("createdAt", "desc"));
    onSnapshot(q2, (snapshot) => {
      const messages = [];
      snapshot.docs.forEach((doc) => {
        const message = { ...doc.data(), id: doc.id };
        if (message.sender === auth.currentUser.uid) {
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
    const sender = getUser(message.sender);
    if (
      message.code.toLowerCase().startsWith(search.toLowerCase()) ||
      message.fileName.toLowerCase().startsWith(search.toLowerCase()) ||
      sender.fullName.toLowerCase().startsWith(search.toLowerCase()) ||
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
    });
  return (
    <LayoutUser>
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
          outgoing={true}
          currentMessage={currentMessage}
          resetCurrentMessage={() => setCurrentMessage(null)}
          closeModal={() => setShowViewModal(false)}
          showModal={showViewModal}
          currentPage={currentPage}
        />
      )}
      {auth.currentUser && (
        <ComposeModal
          show={modalShow}
          onHide={() => setModalShow(false)}
          currentUser={auth.currentUser}
        />
      )}
      <DeleteModal />
      <div className="dashboard">
        <div className="dashboard-content mx-3 mt-3">
          <div className="row">
            <div className="wrapper col-lg-8">
              <h2 className="fw-bold my-3 mx-2">
                Outgoing Documents
                <FaInbox className="mx-2" />
              </h2>
              <div
                className="bg-info mx-2 mb-3"
                style={{ width: "200px", height: "10px", borderRadius: 20 }}
              ></div>
            </div>
            {currentPage == "internal" && (
              <div className="col-lg-4 flex justify-content-end">
                <img
                  style={{ width: "150px", cursor: "pointer" }}
                  onClick={() => setModalShow(true)}
                  className="mx-3"
                  src="./assets/images/Group 8779.png"
                  alt=""
                />
              </div>
            )}
          </div>
          <div className="row">
            <div className="col-lg-5 flex justify-content-start">
              <ListGroup horizontal>
                <ListGroup.Item
                  className={`${
                    currentPage == "internal" ? "bg-info text-white" : ""
                  } px-5 fw-bold`}
                  onClick={() => setCurrentPage("internal")}
                  disabled
                >
                  Internal
                </ListGroup.Item>
              </ListGroup>
              <ListGroup className="col-lg-4 d-flex flex-column gap-2  m-0 p-0">
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

            <div className="flex col-lg-2 justify-content-start">
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
            <div className="flex justify-content-end col">
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
            <Table responsive="md" bordered hover variant="white">
              <thead>
                <tr>
                  <th>DocID</th>
                  <th>Subject</th>
                  <th>File Name</th>
                  <th>Reciever</th>
                  <th>Required Action</th>
                  <th>Date</th>
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
                        {message.sender == message.reciever ? (
                          "Send to all"
                        ) : (
                          <>
                            {getUser(message.reciever).fullName} -
                            <b> {getUser(message.reciever).position}</b>
                          </>
                        )}
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
              {externalMessages && (
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
                            setShowViewModal(true);
                          }}
                        >
                          <div
                            style={{ textDecoration: "underline" }}
                            className="text-dark fw-bold"
                          >
                            {message.fileName}
                          </div>
                        </td>{" "}
                        <td>{message.reciever} -</td>
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
              )}
            </Table>
          )}
        </div>
      </div>
    </LayoutUser>
  );
};
export default UserOutgoing;
