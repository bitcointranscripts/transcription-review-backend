import {
  Box,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Text,
} from "@chakra-ui/react";

type Props = {
  trigger?: React.ReactNode;
  children: React.ReactNode;
  title?: React.ReactNode;
};

const TablePopover: React.FC<Props> = ({ trigger, children, title }) => {
  return (
    <Popover placement="bottom">
      {({ isOpen }) => (
        <>
          <PopoverTrigger>
            <Box opacity={isOpen ? 0 : 1}>{trigger}</Box>
          </PopoverTrigger>
          <PopoverContent
            w="auto"
            minW="100px"
            top="-50px"
            overflow="hidden"
            border={0}
            boxShadow="lg"
          >
            {title ? (
              <PopoverHeader bgColor="blackAlpha.900" border={0}>
                <Text
                  textTransform="capitalize"
                  fontWeight="bold"
                  fontSize="12px"
                  color="gray.200"
                  bgColor="blackAlpha.900"
                >
                  {title}
                </Text>
              </PopoverHeader>
            ) : null}
            <PopoverBody>{children}</PopoverBody>
          </PopoverContent>
        </>
      )}
    </Popover>
  );
};

export default TablePopover;
