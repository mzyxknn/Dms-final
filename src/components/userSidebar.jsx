import { useState } from "react";
import {
  FaBars,
  FaHome,
  FaFile,
  FaFilePdf,
  FaFolder,
  FaUser,
  FaPeopleCarry,
  FaTrash,
  FaTimes,
} from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";

const UserSidebar = ({ onHide }) => {
  const location = useLocation().pathname;
  const [sidebarShow, setSidebarShow] = useState(true);

  return (
    <>
      <div className="flex flex-column relative">
        {!sidebarShow && (
          <FaBars
            style={{ position: "absolute", top: "2px", left: "2px" }}
            onClick={() => setSidebarShow(true)}
            size={"20px"}
            className="mt-3 mx-2"
          />
        )}
        <div className={`sidebar vh-100 ${sidebarShow ? "" : "inactive"}`}>
          <div className="w-100 d-flex justify-content-end aling-items-center">
            <FaTimes onClick={onHide} size={"25"} />
          </div>
          <div className="sidebar-header d-flex justify-content-center align-items-center flex-column">
            <div className="brand w-100 flex">
              <img width={"100px"} src="./assets/images/logo.png" alt="" />
            </div>
          </div>
          <div className="sidebar-content mx-3 mt-3">
            <h5 className="fw-bold b-1">Menu</h5>

            <div className="navigation mt-3 d-flex flex-column justify-content-start align-items-start">
              <Link
                to={"/user-files"}
                className={`flex my-2 nav-link w-100 justify-content-start p-1 py-2 ${
                  location == "/user-files" ? "active" : ""
                }`}
              >
                <FaFile size={"20px"} />
                <p className="mb-0 mx-2">Files</p>
              </Link>
              <Link
                className={`flex my-2 nav-link w-100 justify-content-start p-1 py-2 ${
                  location == "/user-reports" ? "active" : ""
                }`}
                to={"/user-reports"}
              >
                <FaFilePdf size={"20px"} />
                <p className="mb-0 mx-2">Reports</p>
              </Link>
              <Link
                to={"/user-outgoing"}
                className={`flex my-2 nav-link w-100 justify-content-start p-1 py-2 ${
                  location == "/user-outgoing" ? "active" : ""
                }`}
              >
                <FaFolder size={"20px"} />
                <p className="mb-0 mx-2">Outgoing</p>
              </Link>
              <Link
                to={"/user-incoming"}
                className={`flex my-2 nav-link w-100 justify-content-start p-1 py-2 ${
                  location == "/user-incoming" ? "active" : ""
                }`}
              >
                <FaFolder size={"20px"} />
                <p className="mb-0 mx-2">Incoming</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserSidebar;
