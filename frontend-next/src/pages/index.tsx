import useTranscripts from "@/hooks/useTranscripts";
import QueueTable from "@/components/queueTable/QueueTable";

export default function Home() {
  const { data, isLoading, isRefetching, isError, refetch } =
    useTranscripts().transcripts;

  return (
    <>
      <QueueTable
        data={data}
        isLoading={isLoading || isRefetching}
        isError={isError}
        refetch={refetch}
      />
    </>
  );
}
