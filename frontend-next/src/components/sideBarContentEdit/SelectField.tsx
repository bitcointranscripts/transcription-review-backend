import {
  Button,
  Flex,
  FormControl,
  IconButton,
  Input,
  Text,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { BiCheck, BiPencil, BiX } from "react-icons/bi";

const SelectField = ({ name, data, editedData, updateData }: any) => {
  let _data = data;
  if (_data[0] === "[") {
    // eslint-disable-next-line prettier/prettier
    _data = _data
      .substring(1, _data.length - 1)
      .replaceAll("'", "")
      .split(", ");
  } else if (!Array.isArray(_data)) {
    _data = [];
  }
  if (editedData.length) {
    _data = editedData;
  }
  const [isNew, setIsNew] = useState(false);

  const handleUpdateEdit = (value: string, idx: number, name?: string) => {
    if (name && name === "remove") {
      return;
    }
    let updatedSpeakers = [..._data];
    if (!value.trim()) {
      // console.log("remove idx", idx)
      updatedSpeakers.splice(idx, 1);
    } else {
      updatedSpeakers[idx] = value;
    }
    updateData(updatedSpeakers);
  };

  const handleNewSpeaker = (value: string, idx: number, name?: string) => {
    setIsNew(false);
    if (name && name === "remove") {
      return;
    }
    let updatedSpeakers = [..._data];
    if (!value) {
      return;
    } else {
      updatedSpeakers.push(value);
    }
    updateData(updatedSpeakers);
  };

  return (
    <>
      {_data?.map((speaker: string, idx: number) => {
        return (
          <SelectBox
            key={speaker}
            speaker={speaker}
            idx={idx}
            handleUpdateEdit={handleUpdateEdit}
          />
        );
      })}
      {isNew ? (
        <SelectBox
          speaker=""
          idx={-1}
          handleUpdateEdit={handleNewSpeaker}
          isNew={isNew}
        />
      ) : (
        <Button
          ml="auto"
          variant="ghost"
          colorScheme="blue"
          size="sm"
          onClick={() => setIsNew(true)}
        >
          <Text textTransform="uppercase" fontSize="12px">
            Add {name} +
          </Text>
        </Button>
      )}
    </>
  );
};

const SelectBox = ({
  speaker,
  idx,
  handleUpdateEdit,
  isNew,
}: {
  speaker: string;
  idx: number;
  // eslint-disable-next-line no-unused-vars
  handleUpdateEdit: (state: string, idx: number, name?: string) => void;
  isNew?: boolean;
}) => {
  const [isEdit, setIsEdit] = useState(isNew);
  const [state, setState] = useState(speaker);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value;
    setState(inputValue);
  };
  const handleIndividualEdit = (e: React.MouseEvent<HTMLButtonElement>) => {
    const name = e.currentTarget.name;
    setIsEdit(false);
    handleUpdateEdit(state, idx, name);
  };

  useEffect(() => {
    if (isEdit) {
      inputRef.current?.focus();
    }
  }, [isEdit]);

  return (
    <>
      {isEdit ? (
        <FormControl>
          <Flex gap={1} alignItems="center">
            <Input
              p={1}
              h="auto"
              fontSize="inherit"
              value={state}
              onChange={handleInputChange}
              ref={inputRef}
            />
            <Flex direction="row" justifyContent="space-around" gap={1}>
              <IconButton
                name="add"
                size="sm"
                fontSize="16px"
                colorScheme="green"
                variant="outline"
                onClick={handleIndividualEdit}
                aria-label="confirm speaker editing"
                icon={<BiCheck />}
              />
              <IconButton
                name="remove"
                size="sm"
                fontSize="16px"
                colorScheme="red"
                variant="outline"
                onClick={handleIndividualEdit}
                aria-label="reject speaker editing"
                icon={<BiX />}
              />
            </Flex>
          </Flex>
        </FormControl>
      ) : (
        <Flex justifyContent="space-between" gap={1} alignItems="center">
          <Text fontSize="14px">{speaker}</Text>
          <IconButton
            fontSize="16px"
            p="6px"
            size="sm"
            minW="auto"
            h="auto"
            variant="ghost"
            onClick={() => setIsEdit(true)}
            aria-label="edit speaker"
            icon={<BiPencil />}
          />
        </Flex>
      )}
    </>
  );
};

export default SelectField;
