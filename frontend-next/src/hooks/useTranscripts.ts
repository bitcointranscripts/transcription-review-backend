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
  const getSingleTranscripts = async (transcriptId: number): Promise<any> => {
    return axios
      .get(endpoints.GET_TRANSCRIPTS_BY_ID(transcriptId || 0))
      .then((res) => res.data)
      .catch((err) => err);
  };

  const transcripts = useQuery("trancripts", getAllTranscripts, {
    refetchOnWindowFocus: false,
  });

  const SingleTranscript = (transcriptId: number) =>
    useQuery(
      `transcript_${transcriptId}`,
      () => getSingleTranscripts(transcriptId),
      {
        refetchOnWindowFocus: false,
      }
    );

  return { transcripts, SingleTranscript };
};

export default useTranscripts;
