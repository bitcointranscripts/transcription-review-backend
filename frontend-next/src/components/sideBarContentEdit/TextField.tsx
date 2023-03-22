import {
  Flex,
  FormControl,
  IconButton,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { useState } from "react";
import { BiCheck, BiPencil, BiX } from "react-icons/bi";

const TextField = ({ data, editedData, updateData }: any) => {
  const [isEdit, setIsEdit] = useState(false);
  const [state, setState] = useState(data);

  const handleUpdateEdit = () => {
    setIsEdit(false);
    updateData(state);
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let inputValue = e.target.value;
    setState(inputValue);
  };

  return (
    <>
      {isEdit ? (
        <FormControl>
          <Flex gap={2}>
            <Textarea
              p={1}
              // rows={1}
              fontSize="inherit"
              resize="none"
              value={state}
              onChange={handleInputChange}
            ></Textarea>
            <Flex direction="column" justifyContent="space-evenly">
              <IconButton
                fontSize="20px"
                p={1}
                size="sm"
                minW="auto"
                h="auto"
                colorScheme="green"
                variant="outline"
                onClick={handleUpdateEdit}
                aria-label="edit title"
                icon={<BiCheck />}
              />
              <IconButton
                fontSize="20px"
                p={1}
                size="sm"
                minW="auto"
                h="auto"
                colorScheme="red"
                variant="outline"
                onClick={() => setIsEdit(false)}
                aria-label="edit title"
                icon={<BiX />}
              />
            </Flex>
          </Flex>
        </FormControl>
      ) : (
        <Flex justifyContent="space-between" gap={1} alignItems="center">
          <Text>{editedData ? editedData : data}</Text>
          {/* <Button onClick={() => setIsEdit(true)}><BiPencil /></Button> */}
          <IconButton
            fontSize="16px"
            p="6px"
            size="sm"
            minW="auto"
            h="auto"
            variant="ghost"
            onClick={() => setIsEdit(true)}
            aria-label="edit title"
            icon={<BiPencil />}
          />
        </Flex>
      )}
    </>
  );
};

export default TextField;
