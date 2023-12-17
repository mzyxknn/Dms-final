import React, { useState, useEffect } from 'react';
import { Modal, Button, Table, Form } from 'react-bootstrap';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import moment from "moment";

// ... (previous imports)

const FileDirectoryModal = ({ showModal, handleCloseModal, handleSelectFile }) => {
  const [fileData, setFileData] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [currentFolder, setCurrentFolder] = useState('files');

  useEffect(() => {
    fetchData(currentFolder);
  }, [currentFolder]);

  const fetchData = async (folderName) => {
    if (auth.currentUser) {
      const q = query(collection(db, 'storage', auth.currentUser.uid, folderName), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      setFileData(data);
    }
  };
  

  const handleCheckboxChange = (fileId) => {
    const updatedSelection = [...selectedFiles];
    const index = updatedSelection.indexOf(fileId);

    if (index === -1) {
      updatedSelection.push(fileId);
    } else {
      updatedSelection.splice(index, 1);
    }

    setSelectedFiles(updatedSelection);
  };

  const handleFolderClick = (folderName) => {
    setCurrentFolder(folderName);
  };

  const handleBackClick = () => {
    // Handle going back to the parent folder
    const parts = currentFolder.split('/');
    parts.pop(); // Remove the current folder
    const parentFolder = parts.join('/');
    setCurrentFolder(parentFolder || 'files'); // Ensure there's always a folder (default to 'files')
  };
  const handleSelectFileLocal = () => {
    // Pass the selected files to the handler in ComposeModal
    handleSelectFile(selectedFiles);
    // Close the FileDirectoryModal
    handleCloseModal();
  };

  return (
    <Modal show={showModal} onHide={handleCloseModal}>
      <Modal.Header closeButton>
        <Modal.Title>Select a File</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {currentFolder !== 'files' && (
          <Button variant="link" onClick={handleBackClick}>
            Back
          </Button>
        )}
        <Table responsive bordered>
          <thead>
            <tr>
              <th>File Name</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {fileData.map((file) => (
              <tr key={file.id}>
                <td>
                  {file.isFolder ? (
                    <Button variant="link" onClick={() => handleFolderClick(file.fileName)}>
                      {file.fileName}
                    </Button>
                  ) : (
                    <>
                      <Form.Check
                        type="checkbox"
                        id={`fileCheckbox-${file.id}`}
                        label={file.fileName}
                        checked={selectedFiles.includes(file.id)}
                        onChange={() => handleCheckboxChange(file.id)}
                      />
                    </>
                  )}
                </td>
                {file.createdAt && (
                  <td>
                    {moment(file.createdAt.toDate()).format('LLL')}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleCloseModal}>
          Close
        </Button>
        <Button variant="primary" onClick={handleSelectFileLocal}>
          Select
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default FileDirectoryModal;
