import { Transcript } from "../../../types";
import dynamic from "next/dynamic";
import { Box, Button, Flex, Text } from "@chakra-ui/react";

import MdEditor from "md-editor-rt";
import "md-editor-rt/lib/style.css";

import "easymde/dist/easymde.min.css";

const SimpleMdeReact = dynamic(() => import("react-simplemde-editor"), {
  ssr: false,
});

const EditTranscript = ({
  data,
  mdData,
  update,
}: {
  data: Transcript;
  mdData: string;
  // eslint-disable-next-line no-unused-vars
  update: (x: any) => void;
}) => {
  return (
    <Box flex="1 1 70%" w={{ base: "100%", md: "70%" }} display="flex" flexDirection="column">
      <Flex alignItems="center" justifyContent="space-between" my={2}>
        <Text>Transcription Text</Text>
        <Button
          colorScheme="red"
          onClick={() => update(data.originalContent?.body || "")}
          size="xs"
        >
          Restore Original
        </Button>
      </Flex>
      <Box h="full" id="simplemde-container-controller">
        <MdEditor modelValue={mdData} onChange={update} language="en-US" />
      </Box>
    </Box>
  );
};

export default EditTranscript;
