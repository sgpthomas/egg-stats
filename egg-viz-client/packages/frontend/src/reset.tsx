import { useContext } from "react";
import { Navigate, useParams } from "react-router-dom";
import { ServerConfigDispatchContext } from "@repo/chart";

export default function Reset() {
  localStorage.clear();

  const params = useParams();
  const dispatch = useContext(ServerConfigDispatchContext);
  if (dispatch !== undefined)
    dispatch({ port: params.port, buster: params.buster });

  return <Navigate to="/" replace={true} />;
}
