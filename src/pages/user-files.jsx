import { FaEye, FaFile, FaFolder } from "react-icons/fa";
import LayoutUser from "../layout/layoutUser";
import {
  Breadcrumb,
  Button,
  Dropdown,
  ListGroup,
  Modal,
  Table,
} from "react-bootstrap";
import { useEffect, useState } from "react";
import { Form } from "react-router-dom";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db, storage } from "../../firebase";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { BarLoader } from "react-spinners";
import { toast } from "react-toastify";
import moment from "moment";
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";

const UserFiles = () => {
  const [storages, setStorages] = useState([]);
  const [currentFolder, setCurrentFolder] = useState("files");
  const [loading, setLoading] = useState(false);
  const [offices, setOffices] = useState([]);
  const [view, setView] = useState("list");
  const [sort, setSort] = useState("a-z");

  const sortData = () => {
    const sortedData = [...storages].sort((a, b) => {
      if (sort === "a-z") {
        return a.fileName.localeCompare(b.fileName);
      } else {
        return b.fileName.localeCompare(a.fileName);
      }
    });

    setStorages(sortedData);
  };

  useEffect(() => {
    sortData();
  }, [sort]);

  const fetchData = () => {
    setCurrentFolder("files");

    getDocs(collection(db, "offices")).then((res) => {
      const offices = [];
      res.docs.forEach((doc) => {
        offices.push({ ...doc.data(), id: doc.id });
      });
      setOffices(offices);
    });

    const q = query(
      collection(db, "storage", auth.currentUser.uid, "files"),
      orderBy("createdAt", "desc")
    );
    onSnapshot(q, (snapshot) => {
      const storages = [];
      snapshot.docs.forEach((doc) => {
        const data = { ...doc.data(), id: doc.id };
        storages.push(data);
      });
      setStorages(storages);
    });
  };

  const fetchFolder = (folderName) => {
    const q = query(
      collection(db, "storage", auth.currentUser.uid, folderName),
      orderBy("createdAt", "desc")
    );
    onSnapshot(q, (snapshot) => {
      const storages = [];
      snapshot.docs.forEach((doc) => {
        const data = { ...doc.data(), id: doc.id };
        storages.push(data);
      });
      setStorages(storages);
    });
  };

  function AddFolder(props) {
    const [show, setShow] = useState(false);
    const [folders, setFolders] = useState();
    const [folderName, setFolderName] = useState(null);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const createFolder = () => {
      const data = {
        owner: auth.currentUser.uid,
        isFolder: true,
        fileName: folderName,
        createdAt: serverTimestamp(),
      };
      addDoc(collection(db, "storage", auth.currentUser.uid, "files"), data);
    };

    return (
      <>
        <Button variant="primary " onClick={handleShow}>
          <h6 className="fw-bold text-white px-3 mb-0 py-1">Add Folder</h6>
        </Button>{" "}
        <Modal size="lg" show={show} onHide={handleClose}>
          <Modal.Header className="bg-primary" closeButton>
            <Modal.Title>Folder Name</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <input
              onChange={(e) => setFolderName(e.target.value)}
              type="text"
              className="form-control"
              placeholder="Folder Name"
            />{" "}
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={createFolder}>Add Folder</Button>
          </Modal.Footer>
        </Modal>
      </>
    );
  }

  function AddFile(props) {
    const [show, setShow] = useState(false);
    const [file, setFile] = useState(null);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const createFile = () => {
      setLoading(true);
      if (file) {
        const storageRef = ref(storage, `uploads/${file.name}`);
        uploadBytes(storageRef, file).then((snapshot) => {
          getDownloadURL(storageRef)
            .then((url) => {
              if (url) {
                addDoc(
                  collection(
                    db,
                    "storage",
                    auth.currentUser.uid,
                    currentFolder
                  ),
                  {
                    fileName: file.name,
                    fileURL: url,
                    owner: auth.currentUser.uid,
                    isFolder: false,
                    createdAt: serverTimestamp(),
                  }
                );
                handleClose();
                setLoading(false);
              }
            })
            .catch((error) => {
              console.error("Error getting download URL:", error);
            });
        });
      } else {
        toast.error("There's no file!");
        setLoading(false);
      }
    };

    return (
      <>
        <Button className="mx-3" variant="primary " onClick={handleShow}>
          <h6 className="fw-bold text-white px-3 mb-0 py-1">Upload File</h6>
        </Button>{" "}
        <Modal size="lg" show={show} onHide={handleClose}>
          <Modal.Header className="bg-primary" closeButton>
            <Modal.Title>File Name</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <input
              onChange={(e) => setFile(e.target.files[0])}
              type="file"
              className="form-control"
              placeholder="Folder Name"
            />{" "}
          </Modal.Body>

          <Modal.Footer>
            <Button onClick={createFile}>Upload File</Button>
          </Modal.Footer>
        </Modal>
      </>
    );
  }

  const downloadFile = (file) => {
    console.log(file);
    const fileUrl = file;
    const link = document.createElement("a");
    link.href = fileUrl;
    link.target = "_blank";
    link.download = "downloaded_file";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  function DropdownAction({ storage }) {
    const [showModal, setShowModal] = useState(false);
  
    const handleDelete = async () => {
      setShowModal(true);
    };
  
    const handleConfirmDelete = async () => {
      // Perform deletion logic here
      if (currentFolder !== "files") {
        const docMessage = doc(
          db,
          "storage",
          auth.currentUser.uid,
          currentFolder,
          storage.id
        );
        deleteDoc(docMessage).then(() =>
          toast.success("Successfully Deleted!")
        );
      } else {
        const docMessage = doc(
          db,
          "storage",
          auth.currentUser.uid,
          "files",
          storage.id
        );
        deleteDoc(docMessage).then(() =>
          toast.success("Successfully Deleted!")
        );
      }
  
      setShowModal(false);
    };
  
    const handleCancelDelete = () => {
      setShowModal(false);
    };
  
    return (
      <>
        <Dropdown>
          <Dropdown.Toggle variant="secondary" id="dropdown-basic"></Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item onClick={handleDelete}>Delete</Dropdown.Item>
            <Dropdown.Item onClick={() => downloadFile(storage.fileURL)}>
              Download File
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
  
        <Modal show={showModal} onHide={handleCancelDelete}>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Deletion</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Are you sure you want to delete {storage.fileName}?
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCancelDelete}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </Modal.Footer>
        </Modal>
      </>
    );
  }

  useEffect(() => {
    if (auth.currentUser) {
      fetchData();
    }
  }, []);
  const tableHeadLabel = currentFolder === 'files' ? 'Folders' : 'Files';
  return (
    <LayoutUser>
      <div className="files-wrapper">
      <div className="row">
        <div className="col-lg-6">
          <div className="wrapper">
            <h2 className="fw-bold my-3 mx-2">
              Files Storage
              <FaFile className="mx-2" />
            </h2>
            <div
              className="bg-info mx-2 mb-3"
              style={{ width: "200px", height: "10px", borderRadius: 20 }}
            ></div>
          </div>
        </div>
        <div className="col-lg-6 flex">
          <div className="row">
            <div className="col-lg-6 flex justify-cotent-start align-items-center">
              <AddFolder />
              <AddFile />
            </div>
            
          </div>
          <ListGroup.Item style={{ border: "none" }}>
            <Button
              onClick={() => {
                if (sort === "a-z") {
                  setSort("z-a");
                } else {
                  setSort("a-z");
                }
              }}
            >
              Sort {sort}
            </Button>
          </ListGroup.Item>
        </div>
        <div className="col-12 mx-3">
          <Breadcrumb>
            <Breadcrumb.Item onClick={fetchData}>Files</Breadcrumb.Item>
            <Breadcrumb.Item active>
              {currentFolder === "files" ? "" : currentFolder}
            </Breadcrumb.Item>
          </Breadcrumb>
        </div>
      </div>

      {loading && (
        <div className="flex flex-column">
          <h3>Uploading file...</h3>
          <BarLoader />
        </div>
      )}

      <Table responsive="md" variant="white">

        <thead>
          <tr>
            <th>{tableHeadLabel}</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {storages.map((storage) => (
            <tr key={storage.id}>
              <td
                style={{ cursor: "pointer" }}
                onClick={() => {
                  if (storage.isFolder) {
                    setCurrentFolder(storage.fileName);
                    fetchFolder(storage.fileName);
                  }
                  if (!storage.isFolder) {
                    downloadFile(storage.fileURL);
                  }
                }}
              >
                {storage.fileName}
              </td>
              {storage.createdAt && (
                <td>
                  {moment(storage.createdAt.toDate()).format("LLL")}
                </td>
              )}
              <td>
                <DropdownAction storage={storage} />
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
    </LayoutUser>
  );
};

export default UserFiles;
