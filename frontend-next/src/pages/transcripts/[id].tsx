/* eslint-disable no-unused-vars */
import { Button, Flex } from "@chakra-ui/react";
import { GetServerSideProps, NextPage } from "next";
import { useSession } from "next-auth/react";
import React, { useState } from "react";
import { Transcript } from "../../../types";
import SidebarContentEdit from "@/components/sideBarContentEdit/SidebarContentEdit";
import EditTranscript from "@/components/editTranscript/EditTranscript";

type Props = {
  data: Transcript;
};

const TranscriptPage: NextPage<Props> = ({ data }) => {
  const { status } = useSession();
  const [editedData, setEditedData] = useState(data.originalContent?.body ?? "");
  // if (status === "authenticated")

  if (status === "unauthenticated") {
    return <h4>You have to Login to view this page</h4>;
  }

  // if (data.status === "queued") {
  //   return <h4>Transcript has been claimed</h4>;
  // }

  const handleSave = (editedContent: any) => {
    return;
  };
  const handleSubmit = (editedContent: any) => {
    return;
  };

  return (
    <Flex gap={6} w="full" flexDir={{ base: "column", md: "row" }}>
      <SidebarContentEdit data={data}>
        {(editedContent) => (
          <Flex gap={2}>
            <Button
              size="sm"
              colorScheme="orange"
              variant="outline"
              onClick={() => handleSave(editedContent)}
            >
              Save
            </Button>
            <Button
              size="sm"
              colorScheme="orange"
              onClick={() => handleSubmit(editedContent)}
            >
              Submit
            </Button>
          </Flex>
        )}
      </SidebarContentEdit>
      <EditTranscript data={data} mdData={editedData} update={setEditedData} />
    </Flex>
  );
};

export const getServerSideProps: GetServerSideProps<{
  data: Transcript;
}> = async ({ params }) => {
  const id = params?.id;

  const fetchedData = await fetch(`${process.env.BASE_URL}/transcripts/${id}`);
  const data = await fetchedData.json();

  return {
    props: {
      data,
    },
  };
};

export default TranscriptPage;
