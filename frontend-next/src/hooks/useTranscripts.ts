import endpoints from "@/api/endpoints";
import { useQuery } from "react-query";
import axios from "../api/axios";

const useTranscripts = () => {
  const getAllTranscripts = async (): Promise<any> => {
    return axios
      .get(endpoints.GET_TRANSCRIPTS())
      .then((res) => res.data)
      .catch((err) => err);
  };

  const transcripts = useQuery("trancripts", getAllTranscripts, {
    refetchOnWindowFocus: false,
  });

  return { transcripts };
};

export default useTranscripts;
