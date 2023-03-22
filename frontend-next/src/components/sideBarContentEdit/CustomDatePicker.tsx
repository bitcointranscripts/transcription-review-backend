import { Box, IconButton, Text } from "@chakra-ui/react";
import React, { useRef } from "react";
import { BiCalendarEdit } from "react-icons/bi";
import { dateFormatGeneral } from "@/utils";

const CustomDatePicker = ({
  date,
  onChange,
}: {
  date: string;
  onChange: (x: string) => void;
}) => {
  const dateRef = useRef<HTMLInputElement>(null);

  const showPicker = () => {
    if (dateRef.current) {
      dateRef.current.showPicker();
    }
  };

  const handleChange = () => {
    if (dateRef.current) {
      const dateInputVal = dateRef.current.value;
      const _generalFormat = dateFormatGeneral(
        dateInputVal as unknown as Date,
        true
      );
      if (typeof _generalFormat === "string") {
        onChange(_generalFormat);
      } else {
        onChange(dateInputVal);
      }
    }
  };
  return (
    <Box position="relative" w="100%" display="flex">
      <Box
        display="flex"
        flex="0 1 300px"
        onClick={showPicker}
        p={1}
        alignItems="center"
        justifyContent="space-between"
        gap={1}
        border="2px solid"
        borderColor="gray.200"
        borderRadius="lg"
      >
        <Text color="gray.600" ml={1}>
          {date}
        </Text>
        <IconButton
          aria-label="calendar"
          size="sm"
          fontSize="16px"
          icon={<BiCalendarEdit />}
        />
      </Box>
      <input
        style={{ position: "absolute", visibility: "hidden", right: 0 }}
        ref={dateRef}
        type="date"
        value={date}
        onChange={handleChange}
      />
    </Box>
  );
};

export default CustomDatePicker;
