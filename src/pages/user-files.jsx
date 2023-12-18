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
import { saveAs } from "file-saver";
import JSZip from "jszip";

const UserFiles = () => {
  const [storages, setStorages] = useState([]);
  const [currentFolder, setCurrentFolder] = useState("files");
  const [loading, setLoading] = useState(false);
  const [offices, setOffices] = useState([]);
  const [view, setView] = useState("list");
  const [sort, setSort] = useState("a-z");
  const [files, setFiles] = useState([]);

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

  const getFolderData = (folderName) => {
    const q = query(
      collection(db, "storage", auth.currentUser.uid, folderName),
      orderBy("createdAt", "desc")
    );

    return getDocs(q).then((snapshot) => {
      const res = [];
      snapshot.docs.forEach((doc) => {
        const file = doc.data();
        res.push(file);
      });
      return res;
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
    const [files, setFiles] = useState([]);

    const handleClose = () => {
      setShow(false);
      setFiles([]); // Clear selected files after closing the modal
    };

    const handleShow = () => setShow(true);

    const createFiles = async () => {
      console.log("Files:", files); // Log files before map
      setLoading(true);

      try {
        // Ensure files is an array
        const filesArray = Array.isArray(files) ? files : [files];

        if (filesArray.length > 0) {
          const uploadPromises = filesArray.map(async (file) => {
            const storageRef = ref(storage, `uploads/${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);

            return {
              fileName: file.name,
              fileURL: url,
              owner: auth.currentUser.uid,
              isFolder: false,
              createdAt: serverTimestamp(),
            };
          });

          const results = await Promise.allSettled(uploadPromises);

          const successfulUploads = results
            .filter((result) => result.status === "fulfilled")
            .map((result) => result.value);

          if (successfulUploads.length > 0) {
            const docRef = collection(
              db,
              "storage",
              auth.currentUser.uid,
              currentFolder
            );
            await Promise.all(
              successfulUploads.map((fileData) => addDoc(docRef, fileData))
            );

            handleClose();
            setLoading(false);
          } else {
            toast.error("No files were successfully uploaded!");
            setLoading(false);
          }
        } else {
          toast.error("No files selected!");
          setLoading(false);
        }
      } catch (error) {
        console.error("Error uploading files:", error);
        toast.error("Error uploading files. Please try again.");
        setLoading(false);
      }
    };

    return (
      <>
        <Button className="mx-3" variant="primary " onClick={handleShow}>
          <h6 className="fw-bold text-white px-3 mb-0 py-1">Upload Files</h6>
        </Button>{" "}
        <Modal size="lg" show={show} onHide={handleClose}>
          <Modal.Header className="bg-primary" closeButton>
            <Modal.Title>File Name</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <input
              onChange={(e) => setFiles(Array.from(e.target.files))}
              type="file"
              className="form-control"
              placeholder="Select Files"
              multiple
            />
          </Modal.Body>

          <Modal.Footer>
            <Button onClick={createFiles}>Upload Files</Button>
          </Modal.Footer>
        </Modal>
      </>
    );
  }

  const downloadZip = async (folder) => {
    const res = await getFolderData(folder);
    if (res.length >= 1) {
      const zip = new JSZip();
      // Fetch files from URIs and add them to the zip
      const fetchAndAddToZip = async (uri, fileName) => {
        const response = await fetch(uri);
        const blob = await response.blob();
        zip.file(fileName, blob);
      };
      const fetchPromises = res.map(({ fileURL, fileName }) =>
        fetchAndAddToZip(fileURL, fileName)
      );
      await Promise.all(fetchPromises);
      // Generate the zip file
      const zipBlob = await zip.generateAsync({ type: "blob" });
      // Save the zip file
      saveAs(zipBlob, folder + ".zip");
    } else {
      toast.error("The folder is empty!");
    }
  };

  const downloadFile = (file) => {
    saveAs(file, file);
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
          <Dropdown.Toggle
            variant="secondary"
            id="dropdown-basic"
          ></Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item onClick={handleDelete}>Delete</Dropdown.Item>
            <Dropdown.Item
              onClick={async () => {
                if (!storage.isFolder) {
                  downloadFile(storage.fileURL);
                } else {
                  downloadZip(storage.fileName);
                }
              }}
            >
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

  return (
    <LayoutUser>
      <div className="App"></div>
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
              <th>File Name</th>
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
                    } else if (storage.fileURL.toLowerCase().endsWith(".pdf")) {
                      // Open PDF file in a viewer
                      window.open(storage.fileURL, "_blank");
                    } else {
                      // Handle other file types or actions
                      downloadFile(storage.fileURL);
                    }
                  }}
                >
                  {storage.fileName}
                </td>
                {storage.createdAt && (
                  <td>{moment(storage.createdAt.toDate()).format("LLL")}</td>
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
