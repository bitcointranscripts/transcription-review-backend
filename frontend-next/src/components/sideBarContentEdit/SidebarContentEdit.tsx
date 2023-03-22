import { dateFormatGeneral, getTimeLeftText } from "@/utils";
import { Box, Flex, Input, Text } from "@chakra-ui/react";
import Link from "next/link";
import { useState } from "react";
import { MdOutlineAccessTimeFilled } from "react-icons/md";
import { Transcript } from "../../../types";
import CustomDatePicker from "./CustomDatePicker";
import SelectField from "./SelectField";
import TextField from "./TextField";

export type RenderProps = {
  // eslint-disable-next-line no-unused-vars
  (editedContent: {
    editedTitle: string;
    editedSpeakers: string[];
    editedCategories: string[];
    editedDate: string;
  }): React.ReactNode;
};

const SidebarContentEdit = ({
  data,
  children,
}: {
  data: Transcript;
  children?: RenderProps;
}) => {
  const [editedTitle, setEditedTitle] = useState("");
  const [editedSpeakers, setEditedSpeakers] = useState<string[]>([]);
  const [editedCategories, setEditedCategories] = useState<string[]>([]);

  const dateStringFormat = dateFormatGeneral(data?.createdAt, true) as string;
  const [editedDate, setEditedDate] = useState<string>(dateStringFormat || "");

  const updateTitle = (newTitle: string) => {
    setEditedTitle(newTitle);
  };
  const updateSpeaker = (speakers: string[]) => {
    setEditedSpeakers(speakers);
  };
  const updateCategories = (categories: string[]) => {
    setEditedCategories(categories);
  };
  return (
    <Box
      w="full"
      flex="1 1 30%"
      top={14}
      position="sticky"
      p={4}
      boxShadow="lg"
      borderRadius="lg"
      border="2px solid"
      borderColor="gray.200"
      fontSize="14px"
    >
      <Flex direction="column" gap={6}>
        <Box
          display="flex"
          gap={2}
          fontSize="16px"
          fontWeight={700}
          lineHeight={1}
          color="red.700"
          ml="auto"
        >
          <span>
            <MdOutlineAccessTimeFilled />
          </span>
          <span>{getTimeLeftText(data.createdAt)}</span>
        </Box>
        <Box>
          <Text fontWeight={600} mb={2}>
            Original Media
          </Text>
          <Link href={data.originalContent?.media || ""}>
            <Box
              display="inline-block"
              bgColor="red.600"
              p={2}
              fontSize="12px"
              borderRadius="md"
              color="white"
              fontWeight={700}
              width="auto"
            >
              Youtube
            </Box>
          </Link>
        </Box>
        <Box>
          <Text fontWeight={600} mb={2}>
            Title
          </Text>
          <TextField
            data={data.originalContent.title}
            editedData={editedTitle}
            updateData={updateTitle}
          />
        </Box>
        <Box>
          <Text fontWeight={600} mb={2}>
            Speakers
          </Text>
          <SelectField
            name="speakers"
            data={data.originalContent.speakers ?? []}
            editedData={editedSpeakers}
            updateData={updateSpeaker}
          />
        </Box>
        <Box>
          <Text display="inline-block" fontWeight={600} mb={2}>
            Date
          </Text>
          <Text ml={3} display="inline-block" color="gray.400">
            YYYY-MM-DD format
          </Text>

          <CustomDatePicker date={editedDate} onChange={setEditedDate} />

          {/* <Input
            fontSize="12px"
            type="date"
            value={editedDate}
            onChange={(e) => setEditedDate(e.target.value)}
          /> */}
        </Box>
        <Box>
          <Text fontWeight={600} mb={2}>
            Categories
          </Text>
          <SelectField
            name="categories"
            data={data.originalContent.categories ?? []}
            editedData={editedCategories}
            updateData={updateCategories}
          />
        </Box>
        {children &&
          children({
            editedTitle,
            editedSpeakers,
            editedCategories,
            editedDate,
          })}
      </Flex>
    </Box>
  );
};

export default SidebarContentEdit;
