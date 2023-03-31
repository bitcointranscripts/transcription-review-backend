import { Transcript } from "../../../types";
// import dynamic from "next/dynamic";
import {
  Box,
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from "@chakra-ui/react";

import MdEditor, { ExposeParam, ToolbarNames } from "md-editor-rt";
import "md-editor-rt/lib/style.css";

import sanitize from "sanitize-html";

import { useEffect, useRef, useState } from "react";

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

  const editorRef = useRef<ExposeParam>();
  const [isPreviewOnly, setIsPreviewOnly] = useState(false);
  // Ensure editorData is updated
  const hasUpdatedEditorData = useRef<Boolean>(false);
  const [isModalOpen, setIsModalopen] = useState(false);

  // hijack params of mdEditor to change toolbar "preview" function
  useEffect(() => {
    editorRef.current?.on("preview", (state) => {
      setIsPreviewOnly(state);
    });
  }, []);

  // delays may prevent editor data from being synced with data, this ensures the sync
  useEffect(() => {
    if (
      data.originalContent?.body &&
      !mdData &&
      !hasUpdatedEditorData.current
    ) {
      update(data.originalContent?.body);
      hasUpdatedEditorData.current = true;
    }
    return () => {
      hasUpdatedEditorData.current = false;
    };
  }, [data, mdData, update]);

  // restoreOriginal content function
  const restoreOriginal = () => {
    update(data.originalContent?.body || "");
    setIsModalopen(false);
  };

  return (
    <>
      <Box
        flex="1 1 70%"
        w={{ base: "100%", md: "70%" }}
        display="flex"
        flexDir="column"
      >
        <Box my={2}>
          <Button
            colorScheme="gray"
            onClick={() => setIsModalopen(true)}
            size="xs"
            ml="auto"
            display="block"
            variant="outline"
          >
            Restore Original
          </Button>
        </Box>
        <Box h="full" id="simplemde-container-controller">
          <MdEditor
            ref={editorRef}
            className={isPreviewOnly ? "hide-editor" : ""}
            sanitize={sanitize}
            modelValue={mdData}
            onChange={update}
            language="en-US"
            toolbarsExclude={[
              "image",
              "table",
              "mermaid",
              "htmlPreview",
              "github",
              "prettier",
              "save",
              "code",
              "catalog",
              "katex",
            ]}
            preview={false}
            previewTheme="github"
            noMermaid
          />
        </Box>
      </Box>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalopen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Text align="center" fontWeight={600} fontSize="md" color="red.600">
              Restore Original
            </Text>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>Are you sure? All changes will be lost.</Text>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModalopen(false)}
              mr={2}
            >
              Cancel
            </Button>
            <Button
              // variant="outline"
              colorScheme="red"
              size="sm"
              onClick={restoreOriginal}
            >
              Yes, Restore!
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default EditTranscript;
