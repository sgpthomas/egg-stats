import { useContext } from "react";
import { Navigate, useParams } from "react-router-dom";
import { ServerConfigDispatchContext } from "../ServerContext";

export default function Reset() {
  localStorage.clear();

  const params = useParams();
  const dispatch = useContext(ServerConfigDispatchContext);
  if (dispatch !== undefined) dispatch(params.port);

  return <Navigate to="/" replace={true} />;
}
