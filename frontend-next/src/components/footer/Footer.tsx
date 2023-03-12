import { Box, Divider, Flex, Text } from "@chakra-ui/react";
import React from "react";
import GlobalContainer from "../GlobalContainer";

const Footer = () => {
  return (
    <Box bgColor="gray.800">
      <GlobalContainer py={8}>
        <Flex mb={5}>
          <Flex color="gray.100" gap={2} fontSize="12px">
            <Text>Copyright © {new Date().getFullYear()}</Text>
            <Divider orientation="vertical" />
            <Text>All Rights Reserved.</Text>
          </Flex>
        </Flex>
      </GlobalContainer>
    </Box>
  );
};

export default Footer;
