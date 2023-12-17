import { useParams } from "react-router";
import Layout from "../layout/layout";

const MessageView = () => {
  const { docID } = useParams();

  return (
    <>
      <Layout>
        <h1>params {docID}</h1>
      </Layout>
    </>
  );
};

export default MessageView;
