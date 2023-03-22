const GET_TRANSCRIPTS = () => `transcripts`;

const GET_TRANSCRIPTS_BY_ID = (id: number) => `transcripts/${id}`;

const endpoints = {
  GET_TRANSCRIPTS,
  GET_TRANSCRIPTS_BY_ID,
};

export default endpoints;
