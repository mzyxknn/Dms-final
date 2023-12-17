import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { Offcanvas } from "react-bootstrap";
import {
  FaCheck,
  FaCheckCircle,
  FaCross,
  FaEnvelope,
  FaExclamationCircle,
  FaEye,
  FaFile,
} from "react-icons/fa";
import moment from "moment";
import BounceLoader from "react-spinners/BounceLoader";

const Routing = (props) => {
  const { currentMessage } = props;
  const [routing, setRouting] = useState();
  const [allCreated, setAllCreated] = useState();
  const [allSeeners, setAllSeeners] = useState([]);
  const [allReceiver, setAllReceiver] = useState([]);
  const [allRejectors, setAllRejectors] = useState([]);

  const isAll = currentMessage.sender == currentMessage.reciever;

  const getRouting = (currentMessage) => {
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

    const allReceiverCollection = collection(
      db,
      "routing",
      currentMessage.id,
      "sendAll",
      "receivers",
      "allReceivers"
    );

    onSnapshot(allReceiverCollection, (snapshot) => {
      const output = [];
      snapshot.docs.forEach((doc) => {
        output.push({ ...doc.data(), id: doc.id });
      });
      setAllReceiver(output);
    });
    const allRejectorsCollection = collection(
      db,
      "routing",
      currentMessage.id,
      "sendAll",
      "rejectors",
      "allRejectors"
    );

    onSnapshot(allRejectorsCollection, (snapshot) => {
      const output = [];
      snapshot.docs.forEach((doc) => {
        output.push({ ...doc.data(), id: doc.id });
      });
      setAllRejectors(output);
    });
  };

  useEffect(() => {
    getRouting(currentMessage);
  }, [currentMessage]);

  let lastItem = 0;

  if (routing) {
    lastItem = routing.length - 1;
  }

  const filteredSeeners = allSeeners.filter(
    (obj, index, self) =>
      index === self.findIndex((o) => o.seener === obj.seener)
  );

  return (
    <>
      <Offcanvas
        placement="end"
        show={props.showRouting}
        onHide={props.handleCloseRouting}
      >
        <Offcanvas.Header className="bg-primary text-white" closeButton>
          <Offcanvas.Title>Document Routing</Offcanvas.Title>
        </Offcanvas.Header>
        {!isAll ? (
          <Offcanvas.Body className="m-3">
            {routing &&
              routing.map((route, index) => {
                return (
                  <div key={index} className="div">
                    <div className="row">
                      {route.createdAt && (
                        <div
                          style={{ opacity: lastItem == index ? 1 : 0.6 }}
                          className="col-5 py-4 d-flex justify-content-start alig-items-start"
                        >
                          {moment(route.createdAt.toDate()).format("LLL")}
                        </div>
                      )}

                      <div
                        style={{ opacity: lastItem == index ? 1 : 0.6 }}
                        className="col-2 flex flex-column"
                      >
                        <div
                          className="div "
                          style={{
                            height: "100%",
                            width: "2px",
                            background: "gray",
                          }}
                        ></div>
                        {route.status == "Received" && (
                          <FaFile color="green" size={30} className="my-1" />
                        )}
                        {route.status == "Seen" && (
                          <FaEye size={30} className="my-1" />
                        )}
                        {route.status == "Created" && (
                          <FaCheckCircle size={30} className="my-1" />
                        )}
                        {route.status == "Rejected" && (
                          <FaExclamationCircle
                            color="red"
                            size={30}
                            className="my-1"
                          />
                        )}{" "}
                        {route.status == "Pending" && (
                          <FaEnvelope size={30} className="my-1" />
                        )}{" "}
                      </div>
                      <div
                        style={{ opacity: lastItem == index ? 1 : 0.6 }}
                        className="col-5 py-4 text-left"
                      >
                        <h5
                          className={`fw-bold ${
                            route.status == "Received" ? "text-primary" : ""
                          }  ${
                            route.status == "Rejected" ? "text-danger" : ""
                          }`}
                        >
                          {route.status}
                        </h5>
                        {route.status == "Created" && (
                          <p style={{ fontSize: "13px", fontStyle: "italic" }}>
                            your document has been created
                          </p>
                        )}
                        {route.status == "Seen" && (
                          <p style={{ fontSize: "13px", fontStyle: "italic" }}>
                            your document has been seen by <b>{route.seener}</b>
                          </p>
                        )}
                        {route.status == "Received" && (
                          <p style={{ fontSize: "13px", fontStyle: "italic" }}>
                            your document has been successfully Received
                          </p>
                        )}
                        {route.status == "Rejected" && (
                          <p style={{ fontSize: "13px", fontStyle: "italic" }}>
                            your document has been seen Rejected
                          </p>
                        )}

                        {route.status == "Pending" && (
                          <p style={{ fontSize: "13px", fontStyle: "italic" }}>
                            your document has been sent, waiting for action
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </Offcanvas.Body>
        ) : (
          <Offcanvas.Body className="m-3">
            <div className="div">
              <div className="row">
                {allCreated && (
                  <div className="col-5 py-4 d-flex justify-content-start alig-items-start">
                    {moment(allCreated.createdAt.toDate()).format("LLL")}
                  </div>
                )}

                <div className="col-2 flex flex-column">
                  <div
                    className="div "
                    style={{
                      height: "100%",
                      width: "2px",
                      background: "gray",
                    }}
                  ></div>

                  <FaCheckCircle size={30} className="my-1" />
                </div>
                <div className="col-5 py-4 text-left">
                  <h5>Created</h5>
                  <p style={{ fontSize: "13px", fontStyle: "italic" }}>
                    your document has been created
                  </p>
                </div>
              </div>
            </div>
            <h5 className="fw-bold mb-3 mt-2">Seen by these users:</h5>
            <div
              className="seeners-wrapper p-3 shadow-lg"
              style={{ height: "350px", overflow: "scroll" }}
            >
              {allSeeners &&
                filteredSeeners.map((seener) => {
                  return (
                    <div key={seener.id} className="row">
                      <div className="col-6 text-left">
                        <p>{seener.seener}</p>
                      </div>
                      <div className="col-6 text-center">
                        {seener.createdAt && (
                          <p>
                            {moment(seener.createdAt.toDate()).format("LLL")}
                            <FaEye className="mx-2" />
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
            <h5 className="fw-bold mb-3 mt-4">Recieved by these users:</h5>
            <div
              className="seeners-wrapper p-3 shadow-lg"
              style={{ height: "350px", overflow: "scroll" }}
            >
              {allReceiver &&
                allReceiver.map((seener) => {
                  return (
                    <div key={seener.id} className="row">
                      <div className="col-6 text-left">
                        <p>{seener.seener}</p>
                      </div>
                      <div className="col-6 text-center">
                        {seener.createdAt && (
                          <p>
                            {moment(seener.createdAt.toDate()).format("LLL")}
                            <FaEye className="mx-2" />
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
            <h5 className="fw-bold mb-3 mt-4">Rejected by these users:</h5>
            <div
              className="seeners-wrapper p-3 shadow-lg"
              style={{ height: "350px", overflow: "scroll" }}
            >
              {allSeeners &&
                allRejectors.map((seener) => {
                  return (
                    <div key={seener.id} className="row">
                      <div className="col-6 text-left">
                        <p>{seener.seener}</p>
                      </div>
                      <div className="col-6 text-center">
                        {seener.createdAt && (
                          <p>
                            {moment(seener.createdAt.toDate()).format("LLL")}
                            <FaEye className="mx-2" />
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </Offcanvas.Body>
        )}
      </Offcanvas>
    </>
  );
};

export default Routing;
