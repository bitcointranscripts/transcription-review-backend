import { Container, ContainerProps } from "@chakra-ui/react";
import React from "react";

type Props = {
  children: React.ReactNode;
} & Omit<ContainerProps, "children">;

const GlobalContainer: React.FC<Props> = ({ children, ...chakraProps }) => {
  return (
    <Container maxW="container.xl" {...chakraProps}>
      {children}
    </Container>
  );
};

export default GlobalContainer;
